// Package btrfsdwarfs adapts the btrfs-dwarfs-framework to the PIF HAL.
// Directory: backends/btrfsdwarfs  (hyphen invalid in Go package paths)
//
// The BTRFS+DwarFS framework provides a hybrid filesystem: a writable BTRFS
// upper layer blended with compressed read-only DwarFS lower layers.
// This adapter shells out to the `bdfs` CLI and `bdfs_daemon`.
//
// Upstream: https://github.com/Interested-Deving-1896/btrfs-dwarfs-framework
package btrfsdwarfs

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"

	"github.com/penguins-immutable-framework/core/hal"
)

func init() {
	hal.Register(&Backend{})
}

// Backend implements hal.Backend for the BTRFS+DwarFS framework.
type Backend struct {
	cfg map[string]string
}

func (b *Backend) Name() string { return "btrfs-dwarfs" }

func (b *Backend) Capabilities() hal.Capability {
	return hal.CapSnapshot |
		hal.CapRollback |
		hal.CapMutable |
		hal.CapCompression
}

func (b *Backend) Init(cfg map[string]string) error {
	b.cfg = cfg

	if _, err := exec.LookPath("bdfs"); err != nil {
		return fmt.Errorf("btrfs-dwarfs: bdfs CLI not found — build and install btrfs-dwarfs-framework first")
	}
	if _, err := exec.LookPath("bdfs_daemon"); err != nil {
		return fmt.Errorf("btrfs-dwarfs: bdfs_daemon not found")
	}

	// Register the BTRFS upper partition.
	btrfsDev := get(cfg, "btrfs_device", "")
	if btrfsDev == "" {
		return fmt.Errorf("btrfs-dwarfs: backend.btrfs-dwarfs.btrfs_device must be set")
	}
	if err := run("bdfs", "partition", "add",
		"--type", "btrfs-backed",
		"--device", btrfsDev,
		"--label", "pif-upper",
		"--mount", get(cfg, "btrfs_mount", "/mnt/pif-btrfs"),
	); err != nil {
		return fmt.Errorf("btrfs-dwarfs init (btrfs partition): %w", err)
	}

	// Register the DwarFS lower partition.
	dwarfsDev := get(cfg, "dwarfs_device", "")
	if dwarfsDev == "" {
		return fmt.Errorf("btrfs-dwarfs: backend.btrfs-dwarfs.dwarfs_device must be set")
	}
	if err := run("bdfs", "partition", "add",
		"--type", "dwarfs-backed",
		"--device", dwarfsDev,
		"--label", "pif-lower",
		"--mount", get(cfg, "dwarfs_mount", "/mnt/pif-dwarfs"),
	); err != nil {
		return fmt.Errorf("btrfs-dwarfs init (dwarfs partition): %w", err)
	}

	return nil
}

// Upgrade demotes the current BTRFS upper layer to a DwarFS image (archiving
// the old state) and promotes the new image as the active upper layer.
func (b *Backend) Upgrade(opts hal.UpgradeOptions) error {
	if opts.DryRun {
		fmt.Println("btrfs-dwarfs: dry-run — would demote current root and promote new image")
		return nil
	}
	compression := get(b.cfg, "compression", "zstd")
	return run("bdfs", "demote",
		"--blend-path", get(b.cfg, "blend_mount", "/"),
		"--image-name", "pre-upgrade",
		"--compression", compression,
	)
}

// Rollback promotes the previous DwarFS image back to the BTRFS upper layer.
func (b *Backend) Rollback(snapshotID string) error {
	if snapshotID == "" {
		snapshotID = "pre-upgrade"
	}
	return run("bdfs", "promote",
		"--blend-path", get(b.cfg, "blend_mount", "/")+"/"+snapshotID,
		"--subvol-name", "pif-rollback",
	)
}

// Snapshot exports the current BTRFS subvolume to a named DwarFS image.
func (b *Backend) Snapshot(name string) (string, error) {
	compression := get(b.cfg, "compression", "zstd")
	err := run("bdfs", "export",
		"--partition", "pif-lower",
		"--btrfs-mount", get(b.cfg, "btrfs_mount", "/mnt/pif-btrfs"),
		"--name", name,
		"--compression", compression,
		"--verify",
	)
	if err != nil {
		return "", err
	}
	return name, nil
}

func (b *Backend) DeleteSnapshot(id string) error {
	// bdfs does not yet expose a delete-image command; use btrfs subvolume delete.
	return run("btrfs", "subvolume", "delete",
		get(b.cfg, "btrfs_mount", "/mnt/pif-btrfs")+"/"+id)
}

func (b *Backend) Deploy(snapshotID string) error {
	return run("bdfs", "promote",
		"--blend-path", get(b.cfg, "blend_mount", "/")+"/"+snapshotID,
		"--subvol-name", snapshotID+"-live",
	)
}

func (b *Backend) Status() (*hal.Status, error) {
	out, err := exec.Command("bdfs", "status", "--json").Output()
	if err != nil {
		return nil, fmt.Errorf("btrfs-dwarfs status: %w", err)
	}
	var raw map[string]any
	if err := json.Unmarshal(out, &raw); err != nil {
		return nil, err
	}
	st := &hal.Status{
		Backend: b.Name(),
		Extra:   map[string]string{},
	}
	if v, ok := raw["blend_mount"].(string); ok {
		st.CurrentRoot = v
	}
	return st, nil
}

// MutableEnter uses the blend layer's copy-up semantics: writes automatically
// land on the BTRFS upper layer, so the root is effectively always writable
// through the blend namespace. This method is a no-op for btrfs-dwarfs.
func (b *Backend) MutableEnter() (func() error, error) {
	// The blend layer is inherently writable (BTRFS upper absorbs writes).
	return func() error { return nil }, nil
}

// btrfs-dwarfs is image-based; per-package operations are not supported
// at the backend level. Use the core/mutable overlay + native pkg manager.
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
