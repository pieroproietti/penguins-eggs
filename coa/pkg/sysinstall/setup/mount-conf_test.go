package setup

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestParseCalamaresBranch(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		// Standard CLI outputs
		{"calamares 3.3.14", "calamares 3.3.14\n", "3.3"},
		{"calamares 3.2.61", "calamares 3.2.61\n", "3.2"},
		{"Calamares version: 3.2.0", "Calamares version: 3.2.0\n", "3.2"},
		{"Calamares 3.2.39.3", "calamares 3.2.39.3\n", "3.2"},

		// Package manager outputs (dpkg, pacman, rpm)
		{"dpkg 3.2.61-1", "3.2.61-1\n", "3.2"},
		{"dpkg 3.2.61", "3.2.61", "3.2"},
		{"dpkg 3.3.14-1", "3.3.14-1\n", "3.3"},
		{"pacman calamares 3.2.61-1", "calamares 3.2.61-1\n", "3.2"},
		{"pacman calamares 3.3.14-1", "calamares 3.3.14-1\n", "3.3"},
		{"rpm 3.2.61", "3.2.61\n", "3.2"},
		{"rpm 3.3.14", "3.3.14\n", "3.3"},

		// Edge cases
		{"empty string", "", "3.3"},
		{"unknown command output", "command not found\n", "3.3"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseCalamaresBranch(tt.input)
			if got != tt.expected {
				t.Errorf("parseCalamaresBranch(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestMountConfTemplatesRendering(t *testing.T) {
	tempDir := t.TempDir()
	config := MountConfig{
		Date:   time.Now().Format("2006-01-02"),
		IsBIOS: false,
	}

	// 1. Test rendering Calamares 3.2 template
	target32 := filepath.Join(tempDir, "mount-3.2.conf")
	if err := renderAndSaveEmbedded("mount.conf.3.2.tmpl", target32, config, 0644); err != nil {
		t.Fatalf("failed to render mount.conf.3.2.tmpl: %v", err)
	}
	content32, err := os.ReadFile(target32)
	if err != nil {
		t.Fatalf("failed to read rendered 3.2 config: %v", err)
	}
	str32 := string(content32)
	if !strings.Contains(str32, "extraMounts:") {
		t.Errorf("expected extraMounts in 3.2 config, got:\n%s", str32)
	}
	if !strings.Contains(str32, "options: bind") {
		t.Errorf("expected 'options: bind' in 3.2 config, got:\n%s", str32)
	}
	if !strings.Contains(str32, "extraMountsEfi:") {
		t.Errorf("expected extraMountsEfi in 3.2 config, got:\n%s", str32)
	}
	if strings.Contains(str32, "efi: true") {
		t.Errorf("did not expect 'efi: true' in 3.2 config, got:\n%s", str32)
	}
	if strings.Contains(str32, "btrfsSubvolumes:") {
		t.Errorf("did not expect btrfsSubvolumes in 3.2 config, got:\n%s", str32)
	}

	// 2. Test rendering Calamares 3.3 template
	target33 := filepath.Join(tempDir, "mount-3.3.conf")
	if err := renderAndSaveEmbedded("mount.conf.3.3.tmpl", target33, config, 0644); err != nil {
		t.Fatalf("failed to render mount.conf.3.3.tmpl: %v", err)
	}
	content33, err := os.ReadFile(target33)
	if err != nil {
		t.Fatalf("failed to read rendered 3.3 config: %v", err)
	}
	str33 := string(content33)
	if !strings.Contains(str33, "extraMounts:") {
		t.Errorf("expected extraMounts in 3.3 config, got:\n%s", str33)
	}
	if !strings.Contains(str33, "- bind") {
		t.Errorf("expected '- bind' list in 3.3 config, got:\n%s", str33)
	}
	if !strings.Contains(str33, "efi: true") {
		t.Errorf("expected 'efi: true' in 3.3 config, got:\n%s", str33)
	}
	if !strings.Contains(str33, "btrfsSubvolumes:") {
		t.Errorf("expected btrfsSubvolumes in 3.3 config, got:\n%s", str33)
	}
	if !strings.Contains(str33, "mountOptions:") {
		t.Errorf("expected mountOptions in 3.3 config, got:\n%s", str33)
	}
}

func TestMountConfExecution(t *testing.T) {
	tempDir := t.TempDir()
	oldRoot := InstallerDRoot
	InstallerDRoot = tempDir
	defer func() { InstallerDRoot = oldRoot }()

	if err := mountConf(); err != nil {
		t.Fatalf("mountConf() returned error: %v", err)
	}

	generatedFile := filepath.Join(tempDir, "modules", "mount.conf")
	content, err := os.ReadFile(generatedFile)
	if err != nil {
		t.Fatalf("failed to read generated mount.conf: %v", err)
	}

	if len(content) == 0 {
		t.Errorf("generated mount.conf is empty")
	}
}
