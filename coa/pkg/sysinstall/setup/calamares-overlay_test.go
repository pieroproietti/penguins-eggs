package setup

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCalamaresModulesOverlay(t *testing.T) {
	root := t.TempDir()
	oldBranding := calamaresModulesBranding
	oldModulesDir := modulesDir
	calamaresModulesBranding = filepath.Join(root, "branding")
	modulesDir = filepath.Join(root, "installer.d", "modules")
	t.Cleanup(func() {
		calamaresModulesBranding = oldBranding
		modulesDir = oldModulesDir
	})

	if err := os.MkdirAll(calamaresModulesBranding, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(modulesDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(calamaresModulesBranding, "users.yaml"), []byte("userGroup: users\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(calamaresModulesBranding, "README.md"), []byte("ignored\n"), 0644); err != nil {
		t.Fatal(err)
	}

	if err := calamaresModulesOverlay(); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(filepath.Join(modulesDir, "users.conf"))
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "userGroup: users\n" {
		t.Fatalf("unexpected module overlay: %q", data)
	}
	if _, err := os.Stat(filepath.Join(modulesDir, "README.conf")); !os.IsNotExist(err) {
		t.Fatalf("non-YAML file should be ignored, got: %v", err)
	}
}

func TestCalamaresModulesOverlayWithoutBranding(t *testing.T) {
	oldBranding := calamaresModulesBranding
	calamaresModulesBranding = filepath.Join(t.TempDir(), "missing")
	t.Cleanup(func() { calamaresModulesBranding = oldBranding })

	if err := calamaresModulesOverlay(); err != nil {
		t.Fatalf("missing optional branding must not fail: %v", err)
	}
}
