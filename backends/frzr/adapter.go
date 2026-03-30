// Package frzr adapts ChimeraOS/frzr to the ILF HAL.
//
// frzr deploys pre-built OS images as read-only BTRFS subvolumes.
// Updates are downloaded at boot and applied to a separate subvolume;
// /home and /var persist across deploys as separate subvolumes.
//
// Upstream: https://github.com/ChimeraOS/frzr
// License:  MIT
package frzr

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/ilf/core/hal"
)

func init() {
	hal.Register(&Backend{})
}

// Backend implements hal.Backend for frzr.
type Backend struct {
	cfg map[string]string
}

func (b *Backend) Name() string { return "frzr" }

func (b *Backend) Capabilities() hal.Capability {
	// frzr is image-deploy focused; no per-package atomic installs.
	return hal.CapRollback | hal.CapOCIImages
}

func (b *Backend) Init(cfg map[string]string) error {
	b.cfg = cfg
	if _, err := exec.LookPath("frzr-deploy"); err != nil {
		return fmt.Errorf("frzr: frzr-deploy not found — install frzr first")
	}
	return nil
}

// Upgrade deploys the latest image from the configured source channel.
// frzr source format: <user>/<repo>:<channel>
func (b *Backend) Upgrade(opts hal.UpgradeOptions) error {
	source := get(b.cfg, "source", "")
	if source == "" {
		return fmt.Errorf("frzr: backend.frzr.source must be set in ilf.toml")
	}
	if opts.DryRun {
		fmt.Printf("frzr: dry-run — would run: frzr-deploy %s\n", source)
		return nil
	}
	return run("frzr-deploy", source)
}

// Rollback re-deploys the previous image subvolume.
// frzr keeps the previous subvolume until the next successful deploy.
func (b *Backend) Rollback(snapshotID string) error {
	if snapshotID != "" {
		return run("frzr-deploy", "--subvol", snapshotID)
	}
	return run("frzr-deploy", "--rollback")
}

// frzr does not expose named snapshot management; these are unsupported.
func (b *Backend) Snapshot(name string) (string, error) { return "", hal.ErrNotSupported }
func (b *Backend) DeleteSnapshot(id string) error       { return hal.ErrNotSupported }
func (b *Backend) Deploy(snapshotID string) error       { return hal.ErrNotSupported }

func (b *Backend) Status() (*hal.Status, error) {
	out, err := exec.Command("frzr-release").Output()
	if err != nil {
		return nil, fmt.Errorf("frzr status: %w", err)
	}
	return &hal.Status{
		Backend:     b.Name(),
		CurrentRoot: strings.TrimSpace(string(out)),
		Extra:       map[string]string{},
	}, nil
}

// frzr root is read-only by design; there is no supported mutable mode.
// Callers should use the core/mutable overlay method instead.
func (b *Backend) MutableEnter() (func() error, error) {
	return nil, hal.ErrNotSupported
}

// frzr is image-based; per-package operations are not supported.
func (b *Backend) PkgAdd(packages []string) error    { return hal.ErrNotSupported }
func (b *Backend) PkgRemove(packages []string) error { return hal.ErrNotSupported }

// helpers

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%s %s: %s: %w", name, strings.Join(args, " "),
			strings.TrimSpace(string(out)), err)
	}
	return nil
}

func get(m map[string]string, key, def string) string {
	if v, ok := m[key]; ok && v != "" {
		return v
	}
	return def
}
