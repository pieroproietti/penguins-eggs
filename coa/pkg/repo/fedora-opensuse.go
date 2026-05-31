package repo

import (
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

// AddFedoraEl supporta Fedora e EL9 (Alma/Rocky)
func addFedoraEl(isEl9 bool) error {
	fmt.Println("Configurazione repository RPM (Fedora/EL9)...")
	if os.Geteuid() != 0 {
		return fmt.Errorf("richiesti privilegi di root")
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

	fmt.Println("✅ Repository aggiunto. Esegui 'dnf check-update'.")
	return nil
}

// AddSuse usa i parametri specifici per zypper
func addSuse() error {
	fmt.Println("Configurazione repository openSUSE...")
	if os.Geteuid() != 0 {
		return fmt.Errorf("richiesti privilegi di root")
	}

	repoContent := fmt.Sprintf("[penguins-eggs]\nname=penguins-eggs.net repos\nbaseurl=%s\nenabled=1\ngpgcheck=1\nrepo_gpgcheck=0\ngpgkey=%s\nautorefresh=1\n", opensuseRepoUrl, rpmKeyUrl)

	if err := os.WriteFile(suseRepoFilePath, []byte(repoContent), 0644); err != nil {
		return err
	}

	exec.Command("rpm", "--import", rpmKeyUrl).Run()

	fmt.Println("✅ Repository aggiunto. Esegui 'zypper refresh'.")
	return nil
}

// RemoveRpm gestisce la rimozione per Fedora, EL9 E openSUSE (rimuovendo la chiave GPG dinamicamente)
func removeRpm(isSuse bool) error {
	fmt.Println("Rimozione repository RPM...")
	if os.Geteuid() != 0 {
		return fmt.Errorf("richiesti privilegi di root")
	}

	repoPath := fedoraRepoFilePath
	if isSuse {
		repoPath = suseRepoFilePath
	}

	os.Remove(repoPath)

	// Trova ed elimina la chiave (il tuo trucco geniale in TS -> Go)
	cmdStr := fmt.Sprintf("rpm -q gpg-pubkey --qf '%%{name}-%%{version}-%%{release} %%{summary}\n' | grep '%s' | cut -d' ' -f1", rpmKeyOwner)
	out, err := exec.Command("bash", "-c", cmdStr).Output()

	if err == nil && len(out) > 0 {
		keys := strings.Split(strings.TrimSpace(string(out)), "\n")
		for _, k := range keys {
			if k != "" {
				fmt.Printf("Rimozione chiave GPG %s...\n", k)
				exec.Command("rpm", "-e", k).Run()
			}
		}
	} else {
		fmt.Println("[INFO] Nessuna chiave GPG da rimuovere.")
	}

	fmt.Println("🗑️ Repository rimosso con successo.")
	return nil
}
