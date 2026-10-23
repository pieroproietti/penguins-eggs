package census

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"coa/pkg/distro"
)

func TestGenerateAndValidateUUIDv4(t *testing.T) {
	id, err := generateUUIDv4()
	if err != nil {
		t.Fatalf("unexpected error generating UUID: %v", err)
	}
	if !isValidUUID(id) {
		t.Fatalf("generated UUID %q is not valid", id)
	}
	if id[14] != '4' {
		t.Errorf("expected UUID version 4, got %q", id)
	}
}

func TestDeriveUUIDFromMachineID(t *testing.T) {
	tmpDir := t.TempDir()
	midFile := filepath.Join(tmpDir, "machine-id")
	fallbackFile := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_MACHINE_ID_PATH", midFile)
	t.Setenv("EGGS_CENSUS_ID_PATH", fallbackFile)

	sampleMachineID := "a1b2c3d4e5f60123456789abcdef0123"
	if err := os.WriteFile(midFile, []byte(sampleMachineID+"\n"), 0644); err != nil {
		t.Fatalf("failed to write test machine-id: %v", err)
	}

	id1, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("unexpected error deriving UUID from machine-id: %v", err)
	}
	if !isValidUUID(id1) {
		t.Fatalf("derived UUID %q is not valid", id1)
	}
	if id1[14] != '5' {
		t.Errorf("expected deterministic UUID version 5, got %q", id1)
	}
	if id1 == sampleMachineID {
		t.Errorf("derived UUID must not expose raw machine-id")
	}

	// Must not create fallback .census_id when machine-id is valid
	if _, err := os.Stat(fallbackFile); !os.IsNotExist(err) {
		t.Errorf("fallback file %s should not be created when machine-id is valid", fallbackFile)
	}

	// Second call with uppercase/whitespace must produce the exact same UUID
	if err := os.WriteFile(midFile, []byte("  A1B2C3D4E5F60123456789ABCDEF0123 \n"), 0644); err != nil {
		t.Fatalf("failed to rewrite test machine-id: %v", err)
	}
	id2, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("unexpected error on second derivation: %v", err)
	}
	if id1 != id2 {
		t.Errorf("expected deterministic UUID %q, got %q", id1, id2)
	}

	// Different machine-id must produce a different UUID
	if err := os.WriteFile(midFile, []byte("ffffffffffffffffffffffffffffffff\n"), 0644); err != nil {
		t.Fatalf("failed to write second machine-id: %v", err)
	}
	id3, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("unexpected error on third derivation: %v", err)
	}
	if id3 == id1 {
		t.Errorf("different machine-ids should not collide: %q", id3)
	}

	// Invalid machine-id (all zeros or "uninitialized") must fall back to .census_id
	for _, invalid := range []string{"00000000000000000000000000000000", "uninitialized", "short"} {
		if isValidMachineID(invalid) {
			t.Errorf("expected isValidMachineID(%q) == false", invalid)
		}
	}
}

func TestGetOrCreateUUIDPersistence(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)

	id1, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("failed to create UUID: %v", err)
	}
	if !isValidUUID(id1) {
		t.Fatalf("invalid UUID created: %q", id1)
	}

	// Second call must return the exact same persistent UUID
	id2, err := getOrCreateUUID()
	if err != nil {
		t.Fatalf("failed to read existing UUID: %v", err)
	}
	if id1 != id2 {
		t.Errorf("expected persistent UUID %q, got %q", id1, id2)
	}
}

func TestShouldSkipPrivacyRules(t *testing.T) {
	t.Setenv("EGGS_ANONYMOUS", "")

	// 1. Explicit --anonymous flag
	if !ShouldSkip(true) {
		t.Errorf("expected ShouldSkip=true when anonymousFlag is true")
	}

	// 2. Environment variable opt-out
	t.Setenv("EGGS_ANONYMOUS", "1")
	if !ShouldSkip(false) {
		t.Errorf("expected ShouldSkip=true when EGGS_ANONYMOUS=1")
	}
	t.Setenv("EGGS_ANONYMOUS", "true")
	if !ShouldSkip(false) {
		t.Errorf("expected ShouldSkip=true when EGGS_ANONYMOUS=true")
	}
}

func TestAnonymousDoesNotCreateUUIDOrSendRequest(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)
	t.Setenv("HOME", tmpDir)
	t.Setenv("XDG_CONFIG_HOME", "")
	t.Setenv("EGGS_ANONYMOUS", "")

	censusJSONPath := filepath.Join(tmpDir, ".config", "penguins-eggs", "census.json")

	called := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	origEndpoint := Endpoint
	Endpoint = srv.URL
	defer func() { Endpoint = origEndpoint }()

	// Test explicit anonymous
	Send(EventOptions{
		Action:      "remaster",
		EggsVersion: "1.0.0",
		Anonymous:   true,
	})
	if called {
		t.Errorf("server should not be called when Anonymous=true")
	}
	if _, err := os.Stat(idPath); !os.IsNotExist(err) {
		t.Errorf("UUID file %s should not be created when Anonymous=true", idPath)
	}
	if _, err := os.Stat(censusJSONPath); !os.IsNotExist(err) {
		t.Errorf("local census.json %s should not be created when Anonymous=true", censusJSONPath)
	}
}

func TestSendSuccessAndPayloadStructure(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)
	t.Setenv("HOME", tmpDir)
	t.Setenv("XDG_CONFIG_HOME", "")
	t.Setenv("EGGS_ANONYMOUS", "")

	var receivedBody []byte
	var received Payload
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		var err error
		receivedBody, err = os.ReadFile("/dev/null") // initialize empty slice
		_ = err
		buf := make([]byte, 4096)
		n, _ := r.Body.Read(buf)
		receivedBody = buf[:n]
		_ = json.Unmarshal(receivedBody, &received)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	origEndpoint := Endpoint
	Endpoint = srv.URL
	defer func() { Endpoint = origEndpoint }()

	Send(EventOptions{
		Action:      "remaster",
		EggsVersion: "26.10.18",
		Anonymous:   false,
		Clone:       true,
		Distro: &distro.Distro{
			DistroID:   "debian",
			DistroLike: "Debian",
			CodenameID: "trixie",
			ReleaseID:  "13",
			Arch:       "amd64",
		},
	})

	if !isValidUUID(received.UUID) {
		t.Errorf("expected valid UUID in payload, got %q", received.UUID)
	}
	if received.EggsVersion != "26.10.18" {
		t.Errorf("expected eggs_version 26.10.18, got %q", received.EggsVersion)
	}
	if received.Action != "remaster" {
		t.Errorf("expected action remaster, got %q", received.Action)
	}
	if received.Distro.ID != "debian" || received.Distro.Like != "debian" || received.Distro.Codename != "trixie" || received.Distro.Release != "13" {
		t.Errorf("unexpected distro info: %+v", received.Distro)
	}
	if received.System.Arch != "amd64" || received.System.Desktop == "" || received.System.DisplayServer == "" || received.System.Virt == "" || received.System.Init == "" {
		t.Errorf("unexpected system info: %+v", received.System)
	}
	if !received.Options.Clone {
		t.Errorf("unexpected options info: %+v", received.Options)
	}

	// Verify local copy in ~/.config/penguins-eggs/census.json matches exact transmitted payload
	localPath := filepath.Join(tmpDir, ".config", "penguins-eggs", "census.json")
	savedBytes, err := os.ReadFile(localPath)
	if err != nil {
		t.Fatalf("expected local census.json at %s, got error: %v", localPath, err)
	}
	if string(savedBytes) != string(receivedBody) {
		t.Errorf("saved census.json does not match transmitted payload:\nsaved: %s\nsent:  %s", string(savedBytes), string(receivedBody))
	}
}

func TestSendFailsSilentlyOnOfflineOrTimeout(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)
	t.Setenv("HOME", tmpDir)
	t.Setenv("XDG_CONFIG_HOME", "")
	t.Setenv("EGGS_ANONYMOUS", "")

	origEndpoint := Endpoint
	Endpoint = "http://127.0.0.1:1/unreachable"
	defer func() { Endpoint = origEndpoint }()

	start := time.Now()
	Send(EventOptions{
		Action:      "sysinstall",
		EggsVersion: "1.0.0",
	})
	if time.Since(start) > 3*time.Second {
		t.Errorf("Send took too long on unreachable endpoint: %v", time.Since(start))
	}

	// Local copy must still be saved when prepared for sending
	localPath := filepath.Join(tmpDir, ".config", "penguins-eggs", "census.json")
	if _, err := os.Stat(localPath); err != nil {
		t.Errorf("expected local census.json to be saved at %s even when offline, got: %v", localPath, err)
	}
}

func TestSaveLocalPayloadFailsSilentlyOnPermissionError(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)
	t.Setenv("EGGS_ANONYMOUS", "")

	// Create a regular file where the directory needs to be created so MkdirAll fails
	blockerFile := filepath.Join(tmpDir, "blocker")
	if err := os.WriteFile(blockerFile, []byte("x"), 0644); err != nil {
		t.Fatalf("failed to create blocker file: %v", err)
	}
	t.Setenv("EGGS_CENSUS_PAYLOAD_PATH", filepath.Join(blockerFile, "penguins-eggs", "census.json"))

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	origEndpoint := Endpoint
	Endpoint = srv.URL
	defer func() { Endpoint = origEndpoint }()

	// Must not panic or fail
	Send(EventOptions{
		Action:      "remaster",
		EggsVersion: "1.0.0",
	})
}

func TestSysinstallTargetRootPersistenceAndUUID(t *testing.T) {
	tmpDir := t.TempDir()
	hostHome := filepath.Join(tmpDir, "host-home")
	targetRoot := filepath.Join(tmpDir, "target-root")

	t.Setenv("HOME", hostHome)
	t.Setenv("XDG_CONFIG_HOME", "")
	t.Setenv("EGGS_ANONYMOUS", "")
	t.Setenv("EGGS_MACHINE_ID_PATH", "")
	t.Setenv("EGGS_CENSUS_ID_PATH", "")

	// Simulate fresh /etc/machine-id and /home/artisan created inside the target installation root
	targetMachineID := "11223344556677889900aabbccddeeff"
	targetEtc := filepath.Join(targetRoot, "etc")
	targetUserHome := filepath.Join(targetRoot, "home", "artisan")
	if err := os.MkdirAll(targetEtc, 0755); err != nil {
		t.Fatalf("mkdir target etc: %v", err)
	}
	if err := os.WriteFile(filepath.Join(targetEtc, "machine-id"), []byte(targetMachineID+"\n"), 0644); err != nil {
		t.Fatalf("write target machine-id: %v", err)
	}
	if err := os.MkdirAll(targetUserHome, 0755); err != nil {
		t.Fatalf("mkdir target user home: %v", err)
	}

	var received Payload
	var receivedBody []byte
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		buf := make([]byte, 4096)
		n, _ := r.Body.Read(buf)
		receivedBody = buf[:n]
		_ = json.Unmarshal(receivedBody, &received)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	origEndpoint := Endpoint
	Endpoint = srv.URL
	defer func() { Endpoint = origEndpoint }()

	Send(EventOptions{
		Action:      "sysinstall",
		EggsVersion: "penguins-eggs 26.10.19",
		TargetRoot:  targetRoot,
		TargetUser:  "artisan",
	})

	expectedUUID := deriveUUIDFromMachineID(targetMachineID)
	if received.UUID != expectedUUID {
		t.Errorf("expected UUID derived from target machine-id %q, got %q", expectedUUID, received.UUID)
	}
	if received.EggsVersion != "26.10.19" {
		t.Errorf("expected normalized version 26.10.19, got %q", received.EggsVersion)
	}

	// Verify census.json is written inside the installed target system for both /etc and the user's ~/.config
	targetUserCensus := filepath.Join(targetUserHome, ".config", "penguins-eggs", "census.json")
	userBytes, err := os.ReadFile(targetUserCensus)
	if err != nil {
		t.Fatalf("expected target user census.json at %s, got: %v", targetUserCensus, err)
	}
	if string(userBytes) != string(receivedBody) {
		t.Errorf("target user census.json mismatch:\ngot:  %s\nwant: %s", string(userBytes), string(receivedBody))
	}

	targetEtcCensus := filepath.Join(targetRoot, "etc", "penguins-eggs", "census.json")
	etcBytes, err := os.ReadFile(targetEtcCensus)
	if err != nil {
		t.Fatalf("expected target /etc census.json at %s, got: %v", targetEtcCensus, err)
	}
	if string(etcBytes) != string(receivedBody) {
		t.Errorf("target /etc census.json mismatch:\ngot:  %s\nwant: %s", string(etcBytes), string(receivedBody))
	}
}

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

func TestParentIDTelemetry(t *testing.T) {
	tmpDir := t.TempDir()
	midFile := filepath.Join(tmpDir, "machine-id")
	t.Setenv("EGGS_MACHINE_ID_PATH", midFile)
	t.Setenv("EGGS_CENSUS_ID_PATH", filepath.Join(tmpDir, ".census_id"))
	t.Setenv("EGGS_CENSUS_PAYLOAD_PATH", filepath.Join(tmpDir, "census.json"))

	parentMachineID := "1111222233334444aaaabbbbccccdddd"
	if err := os.WriteFile(midFile, []byte(parentMachineID+"\n"), 0644); err != nil {
		t.Fatalf("failed to write test machine-id: %v", err)
	}

	// 1. GetAnonymizedMachineID generates valid deterministic UUID
	anonymized := GetAnonymizedMachineID()
	if !isValidUUID(anonymized) {
		t.Fatalf("expected valid UUID from GetAnonymizedMachineID, got %q", anonymized)
	}
	expectedUUID := DeriveUUIDFromMachineID(parentMachineID)
	if anonymized != expectedUUID {
		t.Errorf("expected %q, got %q", expectedUUID, anonymized)
	}

	// 2. DetectParentID from env var EGGS_PARENT_ID
	t.Setenv("EGGS_PARENT_ID", anonymized)
	if got := DetectParentID(""); got != anonymized {
		t.Errorf("expected parent ID %q from EGGS_PARENT_ID, got %q", anonymized, got)
	}
	t.Setenv("EGGS_PARENT_ID", "")

	// 3. DetectParentID from file via EGGS_PARENT_ID_PATH
	pFilePath := filepath.Join(tmpDir, "parent_id")
	_ = os.WriteFile(pFilePath, []byte(anonymized+"\n"), 0644)
	t.Setenv("EGGS_PARENT_ID_PATH", pFilePath)
	if got := DetectParentID(""); got != anonymized {
		t.Errorf("expected parent ID %q from EGGS_PARENT_ID_PATH, got %q", anonymized, got)
	}
	t.Setenv("EGGS_PARENT_ID_PATH", "")

	// 4. DetectParentIDFromSource relative to squashfs path
	liveDir := filepath.Join(tmpDir, "live")
	_ = os.MkdirAll(liveDir, 0755)
	sqPath := filepath.Join(liveDir, "filesystem.squashfs")
	_ = os.WriteFile(sqPath, []byte("fake-squashfs"), 0644)
	_ = os.WriteFile(filepath.Join(liveDir, "parent_id"), []byte(anonymized+"\n"), 0644)
	if got := DetectParentIDFromSource(sqPath); got != anonymized {
		t.Errorf("expected parent ID %q from source dir, got %q", anonymized, got)
	}

	// 5. Send with ParentID produces snake_case "parent_id" in JSON
	var receivedBody []byte
	var received Payload
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		buf := make([]byte, 4096)
		n, _ := r.Body.Read(buf)
		receivedBody = buf[:n]
		_ = json.Unmarshal(receivedBody, &received)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	origEndpoint := Endpoint
	Endpoint = srv.URL
	defer func() { Endpoint = origEndpoint }()

	targetRoot := filepath.Join(tmpDir, "target")
	_ = os.MkdirAll(filepath.Join(targetRoot, "etc"), 0755)

	Send(EventOptions{
		Action:      "sysinstall",
		EggsVersion: "26.10.23",
		ParentID:    anonymized,
		TargetRoot:  targetRoot,
	})

	if received.ParentID != anonymized {
		t.Errorf("expected received parent_id %q, got %q", anonymized, received.ParentID)
	}
	if !strings.Contains(string(receivedBody), `"parent_id"`) {
		t.Errorf("expected transmitted JSON to contain snake_case 'parent_id', got: %s", string(receivedBody))
	}

	// 6. Verify saveTargetPayload saved parent-id to <targetRoot>/etc/penguins-eggs.d/parent-id
	savedTargetParentID := filepath.Join(targetRoot, "etc", "penguins-eggs.d", "parent-id")
	data, err := os.ReadFile(savedTargetParentID)
	if err != nil {
		t.Fatalf("expected target parent-id file at %s: %v", savedTargetParentID, err)
	}
	if strings.TrimSpace(string(data)) != anonymized {
		t.Errorf("target parent-id mismatch: got %q, want %q", strings.TrimSpace(string(data)), anonymized)
	}
}

func TestDetectDisplayServer(t *testing.T) {
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
			t.Setenv("WAYLAND_DISPLAY", tt.waylandDisplay)
			t.Setenv("XDG_SESSION_TYPE", tt.sessionType)
			t.Setenv("DISPLAY", tt.display)

			got := DetectDisplayServer()
			if got != tt.expected {
				t.Errorf("DetectDisplayServer() = %q, want %q", got, tt.expected)
			}
		})
	}
}

func TestAnonymousCensusPayloadStrict(t *testing.T) {
	tmpDir := t.TempDir()
	t.Setenv("HOME", tmpDir)
	t.Setenv("XDG_CONFIG_HOME", tmpDir)
	t.Setenv("EGGS_ANONYMOUS", "")

	var receivedBody []byte
	var received Payload
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		receivedBody = body
		_ = json.Unmarshal(body, &received)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	origEndpoint := Endpoint
	Endpoint = srv.URL
	defer func() { Endpoint = origEndpoint }()

	targetRoot := filepath.Join(tmpDir, "target")
	_ = os.MkdirAll(filepath.Join(targetRoot, "etc"), 0755)

	Send(EventOptions{
		Action:      "remaster",
		EggsVersion: "26.10.23",
		ParentID:    "parent-uuid-5678",
		TargetRoot:  targetRoot,
	})

	if strings.Contains(string(receivedBody), `"community"`) {
		t.Errorf("census payload must NOT contain community metadata: %s", string(receivedBody))
	}
	if received.ParentID != "parent-uuid-5678" {
		t.Errorf("expected parent_id preserved, got %s", received.ParentID)
	}

	// Verify target saved parent-id but NOT community.json
	targetParentIDFile := filepath.Join(targetRoot, "etc", "penguins-eggs.d", "parent-id")
	if _, err := os.Stat(targetParentIDFile); err != nil {
		t.Errorf("expected target parent-id at %s: %v", targetParentIDFile, err)
	}

	targetCommFile := filepath.Join(targetRoot, "etc", "penguins-eggs.d", "community.json")
	if _, err := os.Stat(targetCommFile); !os.IsNotExist(err) {
		t.Errorf("expected target community.json to NOT exist, but found it")
	}
}



