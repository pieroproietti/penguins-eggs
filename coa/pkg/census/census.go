package census

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"coa/pkg/distro"
	"coa/pkg/parser"
)

const (
	DefaultEndpoint = "https://penguins-eggs.net/api/census"
	DefaultTimeout  = 2500 * time.Millisecond

	systemCensusIDPath   = "/etc/penguins-eggs/.census_id"
	systemCensusDirDPath = "/etc/penguins-eggs.d/.census_id"
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

// Send dispatches the census telemetry asynchronously with a strict timeout.
// It fails completely silently on any error and never alters CLI exit behavior.
func Send(opts EventOptions) {
	defer func() {
		_ = recover()
	}()

	if ShouldSkip(opts.Anonymous, opts.Crypted) {
		return
	}

	uuid, err := getOrCreateUUID()
	if err != nil || uuid == "" {
		return
	}

	payload := BuildPayload(uuid, opts)
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}

	done := make(chan struct{})
	go func() {
		defer close(done)
		defer func() {
			_ = recover()
		}()

		ctx, cancel := context.WithTimeout(context.Background(), DefaultTimeout)
		defer cancel()

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
	case <-done:
	case <-time.After(DefaultTimeout):
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

func getOrCreateUUID() (string, error) {
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

func detectDesktop() string {
	for _, envKey := range []string{"XDG_CURRENT_DESKTOP", "DESKTOP_SESSION"} {
		if val := strings.TrimSpace(os.Getenv(envKey)); val != "" {
			parts := strings.Split(val, ":")
			return strings.ToLower(strings.TrimSpace(parts[len(parts)-1]))
		}
	}

	if files, err := filepath.Glob("/usr/share/xsessions/*.desktop"); err == nil && len(files) > 0 {
		return strings.ToLower(strings.TrimSuffix(filepath.Base(files[0]), ".desktop"))
	}
	if files, err := filepath.Glob("/usr/share/wayland-sessions/*.desktop"); err == nil && len(files) > 0 {
		return strings.ToLower(strings.TrimSuffix(filepath.Base(files[0]), ".desktop"))
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
