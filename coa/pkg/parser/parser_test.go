package parser

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDetectAndLoad(t *testing.T) {
	profile, err := DetectAndLoad(false)
	if err != nil {
		t.Fatalf("DetectAndLoad failed: %v", err)
	}

	if len(profile.Remaster) == 0 {
		t.Errorf("expected non-empty remaster steps in profile")
	}

	if len(profile.Install) == 0 {
		t.Errorf("expected non-empty install steps in profile")
	}
}

func TestLoadCustomSettings_Anonymous(t *testing.T) {
	tmpDir := t.TempDir()
	cfgDir := filepath.Join(tmpDir, "penguins-eggs")
	if err := os.MkdirAll(cfgDir, 0755); err != nil {
		t.Fatalf("failed to create cfgDir: %v", err)
	}

	yamlContent := `
anonymous: true
remaster:
  user: "tux"
`
	if err := os.WriteFile(filepath.Join(cfgDir, "custom.yaml"), []byte(yamlContent), 0644); err != nil {
		t.Fatalf("failed to write custom.yaml: %v", err)
	}

	t.Setenv("XDG_CONFIG_HOME", tmpDir)

	settings, err := LoadCustomSettings()
	if err != nil {
		t.Fatalf("LoadCustomSettings failed: %v", err)
	}
	if settings == nil {
		t.Fatalf("expected non-nil settings")
	}

	if !settings.Anonymous {
		t.Errorf("expected Anonymous == true")
	}
	if settings.Remaster.User != "tux" {
		t.Errorf("expected user 'tux', got %q", settings.Remaster.User)
	}
}
