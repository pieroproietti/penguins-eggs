package engine

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

func TestGenerateMachineID(t *testing.T) {
	idRegex := regexp.MustCompile(`^[0-9a-f]{32}\n$`)

	id1, err := generateMachineID()
	if err != nil {
		t.Fatalf("generateMachineID failed: %v", err)
	}
	if !idRegex.MatchString(id1) {
		t.Fatalf("generateMachineID returned invalid format: %q", id1)
	}
	if id1 == "00000000000000000000000000000000\n" {
		t.Fatal("generateMachineID returned all-zeros ID")
	}

	id2, err := generateMachineID()
	if err != nil {
		t.Fatalf("generateMachineID second call failed: %v", err)
	}
	if id1 == id2 {
		t.Fatalf("generateMachineID produced identical IDs across invocations: %s", id1)
	}
}

func TestRunMachineid(t *testing.T) {
	target := t.TempDir()
	dbusDir := filepath.Join(target, "var", "lib", "dbus")
	if err := os.MkdirAll(dbusDir, 0755); err != nil {
		t.Fatalf("mkdir dbus dir: %v", err)
	}

	c := &ctx{
		plan: &Plan{
			Target: target,
		},
	}

	if err := runMachineid(c); err != nil {
		t.Fatalf("runMachineid returned error: %v", err)
	}

	midPath := filepath.Join(target, "etc", "machine-id")
	content, err := os.ReadFile(midPath)
	if err != nil {
		t.Fatalf("read /etc/machine-id: %v", err)
	}

	id := string(content)
	idRegex := regexp.MustCompile(`^[0-9a-f]{32}\n$`)
	if !idRegex.MatchString(id) {
		t.Fatalf("invalid /etc/machine-id content: %q", id)
	}

	dbusID := filepath.Join(dbusDir, "machine-id")
	fi, err := os.Lstat(dbusID)
	if err != nil {
		t.Fatalf("stat /var/lib/dbus/machine-id: %v", err)
	}

	// It should be a symlink pointing to /etc/machine-id (or fallback file with same content)
	if fi.Mode()&os.ModeSymlink != 0 {
		linkTarget, err := os.Readlink(dbusID)
		if err != nil {
			t.Fatalf("readlink /var/lib/dbus/machine-id: %v", err)
		}
		if linkTarget != "/etc/machine-id" {
			t.Fatalf("expected symlink target '/etc/machine-id', got %q", linkTarget)
		}
	} else {
		dbusContent, err := os.ReadFile(dbusID)
		if err != nil {
			t.Fatalf("read /var/lib/dbus/machine-id file: %v", err)
		}
		if string(dbusContent) != id {
			t.Fatalf("dbus machine-id content mismatch: got %q, want %q", string(dbusContent), id)
		}
	}
}

func TestRunMachineidWithoutDbusDir(t *testing.T) {
	target := t.TempDir()
	c := &ctx{
		plan: &Plan{
			Target: target,
		},
	}

	if err := runMachineid(c); err != nil {
		t.Fatalf("runMachineid returned error: %v", err)
	}

	midPath := filepath.Join(target, "etc", "machine-id")
	content, err := os.ReadFile(midPath)
	if err != nil {
		t.Fatalf("read /etc/machine-id: %v", err)
	}

	id := strings.TrimSpace(string(content))
	if len(id) != 32 {
		t.Fatalf("expected 32 hex chars, got %d: %q", len(id), id)
	}
}
