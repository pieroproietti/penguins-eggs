package repo

import (
	"coa/pkg/utils"

	"fmt"
	"os"
	"os/exec"
	"strings"
)

const (
	alpineRepoUrl  = "https://penguins-eggs.net/repos/alpine/"
	alpineKeyName  = "piero.proietti@gmail.com-662b958c"
	alpineKeyUrl   = "https://penguins-eggs.net/repos/alpine/" + alpineKeyName + ".rsa.pub"
	alpineKeyPath  = "/etc/apk/keys/" + alpineKeyName + ".rsa.pub"
	alpineRepoFile = "/etc/apk/repositories"
)

func addAlpine() error {
	utils.LogNormal("Configurazione repository penguins-eggs per Alpine...")

	if os.Geteuid() != 0 {
		return fmt.Errorf("richiesti privilegi di root (sudo)")
	}

	// 1. Chiave
	if _, err := os.Stat(alpineKeyPath); os.IsNotExist(err) {
		cmdStr := fmt.Sprintf("curl -fsSL %s -o %s", alpineKeyUrl, alpineKeyPath)
		if err := exec.Command("bash", "-c", cmdStr).Run(); err != nil {
			return fmt.Errorf("errore download chiave: %w", err)
		}
	} else {
		utils.LogNormal("[INFO] Chiave già esistente.")
	}

	// 2. Repo
	content, _ := os.ReadFile(alpineRepoFile)
	if strings.Contains(string(content), alpineRepoUrl) {
		utils.LogNormal("[INFO] La linea del repository è già in /etc/apk/repositories.")
	} else {
		f, err := os.OpenFile(alpineRepoFile, os.O_APPEND|os.O_WRONLY, 0644)
		if err != nil {
			return err
		}
		defer f.Close()
		f.WriteString("\n" + alpineRepoUrl + "\n")
		utils.LogSuccess("✅ Repository aggiunto.")
	}

	utils.LogNormal("Esegui 'apk update' per aggiornare i repository.")
	return nil
}

func removeAlpine() error {
	utils.LogNormal("Rimozione repository Alpine...")

	if os.Geteuid() != 0 {
		return fmt.Errorf("richiesti privilegi di root (sudo)")
	}

	os.Remove(alpineKeyPath)

	content, err := os.ReadFile(alpineRepoFile)
	if err == nil {
		lines := strings.Split(string(content), "\n")
		var newLines []string
		for _, line := range lines {
			if strings.TrimSpace(line) != alpineRepoUrl && strings.TrimSpace(line) != "" {
				newLines = append(newLines, line)
			}
		}
		os.WriteFile(alpineRepoFile, []byte(strings.Join(newLines, "\n")+"\n"), 0644)
	}

	utils.LogNormal("🗑️ Repository e chiave rimossi. Esegui 'apk update'.")
	return nil
}
