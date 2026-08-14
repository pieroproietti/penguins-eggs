package setup

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestPartitionConf(t *testing.T) {
	tempDir := t.TempDir()
	oldRoot := InstallerDRoot
	InstallerDRoot = tempDir
	defer func() { InstallerDRoot = oldRoot }()

	if err := partitionConf(); err != nil {
		t.Fatalf("partitionConf failed: %v", err)
	}

	content, err := os.ReadFile(filepath.Join(tempDir, "modules", "partition.conf"))
	if err != nil {
		t.Fatalf("failed to read partition.conf: %v", err)
	}

	confStr := string(content)
	if !strings.Contains(confStr, "defaultFileSystemType:  \"ext4\"") {
		t.Errorf("expected defaultFileSystemType ext4, got:\n%s", confStr)
	}

	tableType := getPartitionTableType()
	if tableType == "msdos" {
		if !strings.Contains(confStr, `availableFileSystemTypes: ["ext4"]`) {
			t.Errorf("expected availableFileSystemTypes [\"ext4\"] on BIOS/msdos, got:\n%s", confStr)
		}
	} else {
		if !strings.Contains(confStr, "availableFileSystemTypes: [\"ext4\"") {
			t.Errorf("expected availableFileSystemTypes starting with ext4, got:\n%s", confStr)
		}
	}
}
