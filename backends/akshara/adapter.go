// Package akshara adapts blend-os/akshara to the PIF HAL.
//
// akshara is a declarative system builder: a system.yaml file describes
// the desired OS state (base image + packages + overlays), and akshara
// rebuilds the system image on each upgrade. It is Arch/pacman-native
// but the YAML model is portable.
//
// Upstream: https://github.com/blend-os/akshara
// License:  GPL-3.0
package akshara

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/penguins-immutable-framework/core/hal"
)

func init() {
	hal.Register(&Backend{})
}

// Backend implements hal.Backend for akshara.
type Backend struct {
	cfg        map[string]string
	systemYAML string
}

func (b *Backend) Name() string { return "akshara" }

func (b *Backend) Capabilities() hal.Capability {
	return hal.CapSnapshot |
		hal.CapRollback |
		hal.CapAtomicPkg |
		hal.CapMutable
}

func (b *Backend) Init(cfg map[string]string) error {
	b.cfg = cfg
	b.systemYAML = get(cfg, "system_yaml", "/system.yaml")
	if _, err := exec.LookPath("akshara"); err != nil {
		return fmt.Errorf("akshara: binary not found — install akshara first")
	}
	return nil
}

func (b *Backend) Upgrade(opts hal.UpgradeOptions) error {
	if opts.DryRun {
		fmt.Println("akshara: dry-run — would run: akshara update")
		return nil
	}
	return run("akshara", "update")
}

func (b *Backend) Rollback(snapshotID string) error {
	if snapshotID != "" {
		return run("akshara", "rollback", snapshotID)
	}
	return run("akshara", "rollback")
}

// Snapshot creates a named snapshot by calling akshara's snapshot subcommand.
func (b *Backend) Snapshot(name string) (string, error) {
	out, err := exec.Command("akshara", "snapshot", "create", "--name", name).Output()
	if err != nil {
		return "", fmt.Errorf("akshara snapshot: %w", err)
	}
	return strings.TrimSpace(string(out)), nil
}

func (b *Backend) DeleteSnapshot(id string) error {
	return run("akshara", "snapshot", "delete", id)
}

func (b *Backend) Deploy(snapshotID string) error {
	return run("akshara", "snapshot", "deploy", snapshotID)
}

func (b *Backend) Status() (*hal.Status, error) {
	out, err := exec.Command("akshara", "status").Output()
	if err != nil {
		return nil, fmt.Errorf("akshara status: %w", err)
	}
	return &hal.Status{
		Backend:     b.Name(),
		CurrentRoot: strings.TrimSpace(string(out)),
		Extra:       map[string]string{},
	}, nil
}

func (b *Backend) MutableEnter() (func() error, error) {
	if err := run("akshara", "mutable", "on"); err != nil {
		return nil, fmt.Errorf("akshara mutable enter: %w", err)
	}
	return func() error {
		return run("akshara", "mutable", "off")
	}, nil
}

// PkgAdd adds packages to system.yaml and triggers a rebuild.
func (b *Backend) PkgAdd(packages []string) error {
	if err := b.editSystemYAML(packages, true); err != nil {
		return err
	}
	return run("akshara", "update")
}

// PkgRemove removes packages from system.yaml and triggers a rebuild.
func (b *Backend) PkgRemove(packages []string) error {
	if err := b.editSystemYAML(packages, false); err != nil {
		return err
	}
	return run("akshara", "update")
}

// editSystemYAML adds or removes packages from the system.yaml declaration.
func (b *Backend) editSystemYAML(packages []string, add bool) error {
	data, err := os.ReadFile(b.systemYAML)
	if err != nil {
		return fmt.Errorf("akshara: read %s: %w", b.systemYAML, err)
	}

	var doc map[string]any
	if err := yaml.Unmarshal(data, &doc); err != nil {
		return fmt.Errorf("akshara: parse %s: %w", b.systemYAML, err)
	}

	pkgList, _ := doc["packages"].([]any)
	if add {
		for _, p := range packages {
			pkgList = append(pkgList, p)
		}
	} else {
		remove := make(map[string]bool, len(packages))
		for _, p := range packages {
			remove[p] = true
		}
		var filtered []any
		for _, p := range pkgList {
			if !remove[fmt.Sprintf("%v", p)] {
				filtered = append(filtered, p)
			}
		}
		pkgList = filtered
	}
	doc["packages"] = pkgList

	out, err := yaml.Marshal(doc)
	if err != nil {
		return err
	}
	return os.WriteFile(b.systemYAML, out, 0o644)
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

func get(m map[string]string, key, def string) string {
	if v, ok := m[key]; ok && v != "" {
		return v
	}
	return def
}
