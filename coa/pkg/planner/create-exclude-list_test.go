/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

package planner

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestGenerateExcludeListLiverootCheck(t *testing.T) {
	// Create a temporary directory mimicking a workspace
	tmpWorkDir, err := os.MkdirTemp("", "eggs-test-workdir-*")
	if err != nil {
		t.Fatalf("failed to create temp workdir: %v", err)
	}
	defer os.RemoveAll(tmpWorkDir)

	tmpExcludeList := filepath.Join(tmpWorkDir, "excludes.list")
	t.Setenv("EGGS_EXCLUDE_LIST_PATH", tmpExcludeList)

	// 1. Without liveroot existing in tmpWorkDir
	listPath := GenerateExcludeList("standard", false, tmpWorkDir)
	data, err := os.ReadFile(listPath)
	if err != nil {
		t.Fatalf("failed to read generated exclude list: %v", err)
	}

	content := string(data)
	relTmpLiveroot := strings.TrimPrefix(filepath.Join(tmpWorkDir, "liveroot"), "/")
	if strings.Contains(content, relTmpLiveroot) {
		t.Fatalf("expected exclude list NOT to contain non-existent liveroot '%s'", relTmpLiveroot)
	}

	// 2. Now create liveroot in tmpWorkDir
	liveRootDir := filepath.Join(tmpWorkDir, "liveroot")
	if err := os.MkdirAll(liveRootDir, 0755); err != nil {
		t.Fatalf("failed to create liveRootDir: %v", err)
	}

	listPath2 := GenerateExcludeList("standard", false, tmpWorkDir)
	data2, err := os.ReadFile(listPath2)
	if err != nil {
		t.Fatalf("failed to read generated exclude list: %v", err)
	}

	content2 := string(data2)
	if !strings.Contains(content2, relTmpLiveroot) {
		t.Fatalf("expected exclude list to contain existing liveroot '%s'", relTmpLiveroot)
	}
}

func TestGenerateExcludeListDefaultCompatibility(t *testing.T) {
	// Calling with only 2 arguments (backwards compatibility)
	listPath := GenerateExcludeList("standard", false)
	if _, err := os.Stat(listPath); err != nil {
		t.Fatalf("exclude list was not generated: %v", err)
	}
}
