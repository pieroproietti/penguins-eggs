// Package config loads and validates ilf.toml, and provides per-backend
// config maps that backends receive during Init().
package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

// searchPaths lists locations checked in order for ilf.toml.
var searchPaths = []string{
	"$HOME/.config/ilf/ilf.toml",
	"/etc/ilf/ilf.toml",
	"/usr/share/ilf/ilf.toml",
	"ilf.toml", // cwd, for development
}

// ILF is the top-level configuration structure.
type ILF struct {
	ILF        Core                      `toml:"ilf"`
	Backend    map[string]map[string]any `toml:"backend"`
	Bootloader Bootloader                `toml:"bootloader"`
	Distro     DistroOverride            `toml:"distro"`
}

// Core holds the [ilf] section.
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

// Load finds and parses the first ilf.toml found in searchPaths.
func Load() (*ILF, error) {
	for _, p := range searchPaths {
		expanded := os.ExpandEnv(p)
		if _, err := os.Stat(expanded); err == nil {
			return loadFile(expanded)
		}
	}
	return nil, fmt.Errorf("config: no ilf.toml found (searched: %v)", searchPaths)
}

// LoadFile parses a specific config file.
func LoadFile(path string) (*ILF, error) {
	return loadFile(path)
}

func loadFile(path string) (*ILF, error) {
	abs, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	var cfg ILF
	if _, err := toml.DecodeFile(abs, &cfg); err != nil {
		return nil, fmt.Errorf("config: parse %s: %w", abs, err)
	}
	if err := validate(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func validate(cfg *ILF) error {
	if cfg.ILF.Backend == "" {
		return fmt.Errorf("config: [ilf].backend must be set")
	}
	if cfg.ILF.Distro == "" {
		return fmt.Errorf("config: [ilf].distro must be set")
	}
	if cfg.ILF.Arch == "" {
		cfg.ILF.Arch = detectArch()
	}
	if cfg.ILF.MaxSnapshots == 0 {
		cfg.ILF.MaxSnapshots = 10
	}
	return nil
}

// BackendConfig returns the [backend.<name>] section as a flat string map,
// suitable for passing to Backend.Init().
func (c *ILF) BackendConfig(name string) map[string]string {
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
