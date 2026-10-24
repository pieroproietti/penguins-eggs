package census

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"coa/pkg/distro"
	"coa/pkg/parser"
)

const (
	DefaultEndpoint = "https://penguins-eggs.net/api/census"
	DefaultTimeout  = 2500 * time.Millisecond

	machineIDPath            = "/etc/machine-id"
	dbusMachineIDPath        = "/var/lib/dbus/machine-id"
	systemCensusIDPath       = "/etc/penguins-eggs/.census_id"
	systemCensusDirDPath     = "/etc/penguins-eggs.d/.census_id"
	systemCensusJSONPath     = "/etc/penguins-eggs/census.json"
	systemCensusDirDJSONPath = "/etc/penguins-eggs.d/census.json"
	systemParentIDPath       = "/etc/penguins-eggs.d/parent-id"
	systemParentIDDirDPath   = "/etc/penguins-eggs/parent-id"
)

// Endpoint can be overridden in tests.
var Endpoint = DefaultEndpoint

// DistroInfo represents the distribution metadata in the census payload.
type DistroInfo struct {
	ID       string `json:"id"`
	Like     string `json:"like"`
	Codename string `json:"codename"`
	Release  string `json:"release"`
}

// SystemInfo represents the host system metadata in the census payload.
type SystemInfo struct {
	Arch          string `json:"arch"`
	Desktop       string `json:"desktop"`
	DisplayServer string `json:"display_server"`
	Virt          string `json:"virt"`
	Init          string `json:"init"`
}

// OptionsInfo represents the execution options in the census payload.
type OptionsInfo struct {
	Clone bool `json:"clone"`
}

// Payload defines the JSON structure sent to the census endpoint.
type Payload struct {
	UUID        string      `json:"uuid"`
	ParentID    string      `json:"parent_id,omitempty"`
	EggsVersion string      `json:"eggs_version"`
	Action      string      `json:"action"`
	Distro      DistroInfo  `json:"distro"`
	System      SystemInfo  `json:"system"`
	Options     OptionsInfo `json:"options"`
}

// EventOptions holds the parameters passed by callers (remaster / sysinstall).
type EventOptions struct {
	Action      string
	EggsVersion string
	Anonymous   bool
	Clone       bool
	Distro      *distro.Distro
	TargetRoot  string
	TargetUser  string
	ParentID    string
}

// ShouldSkip evaluates all privacy and opt-out rules:
// 1. Explicit --anonymous flag
// 2. Global opt-out via EGGS_ANONYMOUS environment variable
// 3. Global opt-out via custom.yaml configuration
func ShouldSkip(anonymousFlag bool) bool {
	if anonymousFlag {
		return true
	}

	envVal := strings.TrimSpace(strings.ToLower(os.Getenv("EGGS_ANONYMOUS")))
	if envVal == "1" || envVal == "true" || envVal == "yes" {
		return true
	}

	if cfg, err := parser.LoadCustomSettings(); err == nil && cfg != nil {
		if cfg.Anonymous || cfg.Remaster.Anonymous {
			return true
		}
	}

	return false
}

// Send dispatches the census telemetry with a strict timeout.
// It fails completely silently on any error and never alters CLI exit behavior.
func Send(opts EventOptions) {
	defer func() {
		_ = recover()
	}()

	if ShouldSkip(opts.Anonymous) {
		return
	}

	if opts.EggsVersion == "" {
		opts.EggsVersion = strings.TrimSpace(os.Getenv("EGGS_VERSION"))
	}
	opts.EggsVersion = strings.TrimSpace(strings.TrimPrefix(opts.EggsVersion, "penguins-eggs "))

	targetRoot := resolveTargetRoot(opts.TargetRoot, opts.Action)

	uuid, err := getOrCreateUUIDForTarget(targetRoot)
	if err != nil || uuid == "" {
		return
	}

	payload := BuildPayload(uuid, opts)
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), DefaultTimeout)
	defer cancel()

	saveDone := make(chan struct{})
	go func() {
		defer close(saveDone)
		defer func() {
			_ = recover()
		}()
		saveLocalPayload(data)
		if targetRoot != "" {
			saveTargetPayload(data, targetRoot, opts.TargetUser)
		}
	}()

	httpDone := make(chan struct{})
	go func() {
		defer close(httpDone)
		defer func() {
			_ = recover()
		}()

		req, err := http.NewRequestWithContext(ctx, http.MethodPost, Endpoint, bytes.NewReader(data))
		if err != nil {
			return
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "penguins-eggs/"+opts.EggsVersion)

		client := &http.Client{
			Timeout: DefaultTimeout,
		}
		resp, err := client.Do(req)
		if err != nil {
			return
		}
		defer resp.Body.Close()
		_, _ = io.Copy(io.Discard, resp.Body)
	}()

	select {
	case <-saveDone:
	case <-ctx.Done():
	}

	select {
	case <-httpDone:
	case <-ctx.Done():
	}
}

// BuildPayload constructs the Payload from the current system and EventOptions.
func BuildPayload(uuid string, opts EventOptions) Payload {
	d := opts.Distro
	if d == nil {
		d = distro.NewDistro()
	}

	arch := d.Arch
	if arch == "" {
		arch = runtime.GOARCH
	}

	parentID := strings.TrimSpace(opts.ParentID)
	if parentID == "" {
		parentID = DetectParentID(opts.TargetRoot)
	}
	if parentID == "" {
		parentID = DetectParentIDFromSource("")
	}

	return Payload{
		UUID:        uuid,
		ParentID:    parentID,
		EggsVersion: opts.EggsVersion,
		Action:      opts.Action,
		Distro: DistroInfo{
			ID:       strings.ToLower(d.DistroID),
			Like:     strings.ToLower(d.DistroLike),
			Codename: strings.ToLower(d.CodenameID),
			Release:  d.ReleaseID,
		},
		System: SystemInfo{
			Arch:          arch,
			Desktop:       detectDesktop(),
			DisplayServer: detectDisplayServer(),
			Virt:          detectVirt(),
			Init:          detectInit(),
		},
		Options: OptionsInfo{
			Clone: opts.Clone,
		},
	}
}

func isDir(path string) bool {
	if path == "" {
		return false
	}
	fi, err := os.Stat(path)
	return err == nil && fi.IsDir()
}

func resolveTargetRoot(explicit, action string) string {
	if explicit = strings.TrimSpace(explicit); explicit != "" && isDir(explicit) {
		return explicit
	}
	if action != "sysinstall" {
		return ""
	}
	if envRoot := strings.TrimSpace(os.Getenv("TARGET_ROOT")); envRoot != "" && isDir(envRoot) {
		return envRoot
	}
	if matches, err := filepath.Glob("/tmp/calamares-root-*"); err == nil {
		for _, m := range matches {
			if isDir(filepath.Join(m, "etc")) {
				return m
			}
		}
	}
	return ""
}

func saveLocalPayload(data []byte) {
	paths, sudoUID, sudoGID, sudoHome := candidatePayloadPaths()

	wrotePrimary := false
	for _, p := range paths {
		dir := filepath.Dir(p)
		if err := os.MkdirAll(dir, 0755); err != nil {
			continue
		}
		if err := os.WriteFile(p, data, 0644); err == nil {
			if sudoUID >= 0 && sudoGID >= 0 && sudoHome != "" && strings.HasPrefix(p, sudoHome+string(filepath.Separator)) {
				_ = os.Chown(filepath.Join(sudoHome, ".config"), sudoUID, sudoGID)
				_ = os.Chown(dir, sudoUID, sudoGID)
				_ = os.Chown(p, sudoUID, sudoGID)
			}
			wrotePrimary = true
			break
		}
	}

	// When running as root (outside isolated HOME unit tests), also persist a system-wide copy
	// in /etc/penguins-eggs/census.json so it is never hidden solely under /root/.config.
	if wrotePrimary && os.Geteuid() == 0 && strings.TrimSpace(os.Getenv("EGGS_CENSUS_PAYLOAD_PATH")) == "" {
		homeEnv := strings.TrimSpace(os.Getenv("HOME"))
		if homeEnv == "" || homeEnv == "/root" || (sudoHome != "" && homeEnv == sudoHome) {
			sysDir := filepath.Dir(systemCensusJSONPath)
			if err := os.MkdirAll(sysDir, 0755); err == nil {
				_ = os.WriteFile(systemCensusJSONPath, data, 0644)
			}
		}
	}
}

// saveTargetPayload copies census.json into the installed target filesystem
// (<targetRoot>/etc/penguins-eggs/census.json and <targetRoot>/home/<user>/.config/penguins-eggs/census.json)
// so the user finds it immediately after first boot.
func saveTargetPayload(data []byte, targetRoot, targetUser string) {
	if !isDir(targetRoot) {
		return
	}

	targetEtcDir := filepath.Join(targetRoot, "etc", "penguins-eggs")
	if err := os.MkdirAll(targetEtcDir, 0755); err == nil {
		_ = os.WriteFile(filepath.Join(targetEtcDir, "census.json"), data, 0644)
	}

	var p Payload
	if err := json.Unmarshal(data, &p); err == nil && p.ParentID != "" {
		targetDirD := filepath.Join(targetRoot, "etc", "penguins-eggs.d")
		if err := os.MkdirAll(targetDirD, 0755); err == nil {
			_ = os.WriteFile(filepath.Join(targetDirD, "parent-id"), []byte(p.ParentID+"\n"), 0644)
		}
	}

	// Purge stale .census_id residues from target so the freshly installed machine
	// always derives its unique identity from its newly generated /etc/machine-id,
	// while preserving etc/penguins-eggs.d/parent-id.
	_ = os.Remove(filepath.Join(targetRoot, "etc", "penguins-eggs", ".census_id"))
	_ = os.Remove(filepath.Join(targetRoot, "etc", "penguins-eggs.d", ".census_id"))

	seenUsers := make(map[string]bool)
	var userDirs []string
	addUserDir := func(uname string) {
		uname = strings.TrimSpace(uname)
		if uname == "" || uname == "eggs" || uname == "lost+found" || seenUsers[uname] {
			return
		}
		uhome := filepath.Join(targetRoot, "home", uname)
		if isDir(uhome) {
			seenUsers[uname] = true
			userDirs = append(userDirs, uhome)
		}
	}

	addUserDir(targetUser)
	if entries, err := os.ReadDir(filepath.Join(targetRoot, "home")); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				addUserDir(entry.Name())
			}
		}
	}

	for _, uhome := range userDirs {
		uid, gid := dirOwner(uhome)
		cfgDir := filepath.Join(uhome, ".config")
		eggsDir := filepath.Join(cfgDir, "penguins-eggs")
		if err := os.MkdirAll(eggsDir, 0755); err != nil {
			continue
		}
		p := filepath.Join(eggsDir, "census.json")
		if err := os.WriteFile(p, data, 0644); err == nil && uid >= 0 && gid >= 0 {
			_ = os.Chown(cfgDir, uid, gid)
			_ = os.Chown(eggsDir, uid, gid)
			_ = os.Chown(p, uid, gid)
		}
	}
}

func dirOwner(path string) (uid int, gid int) {
	fi, err := os.Stat(path)
	if err != nil {
		return -1, -1
	}
	if st, ok := fi.Sys().(*syscall.Stat_t); ok && st != nil {
		return int(st.Uid), int(st.Gid)
	}
	return -1, -1
}

func resolveSudoIdentity() (sudoUID int, sudoGID int, sudoHome string) {
	sudoUID = -1
	sudoGID = -1
	if os.Geteuid() != 0 {
		return sudoUID, sudoGID, sudoHome
	}

	if envUID, err := strconv.Atoi(strings.TrimSpace(os.Getenv("SUDO_UID"))); err == nil && envUID > 0 {
		sudoUID = envUID
	}
	if envGID, err := strconv.Atoi(strings.TrimSpace(os.Getenv("SUDO_GID"))); err == nil && envGID >= 0 {
		sudoGID = envGID
	}

	if sudoUser := strings.TrimSpace(os.Getenv("SUDO_USER")); sudoUser != "" && sudoUser != "root" {
		if u, err := user.Lookup(sudoUser); err == nil && u.HomeDir != "" {
			sudoHome = u.HomeDir
			if uid, err := strconv.Atoi(u.Uid); err == nil {
				sudoUID = uid
			}
			if gid, err := strconv.Atoi(u.Gid); err == nil {
				sudoGID = gid
			}
		} else {
			sudoHome = filepath.Join("/home", sudoUser)
		}
		return sudoUID, sudoGID, sudoHome
	}

	if pkUIDStr := strings.TrimSpace(os.Getenv("PKEXEC_UID")); pkUIDStr != "" && pkUIDStr != "0" {
		if u, err := user.LookupId(pkUIDStr); err == nil && u.HomeDir != "" {
			sudoHome = u.HomeDir
			if uid, err := strconv.Atoi(u.Uid); err == nil {
				sudoUID = uid
			}
			if gid, err := strconv.Atoi(u.Gid); err == nil {
				sudoGID = gid
			}
			return sudoUID, sudoGID, sudoHome
		}
	}

	// Fallback when invoked as root without SUDO_USER (e.g. su - or root launcher):
	// if /home has a normal user directory (UID >= 1000), use it.
	if entries, err := os.ReadDir("/home"); err == nil {
		for _, entry := range entries {
			name := entry.Name()
			if !entry.IsDir() || name == "eggs" || name == "lost+found" {
				continue
			}
			candidate := filepath.Join("/home", name)
			if uid, gid := dirOwner(candidate); uid >= 1000 && gid >= 0 {
				return uid, gid, candidate
			}
		}
	}

	return sudoUID, sudoGID, sudoHome
}

func candidatePayloadPaths() (paths []string, sudoUID int, sudoGID int, sudoHome string) {
	sudoUID = -1
	sudoGID = -1

	if customPath := strings.TrimSpace(os.Getenv("EGGS_CENSUS_PAYLOAD_PATH")); customPath != "" {
		return []string{customPath}, sudoUID, sudoGID, sudoHome
	}

	seen := make(map[string]bool)
	addPath := func(p string) {
		if p != "" && !seen[p] {
			seen[p] = true
			paths = append(paths, p)
		}
	}

	if os.Geteuid() == 0 && strings.TrimSpace(os.Getenv("XDG_CONFIG_HOME")) == "" {
		sudoUID, sudoGID, sudoHome = resolveSudoIdentity()
		homeEnv := strings.TrimSpace(os.Getenv("HOME"))
		if homeEnv == "" || homeEnv == "/root" || (sudoHome != "" && homeEnv == sudoHome) {
			if sudoHome != "" {
				addPath(filepath.Join(sudoHome, ".config", "penguins-eggs", "census.json"))
			}
			addPath(systemCensusJSONPath)
			addPath(systemCensusDirDJSONPath)
		}
	}

	if cfgDir, err := os.UserConfigDir(); err == nil && cfgDir != "" {
		addPath(filepath.Join(cfgDir, "penguins-eggs", "census.json"))
	} else if homeDir, err := os.UserHomeDir(); err == nil && homeDir != "" {
		addPath(filepath.Join(homeDir, ".config", "penguins-eggs", "census.json"))
	}

	addPath(systemCensusJSONPath)
	addPath(systemCensusDirDJSONPath)

	return paths, sudoUID, sudoGID, sudoHome
}

func getOrCreateUUID() (string, error) {
	return getOrCreateUUIDForTarget("")
}

func getOrCreateUUIDForTarget(targetRoot string) (string, error) {
	if customMachineID := strings.TrimSpace(os.Getenv("EGGS_MACHINE_ID_PATH")); customMachineID != "" {
		if id, ok := readAndDeriveMachineID(customMachineID); ok {
			return id, nil
		}
	} else if strings.TrimSpace(os.Getenv("EGGS_CENSUS_ID_PATH")) == "" {
		var machinePaths []string
		if targetRoot != "" {
			machinePaths = append(machinePaths,
				filepath.Join(targetRoot, "etc", "machine-id"),
				filepath.Join(targetRoot, "var", "lib", "dbus", "machine-id"),
			)
		}
		machinePaths = append(machinePaths, machineIDPath, dbusMachineIDPath)
		for _, p := range machinePaths {
			if id, ok := readAndDeriveMachineID(p); ok {
				return id, nil
			}
		}
	}

	paths := candidateUUIDPaths()

	for _, p := range paths {
		if data, err := os.ReadFile(p); err == nil {
			id := strings.TrimSpace(string(data))
			if isValidUUID(id) {
				return id, nil
			}
		}
	}

	newID, err := generateUUIDv4()
	if err != nil {
		return "", err
	}

	for _, p := range paths {
		dir := filepath.Dir(p)
		if err := os.MkdirAll(dir, 0755); err != nil {
			continue
		}
		if err := os.WriteFile(p, []byte(newID+"\n"), 0644); err == nil {
			return newID, nil
		}
	}

	return newID, nil
}

func readAndDeriveMachineID(path string) (string, bool) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", false
	}
	mid := strings.TrimSpace(string(data))
	if !isValidMachineID(mid) {
		return "", false
	}
	return deriveUUIDFromMachineID(mid), true
}

func isValidMachineID(s string) bool {
	if len(s) != 32 {
		return false
	}
	allZero := true
	for i := 0; i < len(s); i++ {
		c := s[i]
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
		if c != '0' {
			allZero = false
		}
	}
	return !allZero
}

// DeriveUUIDFromMachineID derives a deterministic RFC 4122 v5 UUID from a raw machine-id string.
func DeriveUUIDFromMachineID(machineID string) string {
	return deriveUUIDFromMachineID(machineID)
}

func deriveUUIDFromMachineID(machineID string) string {
	normalized := strings.ToLower(strings.TrimSpace(machineID))
	sum := sha256.Sum256([]byte("penguins-eggs-census:" + normalized))
	var b [16]byte
	copy(b[:], sum[:16])
	b[6] = (b[6] & 0x0f) | 0x50 // Version 5 (name-based deterministic UUID)
	b[8] = (b[8] & 0x3f) | 0x80 // Variant RFC 4122
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// GetAnonymizedMachineID returns the anonymized UUID derived from the host machine-id,
// or a fallback UUID if machine-id is not available or uninitialized.
func GetAnonymizedMachineID() string {
	if customMachineID := strings.TrimSpace(os.Getenv("EGGS_MACHINE_ID_PATH")); customMachineID != "" {
		if id, ok := readAndDeriveMachineID(customMachineID); ok {
			return id
		}
	}

	for _, p := range []string{machineIDPath, dbusMachineIDPath} {
		if id, ok := readAndDeriveMachineID(p); ok {
			return id
		}
	}

	if u, err := getOrCreateUUID(); err == nil && u != "" {
		return u
	}
	return ""
}

// InjectParentIDToLiveRoot writes the parent-id (anonymized machine-id of the current host)
// into <liveRoot>/etc/penguins-eggs.d/parent-id so that it is included inside the SquashFS.
// It strictly guards against writing to the real host root ("/", "", or clean == "/").
func InjectParentIDToLiveRoot(liveRoot string) (string, error) {
	clean := filepath.Clean(strings.TrimSpace(liveRoot))
	if clean == "" || clean == "/" || clean == "." {
		return "", fmt.Errorf("invalid liveRoot destination: %q", liveRoot)
	}
	parentID := GetAnonymizedMachineID()
	if parentID == "" {
		return "", fmt.Errorf("unable to determine anonymized machine-id")
	}
	targetDir := filepath.Join(clean, "etc", "penguins-eggs.d")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", err
	}
	targetFile := filepath.Join(targetDir, "parent-id")
	if err := os.WriteFile(targetFile, []byte(parentID+"\n"), 0644); err != nil {
		return "", err
	}
	return parentID, nil
}

// DetectParentID attempts to discover the parent-id from environment variables,
// target root filesystem, or system locations (/etc/penguins-eggs.d/parent-id, sibling.yaml).
func DetectParentID(targetRoot string) string {
	if custom := strings.TrimSpace(os.Getenv("EGGS_PARENT_ID")); custom != "" && isValidUUID(custom) {
		return custom
	}
	if customPath := strings.TrimSpace(os.Getenv("EGGS_PARENT_ID_PATH")); customPath != "" {
		if id := readParentIDFromFile(customPath); id != "" {
			return id
		}
	}

	var candidateFiles []string
	if targetRoot != "" {
		candidateFiles = append(candidateFiles,
			filepath.Join(targetRoot, "etc", "penguins-eggs.d", "parent-id"),
			filepath.Join(targetRoot, "etc", "penguins-eggs", "parent-id"),
			filepath.Join(targetRoot, "etc", "penguins-eggs.d", "sibling.yaml"),
			filepath.Join(targetRoot, "etc", "penguins-eggs", "sibling.yaml"),
		)
	}
	candidateFiles = append(candidateFiles,
		systemParentIDPath,
		systemParentIDDirDPath,
		"/etc/penguins-eggs.d/sibling.yaml",
		"/etc/penguins-eggs/sibling.yaml",
	)

	for _, f := range candidateFiles {
		if id := readParentIDFromFile(f); id != "" {
			return id
		}
	}

	return ""
}

func readParentIDFromFile(p string) string {
	data, err := os.ReadFile(p)
	if err != nil {
		return ""
	}
	content := strings.TrimSpace(string(data))
	if strings.HasSuffix(p, ".yaml") || strings.HasSuffix(p, ".yml") {
		for _, line := range strings.Split(content, "\n") {
			line = strings.TrimSpace(line)
			if strings.HasPrefix(line, "parent_id:") || strings.HasPrefix(line, "parent-id:") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
					if isValidUUID(val) {
						return val
					}
				}
			}
		}
		return ""
	}
	if isValidUUID(content) {
		return content
	}
	return ""
}

// DetectParentIDFromSource inspects the running system, live media, or source squashfs/iso image
// to determine the parent-id saved during remaster.
func DetectParentIDFromSource(squashfsPath string) string {
	if id := DetectParentID(""); id != "" {
		return id
	}

	var candidates []string

	if squashfsPath != "" {
		dir := filepath.Dir(squashfsPath)
		candidates = append(candidates,
			filepath.Join(dir, "parent_id"),
			filepath.Join(dir, "live", "parent_id"),
			filepath.Join(dir, "..", "parent_id"),
			filepath.Join(dir, "..", "live", "parent_id"),
			filepath.Join(dir, "..", "..", "parent_id"),
		)
	}

	// Standard live media mountpoints across supported distributions
	candidates = append(candidates,
		"/run/live/medium/parent_id",
		"/run/live/medium/live/parent_id",
		"/lib/live/mount/medium/parent_id",
		"/lib/live/mount/medium/live/parent_id",
		"/run/archiso/bootmnt/parent_id",
		"/run/miso/bootmnt/parent_id",
		"/run/initramfs/live/parent_id",
		"/run/initramfs/live/live/parent_id",
		"/live/parent_id",
	)

	for _, c := range candidates {
		if id := readParentIDFromFile(c); id != "" {
			return id
		}
	}

	if squashfsPath != "" {
		if _, err := os.Stat(squashfsPath); err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 1500*time.Millisecond)
			defer cancel()

			if strings.HasSuffix(squashfsPath, ".iso") {
				for _, target := range []string{"parent_id", "live/parent_id"} {
					if out, err := exec.CommandContext(ctx, "bsdtar", "-O", "-xf", squashfsPath, target).Output(); err == nil {
						id := strings.TrimSpace(string(out))
						if isValidUUID(id) {
							return id
						}
					}
				}
			} else {
				// 1. Try reading parent_id / live/parent_id / etc/penguins-eggs.d/parent-id from squashfs
				for _, target := range []string{"parent_id", "live/parent_id", "etc/penguins-eggs.d/parent-id"} {
					if out, err := exec.CommandContext(ctx, "unsquashfs", "-cat", squashfsPath, target).Output(); err == nil {
						id := strings.TrimSpace(string(out))
						if isValidUUID(id) {
							return id
						}
					}
				}

				// 2. Try reading etc/penguins-eggs.d/sibling.yaml from squashfs
				if out, err := exec.CommandContext(ctx, "unsquashfs", "-cat", squashfsPath, "etc/penguins-eggs.d/sibling.yaml").Output(); err == nil {
					for _, line := range strings.Split(string(out), "\n") {
						line = strings.TrimSpace(line)
						if strings.HasPrefix(line, "parent_id:") || strings.HasPrefix(line, "parent-id:") {
							parts := strings.SplitN(line, ":", 2)
							if len(parts) == 2 {
								val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
								if isValidUUID(val) {
									return val
								}
							}
						}
					}
				}
			}
		}
	}

	return ""
}

func candidateUUIDPaths() []string {
	var paths []string
	if customPath := strings.TrimSpace(os.Getenv("EGGS_CENSUS_ID_PATH")); customPath != "" {
		return []string{customPath}
	}

	if os.Geteuid() == 0 {
		paths = append(paths, systemCensusIDPath, systemCensusDirDPath)
	}

	if cfgDir, err := os.UserConfigDir(); err == nil && cfgDir != "" {
		paths = append(paths, filepath.Join(cfgDir, "penguins-eggs", ".census_id"))
	}

	if os.Geteuid() != 0 {
		paths = append(paths, systemCensusIDPath, systemCensusDirDPath)
	}

	return paths
}

func generateUUIDv4() (string, error) {
	var b [16]byte
	if _, err := io.ReadFull(rand.Reader, b[:]); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40 // Version 4
	b[8] = (b[8] & 0x3f) | 0x80 // Variant RFC 4122
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}

func isValidUUID(u string) bool {
	if len(u) != 36 {
		return false
	}
	for i, c := range u {
		switch i {
		case 8, 13, 18, 23:
			if c != '-' {
				return false
			}
		default:
			if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
				return false
			}
		}
	}
	return true
}

func isIgnoredDesktopSession(s string) bool {
	s = strings.ToLower(strings.TrimSpace(s))
	switch s {
	case "lightdm-xsession", "xsession", "default", "custom", "ssh", "none":
		return true
	default:
		return false
	}
}

// NormalizeDesktop normalizes raw desktop environment strings (from env vars or session names)
// to a canonical identifier (e.g., "kde", "gnome", "xfce", "cli").
func NormalizeDesktop(raw string) string {
	d := strings.ToLower(strings.TrimSpace(raw))
	if d == "" || isIgnoredDesktopSession(d) {
		return "cli"
	}

	// Controlli per le corrispondenze principali
	// Nota: controlliamo budgie, pantheon e cosmic prima di gnome,
	// poiché ambienti come Budgie e Pantheon possono dichiarare "Budgie:GNOME" o "Pantheon:GNOME".
	if strings.Contains(d, "cinnamon") {
		return "cinnamon"
	}
	if strings.Contains(d, "budgie") {
		return "budgie"
	}
	if strings.Contains(d, "pantheon") {
		return "pantheon"
	}
	if strings.Contains(d, "cosmic") {
		return "cosmic"
	}
	if strings.Contains(d, "gnome") || strings.HasPrefix(d, "ubuntu") || strings.HasPrefix(d, "pop") {
		return "gnome"
	}
	if strings.Contains(d, "plasma") || strings.Contains(d, "kde") {
		return "kde"
	}
	if strings.Contains(d, "xfce") {
		return "xfce"
	}
	if strings.Contains(d, "mate") {
		return "mate"
	}
	if strings.Contains(d, "lxqt") {
		return "lxqt"
	}
	if strings.Contains(d, "lxde") {
		return "lxde"
	}
	if strings.Contains(d, "deepin") || strings.Contains(d, "dde") {
		return "deepin"
	}
	if strings.Contains(d, "ukui") {
		return "ukui"
	}
	if strings.Contains(d, "enlightenment") {
		return "enlightenment"
	}
	if strings.Contains(d, "hyprland") {
		return "hyprland"
	}
	if strings.Contains(d, "sway") {
		return "sway"
	}
	if strings.Contains(d, "i3") {
		return "i3"
	}
	if strings.Contains(d, "openbox") {
		return "openbox"
	}

	// finestre minimali / tiling / window manager custom
	if strings.Contains(d, "dwm") {
		return "dwm"
	}
	
	if strings.Contains(d, "jwm") {
		return "jwm"
	}

	// Se ci sono valori multipli separati da due punti (XDG_CURRENT_DESKTOP) non riconosciuti sopra,
	// estraiamo il primo elemento valido.
	if strings.Contains(d, ":") {
		for _, part := range strings.Split(d, ":") {
			part = strings.TrimSpace(part)
			if part != "" && !isIgnoredDesktopSession(part) {
				d = part
				break
			}
		}
	}

	// Fallback: rimozione prefissi e suffissi comuni
	d = strings.TrimPrefix(d, "x-")

	suffixes := []string{"-x11", "-wayland", "-xorg", "-session"}
	for _, suffix := range suffixes {
		if strings.HasSuffix(d, suffix) {
			d = strings.TrimSuffix(d, suffix)
			break
		}
	}

	if d == "" || isIgnoredDesktopSession(d) {
		return "cli"
	}

	return d
}

func normalizeDesktopName(name string) string {
	return NormalizeDesktop(name)
}

func detectDesktop() string {
	for _, envKey := range []string{"XDG_CURRENT_DESKTOP", "DESKTOP_SESSION", "XDG_SESSION_DESKTOP"} {
		if val := strings.TrimSpace(os.Getenv(envKey)); val != "" {
			if !isIgnoredDesktopSession(val) {
				norm := NormalizeDesktop(val)
				if norm != "cli" && !isIgnoredDesktopSession(norm) {
					return norm
				}
			}
		}
	}

	xsessionsDir := "/usr/share/xsessions"
	if custom := strings.TrimSpace(os.Getenv("EGGS_XSESSIONS_PATH")); custom != "" {
		xsessionsDir = custom
	}
	waylandSessionsDir := "/usr/share/wayland-sessions"
	if custom := strings.TrimSpace(os.Getenv("EGGS_WAYLAND_SESSIONS_PATH")); custom != "" {
		waylandSessionsDir = custom
	}

	var candidateSessions []string
	for _, dir := range []string{xsessionsDir, waylandSessionsDir} {
		if files, err := filepath.Glob(filepath.Join(dir, "*.desktop")); err == nil {
			for _, file := range files {
				base := strings.TrimSuffix(filepath.Base(file), ".desktop")
				if !isIgnoredDesktopSession(base) {
					norm := NormalizeDesktop(base)
					if norm != "cli" && !isIgnoredDesktopSession(norm) {
						candidateSessions = append(candidateSessions, norm)
					}
				}
			}
		}
	}

	desktopBins := []struct {
		bin  string
		name string
	}{
		{"gnome-session", "gnome"},
		{"startplasma-x11", "kde"},
		{"startplasma-wayland", "kde"},
		{"xfce4-session", "xfce"},
		{"cinnamon-session", "cinnamon"},
		{"mate-session", "mate"},
		{"lxqt-session", "lxqt"},
		{"lxsession", "lxde"},
		{"budgie-session", "budgie"},
		{"deepin-session", "deepin"},
		{"dde-session", "deepin"},
		{"ukui-session", "ukui"},
		{"pantheon-session", "pantheon"},
		{"enlightenment_start", "enlightenment"},
		{"enlightenment", "enlightenment"},
		{"cosmic-session", "cosmic"},
		{"Hyprland", "hyprland"},
		{"hyprland", "hyprland"},
		{"sway", "sway"},
		{"i3", "i3"},
		{"openbox-session", "openbox"},
		{"openbox", "openbox"},
	}

	// Prefer a candidate session that matches an installed desktop binary
	for _, s := range candidateSessions {
		for _, db := range desktopBins {
			if s == db.name {
				if _, err := exec.LookPath(db.bin); err == nil {
					return s
				}
			}
		}
	}

	// If candidate sessions were found, return the first non-ignored candidate
	if len(candidateSessions) > 0 {
		return candidateSessions[0]
	}

	// If no session files exist, check if any desktop binary is on PATH
	for _, db := range desktopBins {
		if _, err := exec.LookPath(db.bin); err == nil {
			return db.name
		}
	}

	return "cli"
}

// DetectDisplayServer detects whether the graphical session uses wayland, x11, or falls back to cli.
func DetectDisplayServer() string {
	return detectDisplayServer()
}

func detectDisplayServer() string {
	if val := strings.TrimSpace(os.Getenv("WAYLAND_DISPLAY")); val != "" {
		return "wayland"
	}

	sessionType := strings.ToLower(strings.TrimSpace(os.Getenv("XDG_SESSION_TYPE")))
	switch sessionType {
	case "wayland":
		return "wayland"
	case "x11":
		return "x11"
	case "tty":
		return "cli"
	}

	if val := strings.TrimSpace(os.Getenv("DISPLAY")); val != "" {
		return "x11"
	}

	return "cli"
}

func detectVirt() string {
	if path, err := exec.LookPath("systemd-detect-virt"); err == nil {
		ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
		defer cancel()
		if out, err := exec.CommandContext(ctx, path).Output(); err == nil {
			v := strings.TrimSpace(string(out))
			if v != "" {
				return strings.ToLower(v)
			}
		}
	}

	for _, dmiFile := range []string{
		"/sys/class/dmi/id/product_name",
		"/sys/class/dmi/id/sys_vendor",
		"/sys/class/dmi/id/board_vendor",
	} {
		if data, err := os.ReadFile(dmiFile); err == nil {
			s := strings.ToLower(strings.TrimSpace(string(data)))
			switch {
			case strings.Contains(s, "kvm") || strings.Contains(s, "qemu"):
				return "kvm"
			case strings.Contains(s, "virtualbox") || strings.Contains(s, "innotek"):
				return "oracle"
			case strings.Contains(s, "vmware"):
				return "vmware"
			case strings.Contains(s, "virtual machine") || strings.Contains(s, "microsoft"):
				return "microsoft"
			case strings.Contains(s, "xen"):
				return "xen"
			case strings.Contains(s, "bochs"):
				return "bochs"
			case strings.Contains(s, "parallels"):
				return "parallels"
			}
		}
	}

	if _, err := os.Stat("/.dockerenv"); err == nil {
		return "docker"
	}
	if _, err := os.Stat("/run/.containerenv"); err == nil {
		return "podman"
	}

	return "none"
}

func detectInit() string {
	if _, err := os.Stat("/run/systemd/private"); err == nil {
		return "systemd"
	}
	if _, err := os.Stat("/run/openrc"); err == nil {
		return "openrc"
	}
	if _, err := os.Stat("/sbin/openrc-run"); err == nil {
		return "openrc"
	}
	if _, err := os.Stat("/etc/runit"); err == nil {
		return "runit"
	}
	if comm, err := os.ReadFile("/proc/1/comm"); err == nil {
		name := strings.ToLower(strings.TrimSpace(string(comm)))
		if name != "" {
			return name
		}
	}
	return "sysvinit"
}

// DetectLiveSourceMode inspects the live environment or squashfs sibling marker
// to determine whether the source image is "standard", "clone", or "crypted".
func DetectLiveSourceMode(squashfsPath string) (mode string, isCrypted bool, isClone bool) {
	// Check if booted from LUKS-encrypted live root container
	if _, err := os.Stat("/dev/mapper/live-root"); err == nil {
		return "crypted", true, false
	}

	if squashfsPath != "" {
		if _, err := os.Stat(squashfsPath); err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 1500*time.Millisecond)
			defer cancel()
			out, err := exec.CommandContext(ctx, "unsquashfs", "-cat", squashfsPath, "etc/penguins-eggs.d/sibling.yaml").Output()
			if err == nil {
				content := strings.ToLower(string(out))
				if strings.Contains(content, "crypted") {
					return "crypted", true, false
				}
				if strings.Contains(content, "clone") {
					return "clone", false, true
				}
			}
		}
	}

	return "standard", false, false
}
