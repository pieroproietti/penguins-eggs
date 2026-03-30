package nixconfig_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/penguins-immutable-framework/backends/nixos"
)

// writeConfig writes content to a temp file and returns its path.
func writeConfig(t *testing.T, content string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "configuration.nix")
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("writeConfig: %v", err)
	}
	return path
}

// readConfig reads the file at path.
func readConfig(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("readConfig: %v", err)
	}
	return string(data)
}

const configWithPkgs = `{ config, pkgs, ... }:
{
  environment.systemPackages = with pkgs; [
    git
    vim
  ];
}
`

const configExplicitPkgs = `{ config, pkgs, ... }:
{
  environment.systemPackages = [
    pkgs.git
    pkgs.vim
  ];
}
`

func TestAddPackage_WithPkgs(t *testing.T) {
	path := writeConfig(t, configWithPkgs)

	if err := nixos.EditNixConfig(path, []string{"curl"}, true); err != nil {
		t.Fatalf("EditNixConfig add: %v", err)
	}

	got := readConfig(t, path)
	if !strings.Contains(got, "curl") {
		t.Errorf("expected 'curl' in config after add; got:\n%s", got)
	}
	// Existing packages must be preserved.
	if !strings.Contains(got, "git") || !strings.Contains(got, "vim") {
		t.Errorf("existing packages removed after add; got:\n%s", got)
	}
}

func TestAddPackage_ExplicitPkgs(t *testing.T) {
	path := writeConfig(t, configExplicitPkgs)

	if err := nixos.EditNixConfig(path, []string{"curl"}, true); err != nil {
		t.Fatalf("EditNixConfig add: %v", err)
	}

	got := readConfig(t, path)
	// In explicit-pkgs form the entry should be "pkgs.curl".
	if !strings.Contains(got, "pkgs.curl") {
		t.Errorf("expected 'pkgs.curl' in config after add; got:\n%s", got)
	}
}

func TestAddPackage_Idempotent(t *testing.T) {
	path := writeConfig(t, configWithPkgs)

	// Add git twice — should only appear once.
	if err := nixos.EditNixConfig(path, []string{"git"}, true); err != nil {
		t.Fatalf("first add: %v", err)
	}
	if err := nixos.EditNixConfig(path, []string{"git"}, true); err != nil {
		t.Fatalf("second add: %v", err)
	}

	got := readConfig(t, path)
	count := strings.Count(got, "git")
	if count != 1 {
		t.Errorf("expected 'git' to appear exactly once; got %d occurrences:\n%s", count, got)
	}
}

func TestRemovePackage_WithPkgs(t *testing.T) {
	path := writeConfig(t, configWithPkgs)

	if err := nixos.EditNixConfig(path, []string{"vim"}, false); err != nil {
		t.Fatalf("EditNixConfig remove: %v", err)
	}

	got := readConfig(t, path)
	if strings.Contains(got, "vim") {
		t.Errorf("expected 'vim' to be removed; got:\n%s", got)
	}
	// git must still be present.
	if !strings.Contains(got, "git") {
		t.Errorf("'git' was incorrectly removed; got:\n%s", got)
	}
}

func TestRemovePackage_ExplicitPkgs(t *testing.T) {
	path := writeConfig(t, configExplicitPkgs)

	// Caller may pass with or without pkgs. prefix — both should work.
	if err := nixos.EditNixConfig(path, []string{"pkgs.vim"}, false); err != nil {
		t.Fatalf("EditNixConfig remove: %v", err)
	}

	got := readConfig(t, path)
	if strings.Contains(got, "vim") {
		t.Errorf("expected 'vim' to be removed; got:\n%s", got)
	}
}

func TestRemovePackage_NotPresent(t *testing.T) {
	path := writeConfig(t, configWithPkgs)
	original := readConfig(t, path)

	// Removing a package that isn't there should be a no-op (no error, no change).
	if err := nixos.EditNixConfig(path, []string{"nonexistent"}, false); err != nil {
		t.Fatalf("EditNixConfig remove nonexistent: %v", err)
	}

	got := readConfig(t, path)
	if got != original {
		t.Errorf("file changed when removing nonexistent package:\nbefore:\n%s\nafter:\n%s",
			original, got)
	}
}

func TestAddThenRemove(t *testing.T) {
	path := writeConfig(t, configWithPkgs)

	if err := nixos.EditNixConfig(path, []string{"htop"}, true); err != nil {
		t.Fatalf("add: %v", err)
	}
	if err := nixos.EditNixConfig(path, []string{"htop"}, false); err != nil {
		t.Fatalf("remove: %v", err)
	}

	got := readConfig(t, path)
	if strings.Contains(got, "htop") {
		t.Errorf("expected 'htop' to be gone after add+remove; got:\n%s", got)
	}
}

func TestPreservesUnrelatedContent(t *testing.T) {
	config := `{ config, pkgs, ... }:
{
  # This comment must survive.
  boot.loader.grub.device = "/dev/sda";

  environment.systemPackages = with pkgs; [
    git
  ];

  networking.hostName = "myhost";
}
`
	path := writeConfig(t, config)

	if err := nixos.EditNixConfig(path, []string{"curl"}, true); err != nil {
		t.Fatalf("EditNixConfig: %v", err)
	}

	got := readConfig(t, path)
	for _, want := range []string{
		"# This comment must survive.",
		`boot.loader.grub.device = "/dev/sda"`,
		`networking.hostName = "myhost"`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("unrelated content %q lost after edit; got:\n%s", want, got)
		}
	}
}

func TestAddPackage_SingleLine_WithPkgs(t *testing.T) {
	config := `{ config, pkgs, ... }:
{
  environment.systemPackages = with pkgs; [ git vim ];
}
`
	path := writeConfig(t, config)

	if err := nixos.EditNixConfig(path, []string{"curl"}, true); err != nil {
		t.Fatalf("EditNixConfig on single-line form: %v", err)
	}

	got := readConfig(t, path)
	for _, want := range []string{"git", "vim", "curl"} {
		if !strings.Contains(got, want) {
			t.Errorf("expected %q in config after add; got:\n%s", want, got)
		}
	}
}

func TestAddPackage_SingleLine_ExplicitPkgs(t *testing.T) {
	config := `{ config, pkgs, ... }:
{
  environment.systemPackages = [ pkgs.git pkgs.vim ];
}
`
	path := writeConfig(t, config)

	if err := nixos.EditNixConfig(path, []string{"curl"}, true); err != nil {
		t.Fatalf("EditNixConfig on single-line explicit form: %v", err)
	}

	got := readConfig(t, path)
	if !strings.Contains(got, "pkgs.curl") {
		t.Errorf("expected 'pkgs.curl' in config; got:\n%s", got)
	}
}

func TestRemovePackage_SingleLine(t *testing.T) {
	config := `{ config, pkgs, ... }:
{
  environment.systemPackages = with pkgs; [ git vim ];
}
`
	path := writeConfig(t, config)

	if err := nixos.EditNixConfig(path, []string{"vim"}, false); err != nil {
		t.Fatalf("EditNixConfig remove on single-line form: %v", err)
	}

	got := readConfig(t, path)
	if strings.Contains(got, "vim") {
		t.Errorf("expected 'vim' removed; got:\n%s", got)
	}
	if !strings.Contains(got, "git") {
		t.Errorf("expected 'git' preserved; got:\n%s", got)
	}
}

func TestMissingSystemPackages(t *testing.T) {
	config := `{ config, pkgs, ... }:
{
  boot.loader.grub.device = "/dev/sda";
}
`
	path := writeConfig(t, config)

	err := nixos.EditNixConfig(path, []string{"git"}, true)
	if err == nil {
		t.Fatal("expected error when environment.systemPackages is absent, got nil")
	}
}
