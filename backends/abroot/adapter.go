// Package abroot adapts Vanilla-OS/ABRoot v2 to the ILF HAL.
//
// ABRoot performs atomic transactions between two root partitions (A and B),
// pulling OCI images from a registry. This adapter shells out to the `abroot`
// binary and translates its exit codes / output into HAL types.
//
// Upstream: https://github.com/Vanilla-OS/ABRoot
// License:  GPL-3.0
package abroot

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/ilf/core/hal"
)

func init() {
	hal.Register(&Backend{})
}

// Backend implements hal.Backend for ABRoot.
type Backend struct {
	cfg map[string]string
}

func (b *Backend) Name() string { return "abroot" }

func (b *Backend) Capabilities() hal.Capability {
	return hal.CapRollback |
		hal.CapAtomicPkg |
		hal.CapOCIImages |
		hal.CapMutable |
		hal.CapThinProvision
}

// Init writes the abroot.json config derived from the ILF config map.
func (b *Backend) Init(cfg map[string]string) error {
	b.cfg = cfg

	abrootCfg := map[string]any{
		"maxParallelDownloads": 2,
		"registry":             get(cfg, "registry", "ghcr.io"),
		"registryService":      get(cfg, "registry_service", "registry.ghcr.io"),
		"registryAPIVersion":   get(cfg, "registry_api", "v2"),
		"name":                 get(cfg, "image", ""),
		"tag":                  get(cfg, "tag", "main"),
		"iPkgMngPre":           get(cfg, "pkg_pre", ""),
		"iPkgMngPost":          get(cfg, "pkg_post", ""),
		"iPkgMngAdd":           get(cfg, "pkg_add", "apt install -y"),
		"iPkgMngRm":            get(cfg, "pkg_remove", "apt remove -y"),
		"partLabelA":           get(cfg, "part_label_a", "vos-a"),
		"partLabelB":           get(cfg, "part_label_b", "vos-b"),
		"partLabelBoot":        get(cfg, "part_label_boot", "vos-boot"),
		"partLabelEfi":         get(cfg, "part_label_efi", "vos-efi"),
		"partLabelVar":         get(cfg, "part_label_var", "vos-var"),
		"thinProvisioning":     get(cfg, "thin_provisioning", "false") == "true",
	}

	data, err := json.MarshalIndent(abrootCfg, "", "    ")
	if err != nil {
		return err
	}
	return writeFile("/etc/abroot/abroot.json", data)
}

func (b *Backend) Upgrade(opts hal.UpgradeOptions) error {
	args := []string{"upgrade"}
	if opts.DryRun {
		// ABRoot has no native dry-run; report intent only.
		fmt.Println("abroot: dry-run — would run: abroot upgrade")
		return nil
	}
	if opts.Force {
		args = append(args, "--force")
	}
	return run("abroot", args...)
}

func (b *Backend) Rollback(snapshotID string) error {
	// ABRoot rollback switches to the inactive A/B partition.
	// snapshotID is ignored; ABRoot manages the A↔B state internally.
	return run("abroot", "rollback")
}

// ABRoot does not expose named snapshots; these operations are unsupported.
func (b *Backend) Snapshot(name string) (string, error) {
	return "", hal.ErrNotSupported
}
func (b *Backend) DeleteSnapshot(id string) error { return hal.ErrNotSupported }
func (b *Backend) Deploy(snapshotID string) error { return hal.ErrNotSupported }

func (b *Backend) Status() (*hal.Status, error) {
	out, err := exec.Command("abroot", "status", "--json").Output()
	if err != nil {
		return nil, fmt.Errorf("abroot status: %w", err)
	}
	var raw map[string]any
	if err := json.Unmarshal(out, &raw); err != nil {
		return nil, err
	}
	st := &hal.Status{
		Backend: b.Name(),
		Extra:   map[string]string{},
	}
	if v, ok := raw["current"].(string); ok {
		st.CurrentRoot = v
	}
	return st, nil
}

func (b *Backend) MutableEnter() (func() error, error) {
	// ABRoot uses `abroot pkg` for atomic changes; direct mutable mode is
	// available via `abroot kargs` or by unlocking with lpkg.
	if err := run("lpkg", "--unlock"); err != nil {
		return nil, fmt.Errorf("abroot mutable enter: %w", err)
	}
	return func() error {
		return run("lpkg", "--lock")
	}, nil
}

func (b *Backend) PkgAdd(packages []string) error {
	return run("abroot", append([]string{"pkg", "add"}, packages...)...)
}

func (b *Backend) PkgRemove(packages []string) error {
	return run("abroot", append([]string{"pkg", "remove"}, packages...)...)
}

// helpers

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = nil
	cmd.Stderr = nil
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

// writeFile writes data to path atomically (temp file + rename).
func writeFile(path string, data []byte) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp := path + ".ilf.tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
