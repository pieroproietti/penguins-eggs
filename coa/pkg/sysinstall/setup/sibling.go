package setup

import (
	"fmt"
	"os"
	"strings"

	"coa/pkg/utils"
	"gopkg.in/yaml.v3"
)

const siblingPath = "etc/penguins-eggs.d/sibling.yaml"

type Sibling struct {
	Mode string `yaml:"mode"`
}

// Read the marker from the exact image selected for installation. Never use
// the running host's identity: an installed standard host can deploy a clone.
// Fail before starting the installer if the image or marker cannot be read.
func readSourceSibling(source string) (Sibling, error) {
	quote := func(s string) string { return "'" + strings.ReplaceAll(s, "'", "'\"'\"'") + "'" }
	data, err := utils.ExecCapture("unsquashfs -cat " + quote(source) + " " + quote(siblingPath))
	if err != nil {
		return Sibling{}, fmt.Errorf("read remaster mode from %s: %w", source, err)
	}
	return parseSibling([]byte(data))
}

func parseSibling(data []byte) (Sibling, error) {
	var s Sibling
	if err := yaml.Unmarshal(data, &s); err != nil {
		return s, fmt.Errorf("invalid source sibling marker: %w", err)
	}
	switch s.Mode {
	case "standard", "clone", "crypted":
		return s, nil
	default:
		return s, fmt.Errorf("unsupported source remaster mode %q", s.Mode)
	}
}

// Preserve cloned accounts, passwords, home directories and display-manager
// settings in both Krill and Calamares. Apply after all module overlays.
func configureSourceUsers(path string, sibling Sibling) error {
	if sibling.Mode == "standard" {
		return nil
	}
	if sibling.Mode != "clone" && sibling.Mode != "crypted" {
		return fmt.Errorf("unsupported source remaster mode %q", sibling.Mode)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	lines := strings.Split(string(data), "\n")
	filtered := make([]string, 0, len(lines))
	for _, line := range lines {
		switch strings.TrimSpace(line) {
		case "- users", "- removeuser", "- displaymanager":
			continue
		}
		filtered = append(filtered, line)
	}
	return os.WriteFile(path, []byte(strings.Join(filtered, "\n")), 0644)
}
