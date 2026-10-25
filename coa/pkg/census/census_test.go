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
