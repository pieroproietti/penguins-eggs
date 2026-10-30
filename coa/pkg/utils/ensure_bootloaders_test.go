/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

package utils

import (
	"os"
	"path/filepath"
	"testing"
)

func TestIsValidBootloadersDir(t *testing.T) {
	tmpDir := t.TempDir()

	// Empty path
	if IsValidBootloadersDir("") {
		t.Errorf("expected empty path to be invalid")
	}

	// Non-existent path
	if IsValidBootloadersDir(filepath.Join(tmpDir, "does-not-exist")) {
		t.Errorf("expected non-existent path to be invalid")
	}

	// Empty directory
	emptyDir := filepath.Join(tmpDir, "empty")
	if err := os.MkdirAll(emptyDir, 0755); err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	if IsValidBootloadersDir(emptyDir) {
		t.Errorf("expected empty directory to be invalid")
	}

	// Directory with completion marker
	markerDir := filepath.Join(tmpDir, "with-marker")
	if err := os.MkdirAll(markerDir, 0755); err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(markerDir, completeMarker), []byte("ok"), 0644); err != nil {
		t.Fatalf("failed to write marker: %v", err)
	}
	if !IsValidBootloadersDir(markerDir) {
		t.Errorf("expected directory with marker to be valid")
	}

	// Directory with ISOLINUX directory
	isoLinuxDir := filepath.Join(tmpDir, "with-isolinux")
	if err := os.MkdirAll(filepath.Join(isoLinuxDir, "ISOLINUX"), 0755); err != nil {
		t.Fatalf("failed to create ISOLINUX dir: %v", err)
	}
	if !IsValidBootloadersDir(isoLinuxDir) {
		t.Errorf("expected directory with ISOLINUX to be valid")
	}

	// Directory with grub directory
	grubDir := filepath.Join(tmpDir, "with-grub")
	if err := os.MkdirAll(filepath.Join(grubDir, "grub"), 0755); err != nil {
		t.Fatalf("failed to create grub dir: %v", err)
	}
	if !IsValidBootloadersDir(grubDir) {
		t.Errorf("expected directory with grub to be valid")
	}
}

func TestGetUserBootloadersCacheDir(t *testing.T) {
	origXDG := os.Getenv("XDG_CACHE_HOME")
	defer os.Setenv("XDG_CACHE_HOME", origXDG)

	// Test with explicit XDG_CACHE_HOME
	testCache := "/tmp/custom-cache"
	os.Setenv("XDG_CACHE_HOME", testCache)
	expected := filepath.Join(testCache, "penguins-eggs", "bootloaders")
	if got := GetUserBootloadersCacheDir(); got != expected {
		t.Errorf("expected %s, got %s", expected, got)
	}

	// Test fallback to HOME/.cache
	os.Unsetenv("XDG_CACHE_HOME")
	home, err := os.UserHomeDir()
	if err == nil && home != "" {
		expectedHome := filepath.Join(home, ".cache", "penguins-eggs", "bootloaders")
		if got := GetUserBootloadersCacheDir(); got != expectedHome {
			t.Errorf("expected %s, got %s", expectedHome, got)
		}
	}
}

func TestEnsureBootloaders_ExistingTarget(t *testing.T) {
	tmpDir := t.TempDir()
	targetDir := filepath.Join(tmpDir, "bootloaders")

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		t.Fatalf("failed to create targetDir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(targetDir, completeMarker), []byte("ok"), 0644); err != nil {
		t.Fatalf("failed to write marker: %v", err)
	}

	// Calling EnsureBootloaders with an already-populated directory must return immediately
	resolved, err := EnsureBootloaders(targetDir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resolved != targetDir {
		t.Errorf("expected %s, got %s", targetDir, resolved)
	}
}

func TestEnsureBootloaders_PermissionError(t *testing.T) {
	if os.Geteuid() == 0 {
		t.Skip("skipping permission error test when running as root")
	}

	forbiddenDir := "/root/nonexistent-eggs-dir/bootloaders"
	_, err := EnsureBootloaders(forbiddenDir)
	if err == nil {
		t.Errorf("expected permission error when target directory is unwritable, got nil")
	}
}
