package census

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDetectDesktop(t *testing.T) {
	// 1. Desktop detected from XDG_CURRENT_DESKTOP
	t.Run("from XDG_CURRENT_DESKTOP", func(t *testing.T) {
		t.Setenv("XDG_CURRENT_DESKTOP", "XFCE")
		t.Setenv("DESKTOP_SESSION", "")
		t.Setenv("XDG_SESSION_DESKTOP", "")
		if got := detectDesktop(); got != "xfce" {
			t.Errorf("expected 'xfce', got %q", got)
		}
	})

	t.Run("from compound XDG_CURRENT_DESKTOP", func(t *testing.T) {
		t.Setenv("XDG_CURRENT_DESKTOP", "ubuntu:GNOME")
		t.Setenv("DESKTOP_SESSION", "")
		t.Setenv("XDG_SESSION_DESKTOP", "")
		if got := detectDesktop(); got != "gnome" {
			t.Errorf("expected 'gnome', got %q", got)
		}
	})

	// 2. Ignores lightdm-xsession in env var and in xsessions
	t.Run("ignores lightdm-xsession and picks xfce", func(t *testing.T) {
		t.Setenv("XDG_CURRENT_DESKTOP", "")
		t.Setenv("DESKTOP_SESSION", "lightdm-xsession")
		t.Setenv("XDG_SESSION_DESKTOP", "")

		tmpXsessions := t.TempDir()
		t.Setenv("EGGS_XSESSIONS_PATH", tmpXsessions)
		t.Setenv("EGGS_WAYLAND_SESSIONS_PATH", t.TempDir())

		// Create lightdm-xsession.desktop and xfce.desktop
		_ = os.WriteFile(filepath.Join(tmpXsessions, "lightdm-xsession.desktop"), []byte("[Desktop Entry]\nName=Default"), 0644)
		_ = os.WriteFile(filepath.Join(tmpXsessions, "xfce.desktop"), []byte("[Desktop Entry]\nName=Xfce"), 0644)

		if got := detectDesktop(); got != "xfce" {
			t.Errorf("expected 'xfce', got %q", got)
		}
	})

	// 3. Normalizes plasma to kde
	t.Run("normalizes plasma to kde", func(t *testing.T) {
		t.Setenv("XDG_CURRENT_DESKTOP", "")
		t.Setenv("DESKTOP_SESSION", "")
		t.Setenv("XDG_SESSION_DESKTOP", "")

		tmpXsessions := t.TempDir()
		t.Setenv("EGGS_XSESSIONS_PATH", tmpXsessions)
		t.Setenv("EGGS_WAYLAND_SESSIONS_PATH", t.TempDir())

		_ = os.WriteFile(filepath.Join(tmpXsessions, "plasma.desktop"), []byte("[Desktop Entry]\nName=Plasma"), 0644)

		if got := detectDesktop(); got != "kde" {
			t.Errorf("expected 'kde', got %q", got)
		}
	})

	// 4. Detects Wayland session like sway
	t.Run("detects sway from wayland-sessions", func(t *testing.T) {
		t.Setenv("XDG_CURRENT_DESKTOP", "")
		t.Setenv("DESKTOP_SESSION", "")
		t.Setenv("XDG_SESSION_DESKTOP", "")

		t.Setenv("EGGS_XSESSIONS_PATH", t.TempDir())
		tmpWayland := t.TempDir()
		t.Setenv("EGGS_WAYLAND_SESSIONS_PATH", tmpWayland)

		_ = os.WriteFile(filepath.Join(tmpWayland, "sway.desktop"), []byte("[Desktop Entry]\nName=Sway"), 0644)

		if got := detectDesktop(); got != "sway" {
			t.Errorf("expected 'sway', got %q", got)
		}
	})

	// 5. Headless / CLI fallback
	t.Run("falls back to cli when empty and no bin on PATH", func(t *testing.T) {
		t.Setenv("XDG_CURRENT_DESKTOP", "")
		t.Setenv("DESKTOP_SESSION", "")
		t.Setenv("XDG_SESSION_DESKTOP", "")
		t.Setenv("PATH", t.TempDir()) // Empty PATH to avoid finding system binaries
		t.Setenv("EGGS_XSESSIONS_PATH", t.TempDir())
		t.Setenv("EGGS_WAYLAND_SESSIONS_PATH", t.TempDir())

		if got := detectDesktop(); got != "cli" {
			t.Errorf("expected 'cli', got %q", got)
		}
	})
}

func TestNormalizeDesktop(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"", "cli"},
		{"   ", "cli"},
		{"none", "cli"},
		{"default", "cli"},
		{"lightdm-xsession", "cli"},
		{"cinnamon", "cinnamon"},
		{"X-Cinnamon", "cinnamon"},
		{"cinnamon-wayland", "cinnamon"},
		{"gnome", "gnome"},
		{"GNOME", "gnome"},
		{"gnome-xorg", "gnome"},
		{"ubuntu", "gnome"},
		{"ubuntu:GNOME", "gnome"},
		{"pop", "gnome"},
		{"pop:GNOME", "gnome"},
		{"zorin", "gnome"},
		{"zorin:GNOME", "gnome"},
		{"plasma", "kde"},
		{"kde", "kde"},
		{"plasmawayland", "kde"},
		{"startplasma-x11", "kde"},
		{"xfce", "xfce"},
		{"XFCE", "xfce"},
		{"xfce4", "xfce"},
		{"mate", "mate"},
		{"MATE", "mate"},
		{"lxqt", "lxqt"},
		{"LXQt", "lxqt"},
		{"lxde", "lxde"},
		{"budgie", "budgie"},
		{"Budgie:GNOME", "budgie"},
		{"budgie-desktop", "budgie"},
		{"deepin", "deepin"},
		{"dde", "deepin"},
		{"ukui", "ukui"},
		{"UKUI", "ukui"},
		{"pantheon", "pantheon"},
		{"Pantheon:GNOME", "pantheon"},
		{"enlightenment", "enlightenment"},
		{"cosmic", "cosmic"},
		{"hyprland", "hyprland"},
		{"sway", "sway"},
		{"i3", "i3"},
		{"openbox", "openbox"},
		{"fly", "fly"},
		{"fly-dm", "fly"},
		// Fallbacks con rimozione prefisso x- e suffissi
		{"qtile-wayland", "qtile"},
		{"river-wayland", "river"},
		{"dwm-x11", "dwm"},
		{"bspwm-session", "bspwm"},
		{"x-awesome", "awesome"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := NormalizeDesktop(tt.input)
			if got != tt.expected {
				t.Errorf("NormalizeDesktop(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestDetectDisplayServer(t *testing.T) {
	isolateDisplayEnv := func(t *testing.T) {
		t.Helper()
		t.Setenv("WAYLAND_DISPLAY", "")
		t.Setenv("XDG_SESSION_TYPE", "")
		t.Setenv("DISPLAY", "")
		t.Setenv("XDG_CURRENT_DESKTOP", "")
		t.Setenv("DESKTOP_SESSION", "")
		t.Setenv("XDG_SESSION_DESKTOP", "")
		t.Setenv("PATH", t.TempDir())
		t.Setenv("EGGS_WAYLAND_SOCKETS_DIR", t.TempDir())
		t.Setenv("EGGS_X11_SOCKETS_DIR", t.TempDir())
		t.Setenv("EGGS_XSESSIONS_PATH", t.TempDir())
		t.Setenv("EGGS_WAYLAND_SESSIONS_PATH", t.TempDir())
	}

	tests := []struct {
		name           string
		waylandDisplay string
		sessionType    string
		display        string
		expected       string
	}{
		{
			name:           "wayland from WAYLAND_DISPLAY",
			waylandDisplay: "wayland-0",
			sessionType:    "",
			display:        "",
			expected:       "wayland",
		},
		{
			name:           "wayland from XDG_SESSION_TYPE",
			waylandDisplay: "",
			sessionType:    "wayland",
			display:        "",
			expected:       "wayland",
		},
		{
			name:           "wayland takes precedence over DISPLAY (XWayland)",
			waylandDisplay: "wayland-1",
			sessionType:    "wayland",
			display:        ":0",
			expected:       "wayland",
		},
		{
			name:           "x11 from XDG_SESSION_TYPE",
			waylandDisplay: "",
			sessionType:    "x11",
			display:        "",
			expected:       "x11",
		},
		{
			name:           "x11 from DISPLAY",
			waylandDisplay: "",
			sessionType:    "",
			display:        ":0.0",
			expected:       "x11",
		},
		{
			name:           "fallback cli from tty session",
			waylandDisplay: "",
			sessionType:    "tty",
			display:        "",
			expected:       "cli",
		},
		{
			name:           "fallback cli when no display server env set",
			waylandDisplay: "",
			sessionType:    "",
			display:        "",
			expected:       "cli",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isolateDisplayEnv(t)
			t.Setenv("WAYLAND_DISPLAY", tt.waylandDisplay)
			t.Setenv("XDG_SESSION_TYPE", tt.sessionType)
			t.Setenv("DISPLAY", tt.display)

			got := DetectDisplayServer()
			if got != tt.expected {
				t.Errorf("DetectDisplayServer() = %q, want %q", got, tt.expected)
			}
		})
	}

	t.Run("wayland socket under sudo beats XWayland DISPLAY", func(t *testing.T) {
		isolateDisplayEnv(t)
		runUserDir := t.TempDir()
		uidDir := filepath.Join(runUserDir, "1000")
		_ = os.MkdirAll(uidDir, 0755)
		_ = os.WriteFile(filepath.Join(uidDir, "wayland-0"), []byte(""), 0644)
		_ = os.WriteFile(filepath.Join(uidDir, "wayland-0.lock"), []byte(""), 0644)

		t.Setenv("EGGS_WAYLAND_SOCKETS_DIR", runUserDir)
		t.Setenv("DISPLAY", ":0") // XWayland DISPLAY surviving sudo

		if got := DetectDisplayServer(); got != "wayland" {
			t.Errorf("expected 'wayland' from active socket, got %q", got)
		}
	})

	t.Run("ignores wayland .lock file without active socket", func(t *testing.T) {
		isolateDisplayEnv(t)
		runUserDir := t.TempDir()
		uidDir := filepath.Join(runUserDir, "1000")
		_ = os.MkdirAll(uidDir, 0755)
		_ = os.WriteFile(filepath.Join(uidDir, "wayland-0.lock"), []byte(""), 0644)

		t.Setenv("EGGS_WAYLAND_SOCKETS_DIR", runUserDir)

		if got := DetectDisplayServer(); got != "cli" {
			t.Errorf("expected 'cli' when only .lock exists, got %q", got)
		}
	})

	t.Run("x11 socket under sudo when DISPLAY is stripped", func(t *testing.T) {
		isolateDisplayEnv(t)
		x11Dir := t.TempDir()
		_ = os.WriteFile(filepath.Join(x11Dir, "X0"), []byte(""), 0644)

		t.Setenv("EGGS_X11_SOCKETS_DIR", x11Dir)

		if got := DetectDisplayServer(); got != "x11" {
			t.Errorf("expected 'x11' from active X0 socket, got %q", got)
		}
	})

	t.Run("fallback to x11 from xsessions when desktop is xfce", func(t *testing.T) {
		isolateDisplayEnv(t)
		xsessionsDir := t.TempDir()
		_ = os.WriteFile(filepath.Join(xsessionsDir, "xfce.desktop"), []byte("[Desktop Entry]\nName=Xfce"), 0644)
		t.Setenv("EGGS_XSESSIONS_PATH", xsessionsDir)

		if got := DetectDisplayServer(); got != "x11" {
			t.Errorf("expected 'x11' from xsessions fallback for xfce, got %q", got)
		}
	})

	t.Run("fallback to wayland for native wayland desktop sway", func(t *testing.T) {
		isolateDisplayEnv(t)
		waylandSessionsDir := t.TempDir()
		_ = os.WriteFile(filepath.Join(waylandSessionsDir, "sway.desktop"), []byte("[Desktop Entry]\nName=Sway"), 0644)
		t.Setenv("EGGS_WAYLAND_SESSIONS_PATH", waylandSessionsDir)

		if got := DetectDisplayServer(); got != "wayland" {
			t.Errorf("expected 'wayland' for sway fallback, got %q", got)
		}
	})

	t.Run("fallback to wayland when plasma is in wayland-sessions", func(t *testing.T) {
		isolateDisplayEnv(t)
		waylandSessionsDir := t.TempDir()
		xsessionsDir := t.TempDir()
		_ = os.WriteFile(filepath.Join(waylandSessionsDir, "plasma.desktop"), []byte("[Desktop Entry]\nName=Plasma (Wayland)"), 0644)
		_ = os.WriteFile(filepath.Join(xsessionsDir, "plasma.desktop"), []byte("[Desktop Entry]\nName=Plasma (X11)"), 0644)
		t.Setenv("EGGS_WAYLAND_SESSIONS_PATH", waylandSessionsDir)
		t.Setenv("EGGS_XSESSIONS_PATH", xsessionsDir)

		if got := DetectDisplayServer(); got != "wayland" {
			t.Errorf("expected 'wayland' when wayland-sessions exists for kde, got %q", got)
		}
	})
}
