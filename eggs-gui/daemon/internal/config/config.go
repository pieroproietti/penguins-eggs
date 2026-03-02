package config

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

const (
	EggsConfDir  = "/etc/penguins-eggs.d"
	EggsYAMLFile = "eggs.yaml"
	ToolsYAMLFile = "tools.yaml"
)

// EggsConfig represents the eggs.yaml configuration file.
type EggsConfig struct {
	Compression      string `yaml:"compression" json:"compression"`
	ForceInstaller   bool   `yaml:"force_installer" json:"force_installer"`
	InitrdImg        string `yaml:"initrd_img" json:"initrd_img"`
	MachineID        string `yaml:"machine_id" json:"machine_id"`
	MakeEfi          bool   `yaml:"make_efi" json:"make_efi"`
	MakeIsohybrid    bool   `yaml:"make_isohybrid" json:"make_isohybrid"`
	MakeMd5sum       bool   `yaml:"make_md5sum" json:"make_md5sum"`
	PmountFixed      bool   `yaml:"pmount_fixed" json:"pmount_fixed"`
	RootPasswd       string `yaml:"root_passwd" json:"root_passwd"`
	SnapshotBasename string `yaml:"snapshot_basename" json:"snapshot_basename"`
	SnapshotDir      string `yaml:"snapshot_dir" json:"snapshot_dir"`
	SnapshotExcludes string `yaml:"snapshot_excludes" json:"snapshot_excludes"`
	SnapshotMnt      string `yaml:"snapshot_mnt" json:"snapshot_mnt"`
	SnapshotPrefix   string `yaml:"snapshot_prefix" json:"snapshot_prefix"`
	SSHPass          bool   `yaml:"ssh_pass" json:"ssh_pass"`
	Theme            string `yaml:"theme" json:"theme"`
	Timezone         string `yaml:"timezone" json:"timezone"`
	UserOpt          string `yaml:"user_opt" json:"user_opt"`
	UserOptPasswd    string `yaml:"user_opt_passwd" json:"user_opt_passwd"`
	Version          string `yaml:"version" json:"version"`
	Vmlinuz          string `yaml:"vmlinuz" json:"vmlinuz"`
}

// ToolsConfig represents the tools.yaml configuration file.
type ToolsConfig struct {
	PenguinsEggsConf string `yaml:"penguins_eggs_conf" json:"penguins_eggs_conf"`
	RemoteHost       string `yaml:"remoteHost" json:"remoteHost"`
	RemotePathDeb    string `yaml:"remotePathDeb" json:"remotePathDeb"`
	RemotePathDoc    string `yaml:"remotePathDoc" json:"remotePathDoc"`
	RemotePathIso    string `yaml:"remotePathIso" json:"remotePathIso"`
	RemoteUser       string `yaml:"remoteUser" json:"remoteUser"`
	LocalPathDeb     string `yaml:"localPathDeb" json:"localPathDeb"`
	LocalPathDoc     string `yaml:"localPathDoc" json:"localPathDoc"`
	LocalPathIso     string `yaml:"localPathIso" json:"localPathIso"`
	FilterDeb        string `yaml:"filterDeb" json:"filterDeb"`
}

// ReadEggsConfig reads and parses the eggs.yaml file.
func ReadEggsConfig() (*EggsConfig, error) {
	path := filepath.Join(EggsConfDir, EggsYAMLFile)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading %s: %w", path, err)
	}

	var cfg EggsConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing %s: %w", path, err)
	}
	return &cfg, nil
}

// WriteEggsConfig writes the eggs.yaml file via a temp file + sudo mv.
// Returns the command that needs to be run with sudo to install the file.
func WriteEggsConfig(cfg *EggsConfig) (tmpPath string, err error) {
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return "", fmt.Errorf("marshaling config: %w", err)
	}

	tmpPath = filepath.Join(os.TempDir(), "eggs-gui-eggs.yaml")
	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		return "", fmt.Errorf("writing temp file: %w", err)
	}
	return tmpPath, nil
}

// ReadToolsConfig reads and parses the tools.yaml file.
func ReadToolsConfig() (*ToolsConfig, error) {
	path := filepath.Join(EggsConfDir, ToolsYAMLFile)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading %s: %w", path, err)
	}

	var cfg ToolsConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing %s: %w", path, err)
	}
	return &cfg, nil
}

// ConfExists checks if the penguins-eggs config directory exists.
func ConfExists() bool {
	_, err := os.Stat(EggsConfDir)
	return err == nil
}

// EggsYAMLExists checks if eggs.yaml exists.
func EggsYAMLExists() bool {
	_, err := os.Stat(filepath.Join(EggsConfDir, EggsYAMLFile))
	return err == nil
}
