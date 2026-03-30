// Package update orchestrates atomic system upgrades through the HAL.
// It runs pre/post hooks, creates a pre-upgrade snapshot, delegates to the
// backend, and rolls back automatically on failure.
package update

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/ilf/core/hal"
	"github.com/ilf/core/snapshot"
)

// Options controls upgrade behaviour.
type Options struct {
	DryRun        bool
	Force         bool
	Packages      []string
	PreHook       string // path to executable, or empty
	PostHook      string
	AutoRollback  bool // roll back if upgrade fails
	SnapshotLabel string
	MaxSnapshots  int
}

// Run performs an atomic upgrade via the given backend.
func Run(b hal.Backend, opts Options) error {
	mgr := snapshot.New(b, opts.MaxSnapshots)

	// Pre-upgrade snapshot so we can roll back on failure.
	var preSnapID string
	if hal.Has(b, hal.CapSnapshot) && !opts.DryRun {
		label := opts.SnapshotLabel
		if label == "" {
			label = "pre-upgrade"
		}
		id, err := mgr.Create(label)
		if err != nil {
			return fmt.Errorf("update: pre-upgrade snapshot: %w", err)
		}
		preSnapID = id
		fmt.Printf("update: pre-upgrade snapshot created: %s\n", preSnapID)
	}

	if err := runHook(opts.PreHook); err != nil {
		return fmt.Errorf("update: pre-hook: %w", err)
	}

	upgradeErr := b.Upgrade(hal.UpgradeOptions{
		DryRun:   opts.DryRun,
		Force:    opts.Force,
		Packages: opts.Packages,
	})

	if upgradeErr != nil {
		fmt.Fprintf(os.Stderr, "update: upgrade failed: %v\n", upgradeErr)
		if opts.AutoRollback && preSnapID != "" {
			fmt.Println("update: rolling back to pre-upgrade snapshot...")
			if rbErr := mgr.Rollback(preSnapID); rbErr != nil {
				return fmt.Errorf("update: rollback also failed: %v (original: %w)", rbErr, upgradeErr)
			}
			fmt.Println("update: rollback successful")
		}
		return upgradeErr
	}

	if err := runHook(opts.PostHook); err != nil {
		return fmt.Errorf("update: post-hook: %w", err)
	}

	return nil
}

func runHook(path string) error {
	if path == "" {
		return nil
	}
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("hook not found: %s", path)
	}
	cmd := exec.Command(path)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%s: %s: %w", path, strings.TrimSpace(string(out)), err)
	}
	return nil
}
