/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

package builder

import (
	sysctx "coa/pkg/context"
	"os"
	"path/filepath"
	"testing"
)

func TestStagingBootloaders(t *testing.T) {
	tmpDir := t.TempDir()

	projRoot := filepath.Join(tmpDir, "repo")
	stageDir := filepath.Join(tmpDir, "stage")
	buildDir := filepath.Join(tmpDir, "build")

	// Set up mock repo dirs needed by staging
	os.MkdirAll(filepath.Join(projRoot, "coa/pkg/assets/configs/scripts"), 0755)
	os.MkdirAll(filepath.Join(projRoot, "coa/branding.default"), 0755)
	os.MkdirAll(filepath.Join(projRoot, "coa/brain.d"), 0755)
	os.WriteFile(filepath.Join(projRoot, "coa/pkg/assets/configs/custom.yaml"), []byte(""), 0644)
	os.WriteFile(filepath.Join(projRoot, "coa/pkg/assets/configs/custom.exclude.list"), []byte(""), 0644)

	// Set up mock build dir
	os.MkdirAll(buildDir, 0755)
	os.WriteFile(filepath.Join(buildDir, "oa"), []byte("oa-binary"), 0755)
	os.WriteFile(filepath.Join(buildDir, "coa"), []byte("coa-binary"), 0755)

	// Set up mock user cache for bootloaders so EnsureBootloaders finds it without network
	mockCache := filepath.Join(tmpDir, "cache")
	mockBootloaders := filepath.Join(mockCache, "penguins-eggs", "bootloaders")
	os.MkdirAll(filepath.Join(mockBootloaders, "ISOLINUX"), 0755)
	os.WriteFile(filepath.Join(mockBootloaders, ".download-complete"), []byte("ok\n"), 0644)
	os.WriteFile(filepath.Join(mockBootloaders, "ISOLINUX", "isohdpfx.bin"), []byte("mock-mbr"), 0644)

	origXDG := os.Getenv("XDG_CACHE_HOME")
	defer os.Setenv("XDG_CACHE_HOME", origXDG)
	os.Setenv("XDG_CACHE_HOME", mockCache)

	ctx := sysctx.RuntimeContext{
		ProjRoot:     projRoot,
		StageDir:     stageDir,
		BaseBuildDir: buildDir,
	}

	resultStage := staging(ctx)
	if resultStage != stageDir {
		t.Errorf("expected %s, got %s", stageDir, resultStage)
	}

	// Verify that bootloaders were staged into usr/share/penguins-eggs/bootloaders
	stagedBootloaders := filepath.Join(stageDir, "usr/share/penguins-eggs/bootloaders")
	fi, err := os.Stat(stagedBootloaders)
	if err != nil || !fi.IsDir() {
		t.Fatalf("expected staged bootloaders directory at %s", stagedBootloaders)
	}

	isohdpfx := filepath.Join(stagedBootloaders, "ISOLINUX", "isohdpfx.bin")
	if _, err := os.Stat(isohdpfx); err != nil {
		t.Errorf("expected staged isohdpfx.bin at %s", isohdpfx)
	}
}
