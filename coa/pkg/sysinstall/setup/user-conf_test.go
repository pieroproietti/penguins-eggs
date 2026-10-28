/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

package setup

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestUserConfDefaultHostname(t *testing.T) {
	tempDir := t.TempDir()
	oldRoot := InstallerDRoot
	InstallerDRoot = tempDir
	defer func() { InstallerDRoot = oldRoot }()

	// Execute userConf
	if err := userConf(); err != nil {
		t.Fatalf("userConf failed: %v", err)
	}

	content, err := os.ReadFile(filepath.Join(tempDir, "modules", "users.conf"))
	if err != nil {
		t.Fatalf("failed to read users.conf: %v", err)
	}

	if !strings.Contains(string(content), "template:") {
		t.Errorf("users.conf does not contain template key:\n%s", string(content))
	}
}

func TestUserConfCustomHostnameFile(t *testing.T) {
	tempDir := t.TempDir()
	oldRoot := InstallerDRoot
	InstallerDRoot = tempDir
	defer func() { InstallerDRoot = oldRoot }()

	if err := userConf(); err != nil {
		t.Fatalf("userConf failed: %v", err)
	}

	content, err := os.ReadFile(filepath.Join(tempDir, "modules", "users.conf"))
	if err != nil {
		t.Fatalf("failed to read users.conf: %v", err)
	}

	if !strings.Contains(string(content), `template: "`) {
		t.Errorf("users.conf expected template string, got:\n%s", string(content))
	}
}
