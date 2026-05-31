package repo

import (
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

// isDeb822 verifica se il sistema utilizza il nuovo formato DEB822
func isDeb822() bool {
	// Controlla nativamente l'esistenza dei file senza invocare shell esterne
	if _, err := os.Stat("/etc/apt/sources.list.d/ubuntu.sources"); err == nil {
		return true
	}
	if _, err := os.Stat("/etc/apt/sources.list.d/debian.sources"); err == nil {
		return true
	}
	return false
}

// AddDebian configura la repository su Debian/Ubuntu
func addDebian() error {
	fmt.Println("Configurazione repository penguins-eggs per Debian/Ubuntu...")

	if os.Geteuid() != 0 {
		return fmt.Errorf("questo comando richiede i privilegi di root (usa sudo)")
	}

	// 1. Scarica e dearmora la chiave GPG
	cmdStr := fmt.Sprintf("curl -fsSL %s | gpg --dearmor > %s", repoKeyUrl, repoKeyPath)
	cmd := exec.Command("bash", "-c", cmdStr)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("impossibile importare la chiave GPG: %w", err)
	}

	// 2. Routing del formato: DEB822 o Classico
	if isDeb822() {
		fmt.Println("[INFO] Rilevato formato DEB822. Generazione file .sources...")

		content := fmt.Sprintf("Types: deb\nURIs: %s/deb\nSuites: stable\nComponents: main\nSigned-By: %s\n", repoUrl, repoKeyPath)

		if err := os.WriteFile(repoSources, []byte(content), 0644); err != nil {
			return fmt.Errorf("impossibile scrivere il file %s: %w", repoSources, err)
		}
	} else {
		fmt.Println("[INFO] Rilevato formato classico. Generazione file .list...")

		content := fmt.Sprintf("deb [signed-by=%s] %s/deb stable main\n", repoKeyPath, repoUrl)

		if err := os.WriteFile(repoList, []byte(content), 0644); err != nil {
			return fmt.Errorf("impossibile scrivere il file %s: %w", repoList, err)
		}
	}

	fmt.Println("✅ Repository aggiunta con successo. Esegui 'apt update'.")
	return nil
}

// RemoveDebian elimina la repository dal sistema
func removeDebian() error {
	fmt.Println("Rimozione repository penguins-eggs...")

	if os.Geteuid() != 0 {
		return fmt.Errorf("questo comando richiede i privilegi di root (usa sudo)")
	}

	// Ignoriamo eventuali errori se uno dei file non esiste (es. pulizia sicura)
	os.Remove(repoKeyPath)
	os.Remove(repoList)
	os.Remove(repoSources) // Puliamo anche il .sources per sicurezza

	fmt.Println("🗑️ Repository rimossa con successo. Esegui 'apt update'.")
	return nil
}
