package tailor

import (
	"fmt"
	"os"
	"os/user"
	"path/filepath"
)

func getWardrobeRoot() (string, error) {
	var homeDir string

	sudoUser := os.Getenv("SUDO_USER")
	if sudoUser != "" {
		u, err := user.Lookup(sudoUser)
		if err == nil {
			homeDir = u.HomeDir
		}
	}

	if homeDir == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("unable to determine home directory: %v", err)
		}
		homeDir = home
	}

	return filepath.Join(homeDir, ".oa-wardrobe"), nil
}
