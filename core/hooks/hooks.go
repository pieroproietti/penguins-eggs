// Package hooks provides bidirectional integration with penguins-eggs and
// penguins-recovery.
//
// Outbound (pif → ecosystem):
//   - PreUpgrade   : recovery snapshot before an atomic upgrade
//   - PostUpgrade  : notify eggs after a successful upgrade
//   - MutableEnter : warn eggs that the system is temporarily writable
//   - MutableExit  : optionally trigger an eggs ISO rebuild
//   - PreRollback  : recovery snapshot before a rollback
//
// Inbound (ecosystem → pif):
//   The shell scripts in integration/ register pif as a plugin for both tools.
package hooks

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// Config holds hook settings, typically loaded from pif.toml [hooks].
type Config struct {
	EggsBin     string `toml:"eggs_bin"`
	RecoveryBin string `toml:"recovery_bin"`

	PreUpgradeSnapshot  bool `toml:"pre_upgrade_snapshot"`
	PostUpgradeNotify   bool `toml:"post_upgrade_notify"`
	MutableWarnEggs     bool `toml:"mutable_warn_eggs"`
	PostMutableProduce  bool `toml:"post_mutable_produce"`
	PreRollbackSnapshot bool `toml:"pre_rollback_snapshot"`
}

// DefaultConfig returns safe defaults (all outbound hooks enabled except
// post_mutable_produce which can be slow).
func DefaultConfig() Config {
	return Config{
		EggsBin:             "eggs",
		RecoveryBin:         "penguins-recovery",
		PreUpgradeSnapshot:  true,
		PostUpgradeNotify:   true,
		MutableWarnEggs:     true,
		PostMutableProduce:  false,
		PreRollbackSnapshot: true,
	}
}

// Runner executes ecosystem hooks. A nil Runner is safe — all methods become
// no-ops, so callers don't need to guard against a missing config.
type Runner struct {
	cfg Config
}

// New creates a Runner from cfg.
func New(cfg Config) *Runner {
	return &Runner{cfg: cfg}
}

// PreUpgrade creates a penguins-recovery snapshot before an upgrade begins.
func (r *Runner) PreUpgrade(backendName string) {
	if r == nil || !r.cfg.PreUpgradeSnapshot {
		return
	}
	if !available(r.cfg.RecoveryBin) {
		return
	}
	label := fmt.Sprintf("pre-pif-upgrade-%s", backendName)
	if err := run(r.cfg.RecoveryBin, "snapshot", "create", label); err != nil {
		fmt.Fprintf(os.Stderr, "hooks: pre-upgrade snapshot failed (non-fatal): %v\n", err)
	}
}

// PostUpgrade notifies penguins-eggs that the immutable root changed.
func (r *Runner) PostUpgrade(backendName string) {
	if r == nil || !r.cfg.PostUpgradeNotify {
		return
	}
	if !available(r.cfg.EggsBin) {
		return
	}
	// eggs reads PIF_HOOK to decide what to do
	env := append(os.Environ(),
		"EGGS_HOOK=pif-upgraded",
		"PIF_BACKEND="+backendName,
	)
	if err := runEnv(env, r.cfg.EggsBin, "hook"); err != nil {
		fmt.Fprintf(os.Stderr, "hooks: post-upgrade eggs notify failed (non-fatal): %v\n", err)
	}
}

// MutableEnter warns penguins-eggs that the system is temporarily writable.
func (r *Runner) MutableEnter() {
	if r == nil || !r.cfg.MutableWarnEggs {
		return
	}
	if !available(r.cfg.EggsBin) {
		return
	}
	env := append(os.Environ(), "EGGS_HOOK=pif-mutable-enter")
	if err := runEnv(env, r.cfg.EggsBin, "hook"); err != nil {
		fmt.Fprintf(os.Stderr, "hooks: mutable-enter eggs warn failed (non-fatal): %v\n", err)
	}
}

// MutableExit notifies eggs that immutability has been restored, and
// optionally triggers an ISO rebuild.
func (r *Runner) MutableExit() {
	if r == nil {
		return
	}
	if !available(r.cfg.EggsBin) {
		return
	}
	env := append(os.Environ(), "EGGS_HOOK=pif-mutable-exit")
	if err := runEnv(env, r.cfg.EggsBin, "hook"); err != nil {
		fmt.Fprintf(os.Stderr, "hooks: mutable-exit eggs notify failed (non-fatal): %v\n", err)
	}
	if r.cfg.PostMutableProduce {
		// Fire-and-forget: don't block the caller
		cmd := exec.Command(r.cfg.EggsBin, "produce", "--update-root")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Start(); err != nil {
			fmt.Fprintf(os.Stderr, "hooks: eggs produce --update-root failed to start (non-fatal): %v\n", err)
		}
	}
}

// PreRollback creates a penguins-recovery snapshot before a rollback.
func (r *Runner) PreRollback(snapshotID string) {
	if r == nil || !r.cfg.PreRollbackSnapshot {
		return
	}
	if !available(r.cfg.RecoveryBin) {
		return
	}
	label := "pre-pif-rollback"
	if snapshotID != "" {
		label += "-" + snapshotID
	}
	if err := run(r.cfg.RecoveryBin, "snapshot", "create", label); err != nil {
		fmt.Fprintf(os.Stderr, "hooks: pre-rollback snapshot failed (non-fatal): %v\n", err)
	}
}

// ── helpers ──────────────────────────────────────────────────────────────────

func available(binary string) bool {
	if binary == "" {
		return false
	}
	_, err := exec.LookPath(binary)
	return err == nil
}

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%s %s: %s: %w", name, strings.Join(args, " "),
			strings.TrimSpace(string(out)), err)
	}
	return nil
}

func runEnv(env []string, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Env = env
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%s %s: %s: %w", name, strings.Join(args, " "),
			strings.TrimSpace(string(out)), err)
	}
	return nil
}
