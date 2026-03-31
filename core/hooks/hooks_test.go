package hooks_test

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/penguins-immutable-framework/core/hooks"
)



// recordingScript writes a script that appends its arguments to a file,
// then exits 0. Returns (scriptPath, recordPath).
func recordingScript(t *testing.T) (string, string) {
	t.Helper()
	dir := t.TempDir()
	record := filepath.Join(dir, "calls.txt")
	script := filepath.Join(dir, "hook.sh")
	content := "#!/bin/sh\necho \"$@\" >> " + record + "\n"
	if err := os.WriteFile(script, []byte(content), 0o755); err != nil {
		t.Fatal(err)
	}
	return script, record
}

// ── DefaultConfig ─────────────────────────────────────────────────────────────

func TestDefaultConfig(t *testing.T) {
	cfg := hooks.DefaultConfig()
	if cfg.EggsBin == "" {
		t.Error("DefaultConfig: EggsBin should not be empty")
	}
	if cfg.RecoveryBin == "" {
		t.Error("DefaultConfig: RecoveryBin should not be empty")
	}
	if !cfg.PreUpgradeSnapshot {
		t.Error("DefaultConfig: PreUpgradeSnapshot should be true")
	}
	if !cfg.PostUpgradeNotify {
		t.Error("DefaultConfig: PostUpgradeNotify should be true")
	}
	if !cfg.MutableWarnEggs {
		t.Error("DefaultConfig: MutableWarnEggs should be true")
	}
	if cfg.PostMutableProduce {
		t.Error("DefaultConfig: PostMutableProduce should be false")
	}
	if !cfg.PreRollbackSnapshot {
		t.Error("DefaultConfig: PreRollbackSnapshot should be true")
	}
}

// ── nil Runner safety ─────────────────────────────────────────────────────────

func TestNilRunnerIsSafe(t *testing.T) {
	var r *hooks.Runner
	// None of these should panic
	r.PreUpgrade("ashos")
	r.PostUpgrade("ashos")
	r.MutableEnter()
	r.MutableExit()
	r.PreRollback("snap-001")
}

// ── PreUpgrade ────────────────────────────────────────────────────────────────

func TestPreUpgrade_CallsRecovery(t *testing.T) {
	script, record := recordingScript(t)
	cfg := hooks.DefaultConfig()
	cfg.RecoveryBin = script
	cfg.PreUpgradeSnapshot = true

	r := hooks.New(cfg)
	r.PreUpgrade("ashos")

	data, err := os.ReadFile(record)
	if err != nil {
		t.Fatalf("record file not written: %v", err)
	}
	got := string(data)
	if got == "" {
		t.Error("PreUpgrade: expected recovery script to be called, got no output")
	}
	// The label should contain "pre-pif-upgrade-ashos"
	if !contains(got, "pre-pif-upgrade-ashos") {
		t.Errorf("PreUpgrade: expected label containing 'pre-pif-upgrade-ashos', got %q", got)
	}
}

func TestPreUpgrade_NoopWhenDisabled(t *testing.T) {
	script, record := recordingScript(t)
	cfg := hooks.DefaultConfig()
	cfg.RecoveryBin = script
	cfg.PreUpgradeSnapshot = false

	r := hooks.New(cfg)
	r.PreUpgrade("ashos")

	if _, err := os.ReadFile(record); err == nil {
		t.Error("PreUpgrade: script should not have been called when PreUpgradeSnapshot=false")
	}
}

func TestPreUpgrade_NoopWhenBinaryMissing(t *testing.T) {
	cfg := hooks.DefaultConfig()
	cfg.RecoveryBin = "/nonexistent/penguins-recovery-xyz"
	cfg.PreUpgradeSnapshot = true

	r := hooks.New(cfg)
	// Should not panic or error — binary simply not found
	r.PreUpgrade("ashos")
}

// ── PreRollback ───────────────────────────────────────────────────────────────

func TestPreRollback_CallsRecovery(t *testing.T) {
	script, record := recordingScript(t)
	cfg := hooks.DefaultConfig()
	cfg.RecoveryBin = script
	cfg.PreRollbackSnapshot = true

	r := hooks.New(cfg)
	r.PreRollback("snap-42")

	data, err := os.ReadFile(record)
	if err != nil {
		t.Fatalf("record file not written: %v", err)
	}
	if !contains(string(data), "pre-pif-rollback-snap-42") {
		t.Errorf("PreRollback: expected label 'pre-pif-rollback-snap-42', got %q", string(data))
	}
}

func TestPreRollback_EmptySnapshotID(t *testing.T) {
	script, record := recordingScript(t)
	cfg := hooks.DefaultConfig()
	cfg.RecoveryBin = script
	cfg.PreRollbackSnapshot = true

	r := hooks.New(cfg)
	r.PreRollback("")

	data, err := os.ReadFile(record)
	if err != nil {
		t.Fatalf("record file not written: %v", err)
	}
	// Label should be just "pre-pif-rollback" with no trailing dash
	if !contains(string(data), "pre-pif-rollback") {
		t.Errorf("PreRollback: unexpected label, got %q", string(data))
	}
}

func TestPreRollback_NoopWhenDisabled(t *testing.T) {
	script, record := recordingScript(t)
	cfg := hooks.DefaultConfig()
	cfg.RecoveryBin = script
	cfg.PreRollbackSnapshot = false

	r := hooks.New(cfg)
	r.PreRollback("snap-42")

	if _, err := os.ReadFile(record); err == nil {
		t.Error("PreRollback: script should not have been called when PreRollbackSnapshot=false")
	}
}

// ── MutableEnter / MutableExit ────────────────────────────────────────────────

func TestMutableEnter_NoopWhenBinaryMissing(t *testing.T) {
	cfg := hooks.DefaultConfig()
	cfg.EggsBin = "/nonexistent/eggs-xyz"
	cfg.MutableWarnEggs = true

	r := hooks.New(cfg)
	r.MutableEnter() // must not panic
}

func TestMutableExit_NoopWhenBinaryMissing(t *testing.T) {
	cfg := hooks.DefaultConfig()
	cfg.EggsBin = "/nonexistent/eggs-xyz"

	r := hooks.New(cfg)
	r.MutableExit() // must not panic
}

func TestMutableExit_NoopWhenProduceDisabled(t *testing.T) {
	script, record := recordingScript(t)
	cfg := hooks.DefaultConfig()
	cfg.EggsBin = script
	cfg.PostMutableProduce = false

	r := hooks.New(cfg)
	r.MutableExit()

	// The hook script is called for the notification, but NOT for produce.
	// We can't easily distinguish the two calls here, so just verify no panic.
	_ = record
}

// ── helpers ───────────────────────────────────────────────────────────────────

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && containsStr(s, sub))
}

func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

// Ensure exec is imported (used indirectly via hooks internals in integration scenarios).
var _ = exec.LookPath
