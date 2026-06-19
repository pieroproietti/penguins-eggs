package repo

import (
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

const (
	archBaseUrl         = "https://penguins-eggs.net/repos"
	archKeyId           = "F6773EA7D2F309BA3E5DE08A45B10F271525403F"
	pacmanConfPath      = "/etc/pacman.conf"
	repoBlockIdentifier = "# penguins-repos"
	repoNameBlock       = "[penguins-eggs]"
)

func addArch(isManjaro bool) error {
	distroName := "Arch"
	serverUrl := archBaseUrl + "/arch"
	if isManjaro {
		distroName = "Manjaro"
		serverUrl = archBaseUrl + "/manjaro"
	}
	utils.LogNormal("Configuring penguins-eggs repository for %s...\n", distroName)

	if os.Geteuid() != 0 {
		return fmt.Errorf("root privileges required (sudo)")
	}

	content, _ := os.ReadFile(pacmanConfPath)
	if strings.Contains(string(content), repoNameBlock) {
		utils.LogNormal("[INFO] Repository %s already exists in %s\n", repoNameBlock, pacmanConfPath)
		return nil
	}

	utils.LogNormal("Importing GPG key: %s...\n", archKeyId)
	exec.Command("pacman-key", "--recv-key", archKeyId, "--keyserver", "keyserver.ubuntu.com").Run()
	exec.Command("pacman-key", "--lsign-key", archKeyId).Run()

	repoBlock := fmt.Sprintf("\n%s\n%s\nSigLevel = Optional TrustAll\nServer = %s\n", repoBlockIdentifier, repoNameBlock, serverUrl)

	f, err := os.OpenFile(pacmanConfPath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	f.WriteString(repoBlock)

	utils.LogSuccess("✅ Repository added successfully!")
	if isManjaro {
		utils.LogNormal("Run 'sudo pamac update --force-refresh'")
	} else {
		utils.LogNormal("Run 'sudo pacman -Syyu'")
	}
	return nil
}

func removeArch(isManjaro bool) error {
	utils.LogNormal("Removing Arch/Manjaro repository...")
	if os.Geteuid() != 0 {
		return fmt.Errorf("root privileges required (sudo)")
	}

	serverUrl := archBaseUrl + "/arch"
	if isManjaro {
		serverUrl = archBaseUrl + "/manjaro"
	}

	content, _ := os.ReadFile(pacmanConfPath)
	strContent := string(content)

	if strings.Contains(strContent, repoNameBlock) {
		repoBlock := fmt.Sprintf("\n%s\n%s\nSigLevel = Optional TrustAll\nServer = %s\n", repoBlockIdentifier, repoNameBlock, serverUrl)
		strContent = strings.ReplaceAll(strContent, repoBlock, "")

			repoBlockNoNL := fmt.Sprintf("%s\n%s\nSigLevel = Optional TrustAll\nServer = %s\n", repoBlockIdentifier, repoNameBlock, serverUrl)
		strContent = strings.ReplaceAll(strContent, repoBlockNoNL, "")

		os.WriteFile(pacmanConfPath, []byte(strings.TrimSpace(strContent)+"\n"), 0644)
		utils.LogNormal("🗑️ Repository removed from pacman.conf.")
	}

	return nil
}
