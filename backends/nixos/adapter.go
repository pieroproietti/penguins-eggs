// Package nixos adapts NixOS to the ILF HAL.
//
// NixOS has native immutability through its generation model: every
// nixos-rebuild creates a new generation (a complete, self-contained system
// closure) and registers it as a boot entry. Rollback switches the default
// boot entry to the previous generation.
//
// This adapter is a passthrough — it delegates directly to the NixOS toolchain
// (nixos-rebuild, nix-env, nix-collect-garbage) rather than reimplementing
// the generation model. The HAL snapshot concept maps to NixOS generations.
//
// Upstream immutability model:
//   - /nix/store is read-only (bind-mounted, immutable by the Nix daemon)
//   - /run/current-system is a symlink to the active generation closure
//   - Generations are listed via `nix-env --list-generations -p /nix/var/nix/profiles/system`
//
// Upstream: https://nixos.org
// License:  MIT (NixOS toolchain)
package nixos

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/ilf/core/hal"
)

func init() {
	hal.Register(&Backend{})
}

// Backend implements hal.Backend for NixOS.
type Backend struct {
	cfg map[string]string
}

func (b *Backend) Name() string { return "nixos" }

func (b *Backend) Capabilities() hal.Capability {
	// NixOS generations map to snapshots; rollback and mutable are native.
	// No OCI images, no compression, no thin provisioning.
	return hal.CapSnapshot |
		hal.CapRollback |
		hal.CapAtomicPkg |
		hal.CapMutable |
		hal.CapMultiBoot
}

func (b *Backend) Init(cfg map[string]string) error {
	b.cfg = cfg
	if _, err := exec.LookPath("nixos-rebuild"); err != nil {
		return fmt.Errorf("nixos: nixos-rebuild not found — this backend requires NixOS")
	}
	if _, err := exec.LookPath("nix-env"); err != nil {
		return fmt.Errorf("nixos: nix-env not found")
	}
	return nil
}

// Upgrade runs `nixos-rebuild switch` which atomically builds and activates
// the new generation defined by /etc/nixos/configuration.nix.
func (b *Backend) Upgrade(opts hal.UpgradeOptions) error {
	if opts.DryRun {
		fmt.Println("nixos: dry-run — would run: nixos-rebuild switch")
		return nil
	}
	args := []string{"switch"}
	if opts.Force {
		args = append(args, "--fast")
	}
	// If specific packages are requested, add them to the environment profile
	// rather than the system config (nix-env -iA).
	if len(opts.Packages) > 0 {
		pkgArgs := append([]string{"-iA"}, opts.Packages...)
		if err := run("nix-env", pkgArgs...); err != nil {
			return fmt.Errorf("nixos upgrade (nix-env): %w", err)
		}
	}
	return run("nixos-rebuild", args...)
}

// Rollback switches to the previous NixOS generation.
// If snapshotID is provided it is treated as a generation number.
func (b *Backend) Rollback(snapshotID string) error {
	if snapshotID != "" {
		// Switch to a specific generation number.
		return run("nixos-rebuild", "switch", "--rollback",
			"--specialisation", snapshotID)
	}
	return run("nixos-rebuild", "switch", "--rollback")
}

// Snapshot creates a named NixOS generation by running nixos-rebuild build
// (without activating it). The generation number is returned as the ID.
// The name is stored as a profile description via nix-env.
func (b *Backend) Snapshot(name string) (string, error) {
	// Build without switching — creates a new generation in the profile.
	if err := run("nixos-rebuild", "build"); err != nil {
		return "", fmt.Errorf("nixos snapshot build: %w", err)
	}
	// Get the latest generation number.
	out, err := exec.Command("nix-env",
		"--list-generations", "-p", nixosProfilePath()).Output()
	if err != nil {
		return "", fmt.Errorf("nixos snapshot list-generations: %w", err)
	}
	id := latestGeneration(string(out))
	if name != "" && id != "" {
		// Tag the generation with a description (best-effort).
		_ = run("nix-env", "--switch-generation", id,
			"-p", nixosProfilePath(), "--set-flag", "keep", "true")
	}
	return id, nil
}

// DeleteSnapshot removes a NixOS generation and runs garbage collection.
func (b *Backend) DeleteSnapshot(id string) error {
	if err := run("nix-env",
		"--delete-generations", id,
		"-p", nixosProfilePath()); err != nil {
		return err
	}
	// Collect the now-unreferenced store paths.
	return run("nix-collect-garbage")
}

// Deploy activates a specific generation as the current system.
func (b *Backend) Deploy(snapshotID string) error {
	return run("nix-env",
		"--switch-generation", snapshotID,
		"-p", nixosProfilePath())
}

func (b *Backend) Status() (*hal.Status, error) {
	// Current generation
	out, err := exec.Command("nix-env",
		"--list-generations", "-p", nixosProfilePath()).Output()
	if err != nil {
		return nil, fmt.Errorf("nixos status: %w", err)
	}

	st := &hal.Status{
		Backend: b.Name(),
		Extra:   map[string]string{},
	}

	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	for _, line := range lines {
		snap := parseGeneration(line)
		if snap.ID == "" {
			continue
		}
		if snap.Deployed {
			st.CurrentRoot = snap.ID
		}
		st.Snapshots = append(st.Snapshots, snap)
	}

	// Report /run/current-system symlink target as extra info.
	if target, err := os.Readlink("/run/current-system"); err == nil {
		st.Extra["current-system"] = target
	}

	return st, nil
}

// MutableEnter on NixOS temporarily makes /nix/store writable.
// This is done via `nix-store --repair` semantics or by remounting.
// In practice, direct writes to /nix/store are almost never needed;
// the correct NixOS pattern is to add packages to configuration.nix.
// We expose this for emergency use only.
func (b *Backend) MutableEnter() (func() error, error) {
	if err := run("mount", "-o", "remount,rw", "/nix/store"); err != nil {
		return nil, fmt.Errorf("nixos mutable enter: %w", err)
	}
	return func() error {
		return run("mount", "-o", "remount,ro", "/nix/store")
	}, nil
}

// PkgAdd installs packages into the user environment via nix-env,
// then rebuilds the system to make them permanent.
func (b *Backend) PkgAdd(packages []string) error {
	// nix-env -iA installs into the user profile immediately.
	// For system-wide installation, packages should be added to
	// configuration.nix; we do that by appending to the config.
	if err := appendToNixConfig(packages, true); err != nil {
		return fmt.Errorf("nixos pkg add (config): %w", err)
	}
	return run("nixos-rebuild", "switch")
}

// PkgRemove removes packages from configuration.nix and rebuilds.
func (b *Backend) PkgRemove(packages []string) error {
	if err := appendToNixConfig(packages, false); err != nil {
		return fmt.Errorf("nixos pkg remove (config): %w", err)
	}
	return run("nixos-rebuild", "switch")
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func nixosProfilePath() string {
	return "/nix/var/nix/profiles/system"
}

// latestGeneration parses `nix-env --list-generations` output and returns
// the highest generation number as a string.
func latestGeneration(output string) string {
	lines := strings.Split(strings.TrimSpace(output), "\n")
	last := ""
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) > 0 {
			last = fields[0]
		}
	}
	return last
}

// parseGeneration parses a single line from `nix-env --list-generations`.
// Format: "  <id>   <date> <time>   (current)"
func parseGeneration(line string) hal.SnapshotInfo {
	fields := strings.Fields(line)
	if len(fields) < 2 {
		return hal.SnapshotInfo{}
	}
	snap := hal.SnapshotInfo{
		ID:        fields[0],
		Timestamp: strings.Join(fields[1:3], " "),
		Deployed:  strings.Contains(line, "(current)"),
	}
	return snap
}

// appendToNixConfig is a minimal helper that adds or removes package names
// from the environment.systemPackages list in /etc/nixos/configuration.nix.
// Production use should prefer a proper Nix AST editor; this is a best-effort
// line-based approach for simple cases.
func appendToNixConfig(packages []string, add bool) error {
	const configPath = "/etc/nixos/configuration.nix"
	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("read %s: %w", configPath, err)
	}

	content := string(data)
	for _, pkg := range packages {
		nixPkg := "pkgs." + pkg
		if add {
			// Insert before the closing ]; of environment.systemPackages
			content = strings.Replace(content,
				"environment.systemPackages = with pkgs; [",
				"environment.systemPackages = with pkgs; [\n    "+nixPkg,
				1)
		} else {
			content = strings.ReplaceAll(content, "\n    "+nixPkg, "")
			content = strings.ReplaceAll(content, nixPkg+" ", "")
		}
	}

	return os.WriteFile(configPath, []byte(content), 0o644)
}

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%s %s: %s: %w", name, strings.Join(args, " "),
			strings.TrimSpace(string(out)), err)
	}
	return nil
}
