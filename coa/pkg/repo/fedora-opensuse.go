package repo

import (
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

const (
	rpmKeyUrl          = "https://penguins-eggs.net/repos/KEY.asc"
	rpmKeyOwner        = "piero.proietti@gmail.com"
	fedoraRepoFilePath = "/etc/yum.repos.d/penguins-eggs.repo"
	suseRepoFilePath   = "/etc/zypp/repos.d/penguins-eggs.repo"
	rpmRepoFedoraUrl   = "https://penguins-eggs.net/repos/rpm/fedora/42"
	rpmRepoEl9Url      = "https://penguins-eggs.net/repos/rpm/el9"
	opensuseRepoUrl    = "https://penguins-eggs.net/repos/rpm/opensuse/leap"
)

func addFedoraEl(isEl9 bool) error {
	utils.LogNormal("Configuring RPM repository (Fedora/EL9)...")
	if os.Geteuid() != 0 {
		return fmt.Errorf("root privileges required")
	}

	repoUrl := rpmRepoFedoraUrl
	if isEl9 {
		repoUrl = rpmRepoEl9Url
	}

	repoContent := fmt.Sprintf("[penguins-eggs]\nname=penguins-eggs.net repos\nbaseurl=%s\nenabled=1\ngpgcheck=1\ngpgkey=%s\n", repoUrl, rpmKeyUrl)

	if err := os.WriteFile(fedoraRepoFilePath, []byte(repoContent), 0644); err != nil {
		return err
	}

	exec.Command("rpm", "--import", rpmKeyUrl).Run()
	exec.Command("dnf", "clean", "metadata").Run()

	utils.LogSuccess("✅ Repository added. Run 'dnf check-update'.")
	return nil
}

func addSuse() error {
	utils.LogNormal("Configuring openSUSE repository...")
	if os.Geteuid() != 0 {
		return fmt.Errorf("root privileges required")
	}

	repoContent := fmt.Sprintf("[penguins-eggs]\nname=penguins-eggs.net repos\nbaseurl=%s\nenabled=1\ngpgcheck=1\nrepo_gpgcheck=0\ngpgkey=%s\nautorefresh=1\n", opensuseRepoUrl, rpmKeyUrl)

	if err := os.WriteFile(suseRepoFilePath, []byte(repoContent), 0644); err != nil {
		return err
	}

	exec.Command("rpm", "--import", rpmKeyUrl).Run()

	utils.LogSuccess("✅ Repository added. Run 'zypper refresh'.")
	return nil
}

func removeRpm(isSuse bool) error {
	utils.LogNormal("Removing RPM repository...")
	if os.Geteuid() != 0 {
		return fmt.Errorf("root privileges required")
	}

	repoPath := fedoraRepoFilePath
	if isSuse {
		repoPath = suseRepoFilePath
	}

	os.Remove(repoPath)

	cmdStr := fmt.Sprintf("rpm -q gpg-pubkey --qf '%%{name}-%%{version}-%%{release} %%{summary}\n' | grep '%s' | cut -d' ' -f1", rpmKeyOwner)
	out, err := exec.Command("bash", "-c", cmdStr).Output()

	if err == nil && len(out) > 0 {
		keys := strings.Split(strings.TrimSpace(string(out)), "\n")
		for _, k := range keys {
			if k != "" {
				utils.LogNormal("Removing GPG key %s...", k)
				exec.Command("rpm", "-e", k).Run()
			}
		}
	} else {
		utils.LogNormal("[INFO] No GPG keys to remove.")
	}

	utils.LogNormal("🗑️ Repository removed successfully.")
	return nil
}
