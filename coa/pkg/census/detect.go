package census

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

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
	if strings.Contains(d, "gnome") || strings.HasPrefix(d, "ubuntu") || strings.HasPrefix(d, "pop") || strings.HasPrefix(d, "zorin") {
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
	if strings.Contains(d, "fly") {
		return "fly"
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
		{"fly-wm", "fly"},
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

func hasActiveWaylandSocket() bool {
	baseDir := "/run/user"
	if custom := strings.TrimSpace(os.Getenv("EGGS_WAYLAND_SOCKETS_DIR")); custom != "" {
		baseDir = custom
	}

	patterns := []string{
		filepath.Join(baseDir, "*", "wayland-[0-9]*"),
		filepath.Join(baseDir, "wayland-[0-9]*"),
	}
	for _, pattern := range patterns {
		if matches, err := filepath.Glob(pattern); err == nil {
			for _, m := range matches {
				if !strings.HasSuffix(m, ".lock") {
					return true
				}
			}
		}
	}
	return false
}

func hasActiveX11Socket() bool {
	baseDir := "/tmp/.X11-unix"
	if custom := strings.TrimSpace(os.Getenv("EGGS_X11_SOCKETS_DIR")); custom != "" {
		baseDir = custom
	}

	if matches, err := filepath.Glob(filepath.Join(baseDir, "X[0-9]*")); err == nil {
		return len(matches) > 0
	}
	return false
}

func hasValidDesktopSessions(dir string) bool {
	files, err := filepath.Glob(filepath.Join(dir, "*.desktop"))
	if err != nil {
		return false
	}
	for _, file := range files {
		base := strings.TrimSuffix(filepath.Base(file), ".desktop")
		if !isIgnoredDesktopSession(base) {
			norm := NormalizeDesktop(base)
			if norm != "cli" && !isIgnoredDesktopSession(norm) {
				return true
			}
		}
	}
	return false
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
	}

	if hasActiveWaylandSocket() {
		return "wayland"
	}

	if val := strings.TrimSpace(os.Getenv("DISPLAY")); val != "" || hasActiveX11Socket() {
		return "x11"
	}

	if sessionType == "tty" {
		return "cli"
	}

	desktop := detectDesktop()
	if desktop != "" && desktop != "cli" {
		switch desktop {
		case "hyprland", "sway", "cosmic":
			return "wayland"
		}

		xsessionsDir := "/usr/share/xsessions"
		if custom := strings.TrimSpace(os.Getenv("EGGS_XSESSIONS_PATH")); custom != "" {
			xsessionsDir = custom
		}
		waylandSessionsDir := "/usr/share/wayland-sessions"
		if custom := strings.TrimSpace(os.Getenv("EGGS_WAYLAND_SESSIONS_PATH")); custom != "" {
			waylandSessionsDir = custom
		}

		hasX11 := hasValidDesktopSessions(xsessionsDir)
		hasWayland := hasValidDesktopSessions(waylandSessionsDir)

		if hasX11 {
			switch desktop {
			case "xfce", "cinnamon", "mate", "i3", "openbox", "lxde", "dwm", "jwm", "fly":
				return "x11"
			}
		}

		if hasWayland {
			return "wayland"
		}
		if hasX11 {
			return "x11"
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
