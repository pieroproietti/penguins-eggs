package census

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
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
	if !ShouldSkip(true, false) {
		t.Errorf("expected ShouldSkip=true when anonymousFlag is true")
	}

	// 2. Automatic privacy rule: --crypted forces anonymous
	if !ShouldSkip(false, true) {
		t.Errorf("expected ShouldSkip=true when crypted is true")
	}

	// 3. Environment variable opt-out
	t.Setenv("EGGS_ANONYMOUS", "1")
	if !ShouldSkip(false, false) {
		t.Errorf("expected ShouldSkip=true when EGGS_ANONYMOUS=1")
	}
	t.Setenv("EGGS_ANONYMOUS", "true")
	if !ShouldSkip(false, false) {
		t.Errorf("expected ShouldSkip=true when EGGS_ANONYMOUS=true")
	}
}

func TestAnonymousDoesNotCreateUUIDOrSendRequest(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)
	t.Setenv("EGGS_ANONYMOUS", "")

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

	// Test implicit anonymous via Crypted=true
	Send(EventOptions{
		Action:      "remaster",
		EggsVersion: "1.0.0",
		Anonymous:   false,
		Crypted:     true,
	})
	if called {
		t.Errorf("server should not be called when Crypted=true")
	}
	if _, err := os.Stat(idPath); !os.IsNotExist(err) {
		t.Errorf("UUID file %s should not be created when Crypted=true", idPath)
	}
}

func TestSendSuccessAndPayloadStructure(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)
	t.Setenv("EGGS_ANONYMOUS", "")

	var received Payload
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		_ = json.NewDecoder(r.Body).Decode(&received)
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
		Crypted:     false,
		Clone:       true,
		Compression: "zstd",
		Coexist:     false,
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
	if received.System.Arch != "amd64" || received.System.Desktop == "" || received.System.Virt == "" || received.System.Init == "" {
		t.Errorf("unexpected system info: %+v", received.System)
	}
	if !received.Options.Clone || received.Options.Compression != "zstd" || received.Options.Coexist {
		t.Errorf("unexpected options info: %+v", received.Options)
	}
}

func TestSendFailsSilentlyOnOfflineOrTimeout(t *testing.T) {
	tmpDir := t.TempDir()
	idPath := filepath.Join(tmpDir, ".census_id")
	t.Setenv("EGGS_CENSUS_ID_PATH", idPath)
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
}
