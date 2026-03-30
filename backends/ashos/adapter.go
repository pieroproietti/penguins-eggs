// Package ashos adapts ashos/ashos to the ILF HAL.
//
// AshOS manages an immutable BTRFS snapshot tree via the `ash` CLI.
// It is distro-agnostic (Arch, Debian, Ubuntu, Alpine, Fedora, Gentoo, etc.)
// and supports hierarchical multi-boot snapshot management.
//
// Upstream: https://github.com/ashos/ashos
// License:  AGPL-3.0
package ashos

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/ilf/core/hal"
)

func init() {
	hal.Register(&Backend{})
}

// Backend implements hal.Backend for AshOS.
type Backend struct {
	cfg map[string]string
}

func (b *Backend) Name() string { return "ashos" }

func (b *Backend) Capabilities() hal.Capability {
	return hal.CapSnapshot |
		hal.CapRollback |
		hal.CapAtomicPkg |
		hal.CapMutable |
		hal.CapMultiBoot
}

func (b *Backend) Init(cfg map[string]string) error {
	b.cfg = cfg
	// AshOS is installed from the target distro's live ISO.
	// `ash` must already be present; Init just validates the environment.
	if _, err := exec.LookPath("ash"); err != nil {
		return fmt.Errorf("ashos: `ash` binary not found — install ashos first")
	}
	return nil
}

func (b *Backend) Upgrade(opts hal.UpgradeOptions) error {
	if opts.DryRun {
		fmt.Println("ashos: dry-run — would run: ash update 0")
		return nil
	}
	// `ash update <snapshot-id>` updates the deployed snapshot.
	// 0 is the currently deployed snapshot by convention.
	return run("ash", "update", "0")
}

func (b *Backend) Rollback(snapshotID string) error {
	if snapshotID == "" {
		// Deploy the parent of the current snapshot.
		return run("ash", "rollback")
	}
	return run("ash", "deploy", snapshotID)
}

// Snapshot creates a clone of snapshot 0 (current) with the given name.
// Returns the numeric snapshot ID assigned by ash.
func (b *Backend) Snapshot(name string) (string, error) {
	// `ash clone <parent-id>` creates a new snapshot; we clone from 0.
	out, err := exec.Command("ash", "clone", "0").Output()
	if err != nil {
		return "", fmt.Errorf("ashos snapshot: %w", err)
	}
	// ash prints the new snapshot ID on stdout.
	id := strings.TrimSpace(string(out))
	if name != "" {
		// ash does not have a native rename; store name in a comment file.
		_ = run("ash", "desc", id, name)
	}
	return id, nil
}

func (b *Backend) DeleteSnapshot(id string) error {
	return run("ash", "del", id)
}

func (b *Backend) Deploy(snapshotID string) error {
	return run("ash", "deploy", snapshotID)
}

func (b *Backend) Status() (*hal.Status, error) {
	out, err := exec.Command("ash", "list").Output()
	if err != nil {
		return nil, fmt.Errorf("ashos status: %w", err)
	}

	st := &hal.Status{
		Backend: b.Name(),
		Extra:   map[string]string{},
	}

	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	for _, line := range lines[1:] { // skip header
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		snap := hal.SnapshotInfo{
			ID:       fields[0],
			Deployed: strings.Contains(line, "*"),
		}
		if len(fields) > 2 {
			snap.Name = fields[2]
		}
		if snap.Deployed {
			st.CurrentRoot = snap.ID
		}
		st.Snapshots = append(st.Snapshots, snap)
	}
	return st, nil
}

func (b *Backend) MutableEnter() (func() error, error) {
	// AshOS supports a mutability toggle via `ash mutable`.
	if err := run("ash", "mutable", "on"); err != nil {
		return nil, fmt.Errorf("ashos mutable enter: %w", err)
	}
	return func() error {
		return run("ash", "mutable", "off")
	}, nil
}

func (b *Backend) PkgAdd(packages []string) error {
	// Install into the current snapshot (0) using the native package manager.
	args := append([]string{"install", "0"}, packages...)
	return run("ash", args...)
}

func (b *Backend) PkgRemove(packages []string) error {
	args := append([]string{"remove", "0"}, packages...)
	return run("ash", args...)
}

// helpers

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%s %s: %s: %w", name, strings.Join(args, " "),
			strings.TrimSpace(string(out)), err)
	}
	return nil
}

// snapshotCount returns the number of snapshots currently managed by ash.
func snapshotCount() (int, error) {
	out, err := exec.Command("ash", "list").Output()
	if err != nil {
		return 0, err
	}
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	n := 0
	for _, l := range lines[1:] {
		if strings.TrimSpace(l) != "" {
			n++
		}
	}
	return n, nil
}
