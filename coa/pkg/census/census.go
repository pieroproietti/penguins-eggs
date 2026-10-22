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
	Arch    string `json:"arch"`
	Desktop string `json:"desktop"`
	Virt    string `json:"virt"`
	Init    string `json:"init"`
}

// OptionsInfo represents the execution options in the census payload.
type OptionsInfo struct {
	Clone       bool   `json:"clone"`
	Compression string `json:"compression"`
	Coexist     bool   `json:"coexist"`
}

// Payload defines the JSON structure sent to the census endpoint.
type Payload struct {
	UUID        string      `json:"uuid"`
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
	Crypted     bool
	Clone       bool
	Compression string
	Coexist     bool
	Distro      *distro.Distro
	TargetRoot  string
	TargetUser  string
}

// ShouldSkip evaluates all privacy and opt-out rules:
// 1. Explicit --anonymous flag
// 2. Automatic privacy rule: --crypted / LUKS encryption forces anonymous = true
// 3. Global opt-out via EGGS_ANONYMOUS environment variable
// 4. Global opt-out via custom.yaml configuration
func ShouldSkip(anonymousFlag, crypted bool) bool {
	if anonymousFlag || crypted {
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

	if ShouldSkip(opts.Anonymous, opts.Crypted) {
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

	return Payload{
		UUID:        uuid,
		EggsVersion: opts.EggsVersion,
		Action:      opts.Action,
		Distro: DistroInfo{
			ID:       strings.ToLower(d.DistroID),
			Like:     strings.ToLower(d.DistroLike),
			Codename: strings.ToLower(d.CodenameID),
			Release:  d.ReleaseID,
		},
		System: SystemInfo{
			Arch:    arch,
			Desktop: detectDesktop(),
			Virt:    detectVirt(),
			Init:    detectInit(),
		},
		Options: OptionsInfo{
			Clone:       opts.Clone,
			Compression: opts.Compression,
			Coexist:     opts.Coexist,
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

func normalizeDesktopName(name string) string {
	name = strings.ToLower(strings.TrimSpace(name))
	name = strings.TrimPrefix(name, "x-")
	switch {
	case strings.Contains(name, "xfce"):
		return "xfce"
	case strings.Contains(name, "plasma") || strings.Contains(name, "kde"):
		return "kde"
	case strings.Contains(name, "cinnamon"):
		return "cinnamon"
	case strings.Contains(name, "mate"):
		return "mate"
	case strings.Contains(name, "lxqt"):
		return "lxqt"
	case strings.Contains(name, "lxde"):
		return "lxde"
	case strings.Contains(name, "budgie"):
		return "budgie"
	case strings.Contains(name, "gnome") || name == "ubuntu" || name == "pop":
		return "gnome"
	case strings.Contains(name, "cosmic"):
		return "cosmic"
	case strings.Contains(name, "deepin") || strings.Contains(name, "dde"):
		return "deepin"
	default:
		return name
	}
}

func detectDesktop() string {
	for _, envKey := range []string{"XDG_CURRENT_DESKTOP", "DESKTOP_SESSION", "XDG_SESSION_DESKTOP"} {
		if val := strings.TrimSpace(os.Getenv(envKey)); val != "" {
			parts := strings.Split(val, ":")
			raw := strings.TrimSpace(parts[len(parts)-1])
			if !isIgnoredDesktopSession(raw) {
				return normalizeDesktopName(raw)
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
					candidateSessions = append(candidateSessions, normalizeDesktopName(base))
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
		{"openbox-session", "openbox"},
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
