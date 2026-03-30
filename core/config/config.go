// Package config loads and validates pif.toml, and provides per-backend
// config maps that backends receive during Init().
package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
	"github.com/penguins-immutable-framework/core/hooks"
)

// searchPaths lists locations checked in order for pif.toml.
var searchPaths = []string{
	"$HOME/.config/pif/pif.toml",
	"/etc/pif/pif.toml",
	"/usr/share/pif/pif.toml",
	"pif.toml", // cwd, for development
}

// PIF is the top-level configuration structure.
type PIF struct {
	PIF        Core                      `toml:"pif"`
	Backend    map[string]map[string]any `toml:"backend"`
	Bootloader Bootloader                `toml:"bootloader"`
	Distro     DistroOverride            `toml:"distro"`
	Hooks      hooks.Config              `toml:"hooks"`
}

// HooksRunner constructs a hooks.Runner from the [hooks] config section.
// Returns a Runner with default config when the [hooks] section is absent.
func (c *PIF) HooksRunner() *hooks.Runner {
	cfg := c.Hooks
	// Apply defaults for any zero values (e.g. when [hooks] is absent from pif.toml)
	def := hooks.DefaultConfig()
	if cfg.EggsBin == "" {
		cfg.EggsBin = def.EggsBin
	}
	if cfg.RecoveryBin == "" {
		cfg.RecoveryBin = def.RecoveryBin
	}
	return hooks.New(cfg)
}

// Core holds the [pif] section.
type Core struct {
	Distro          string `toml:"distro"`
	Arch            string `toml:"arch"`
	Backend         string `toml:"backend"`
	MaxSnapshots    int    `toml:"max_snapshots"`
	AutoUpdate      bool   `toml:"auto_update"`
	PreUpgradeHook  string `toml:"pre_upgrade_hook"`
	PostUpgradeHook string `toml:"post_upgrade_hook"`
}

// Bootloader holds the [bootloader] section.
type Bootloader struct {
	Type    string `toml:"type"`
	GrubCfg string `toml:"grub_cfg"`
	EFIDir  string `toml:"efi_dir"`
}

// DistroOverride holds the [distro] section.
type DistroOverride struct {
	PkgManager string   `toml:"pkg_manager"`
	ExtraRepos []string `toml:"extra_repos"`
}

// Load finds and parses the first pif.toml found in searchPaths.
func Load() (*PIF, error) {
	for _, p := range searchPaths {
		expanded := os.ExpandEnv(p)
		if _, err := os.Stat(expanded); err == nil {
			return loadFile(expanded)
		}
	}
	return nil, fmt.Errorf("config: no pif.toml found (searched: %v)", searchPaths)
}

// LoadFile parses a specific config file.
func LoadFile(path string) (*PIF, error) {
	return loadFile(path)
}

func loadFile(path string) (*PIF, error) {
	abs, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	var cfg PIF
	if _, err := toml.DecodeFile(abs, &cfg); err != nil {
		return nil, fmt.Errorf("config: parse %s: %w", abs, err)
	}
	if err := validate(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func validate(cfg *PIF) error {
	if cfg.PIF.Backend == "" {
		return fmt.Errorf("config: [pif].backend must be set")
	}
	if cfg.PIF.Distro == "" {
		return fmt.Errorf("config: [pif].distro must be set")
	}
	if cfg.PIF.Arch == "" {
		cfg.PIF.Arch = detectArch()
	}
	if cfg.PIF.MaxSnapshots == 0 {
		cfg.PIF.MaxSnapshots = 10
	}
	return nil
}

// BackendConfig returns the [backend.<name>] section as a flat string map,
// suitable for passing to Backend.Init().
func (c *PIF) BackendConfig(name string) map[string]string {
	raw, ok := c.Backend[name]
	if !ok {
		return map[string]string{}
	}
	out := make(map[string]string, len(raw))
	for k, v := range raw {
		out[k] = fmt.Sprintf("%v", v)
	}
	return out
}

func detectArch() string {
	// uname -m equivalent via runtime
	switch {
	case isFile("/proc/device-tree/compatible"):
		return "aarch64"
	default:
		return "x86_64"
	}
}

func isFile(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}
