package repo

import (
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
)

const (
	repoUrl     = "https://penguins-eggs.net/repos"
	repoKeyUrl  = "https://penguins-eggs.net/repos/KEY.asc"
	repoKeyPath = "/usr/share/keyrings/penguins-repos.gpg"
	repoList    = "/etc/apt/sources.list.d/penguins-repos.list"
	repoSources = "/etc/apt/sources.list.d/penguins-repos.sources"
)

func isDeb822() bool {
	if _, err := os.Stat("/etc/apt/sources.list.d/ubuntu.sources"); err == nil {
		return true
	}
	if _, err := os.Stat("/etc/apt/sources.list.d/debian.sources"); err == nil {
		return true
	}
	return false
}

func addDebian() error {
	utils.LogNormal("Configuring penguins-eggs repository for Debian/Ubuntu...")

	if os.Geteuid() != 0 {
		return fmt.Errorf("this command requires root privileges (use sudo)")
	}
	cmdStr := fmt.Sprintf("curl -fsSL %s | gpg --dearmor > %s", repoKeyUrl, repoKeyPath)
	cmd := exec.Command("bash", "-c", cmdStr)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("unable to import GPG key: %w", err)
	}

	if isDeb822() {
		utils.LogNormal("[INFO] DEB822 format detected. Generating .sources file...")

		content := fmt.Sprintf("Types: deb\nURIs: %s/deb\nSuites: stable\nComponents: main\nSigned-By: %s\n", repoUrl, repoKeyPath)

		if err := os.WriteFile(repoSources, []byte(content), 0644); err != nil {
			return fmt.Errorf("unable to write file %s: %w", repoSources, err)
		}
	} else {
		utils.LogNormal("[INFO] Classic format detected. Generating .list file...")

		content := fmt.Sprintf("deb [signed-by=%s] %s/deb stable main\n", repoKeyPath, repoUrl)

		if err := os.WriteFile(repoList, []byte(content), 0644); err != nil {
			return fmt.Errorf("unable to write file %s: %w", repoList, err)
		}
	}

	utils.LogSuccess("✅ Repository added successfully. Run 'apt update'.")
	return nil
}

func removeDebian() error {
	utils.LogNormal("Removing penguins-eggs repository...")

	if os.Geteuid() != 0 {
		return fmt.Errorf("this command requires root privileges (use sudo)")
	}
	os.Remove(repoKeyPath)
	os.Remove(repoList)
	os.Remove(repoSources)

	utils.LogNormal("🗑️ Repository removed successfully. Run 'apt update'.")
	return nil
}
