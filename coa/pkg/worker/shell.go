package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func RunShell(payload []byte) error {
	var config struct {
		Chroot   bool   `json:"chroot"`
		LiveRoot string `json:"live_root,omitempty"`
		Params   struct {
			Command string `json:"command"`
		} `json:"params"`
	}

	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON: %w", err)
	}

	if config.Params.Command == "" {
		return fmt.Errorf("nessun comando specificato nel parametro 'command'")
	}

	// 'set -e' blocca lo script al primo errore
	scriptContent := "set -e\n\n" + config.Params.Command

	var tmpFilePath string // Percorso fisico sull'host
	var execPath string    // Percorso logico per la shell (interno o esterno)

	// 1. Logica della directory ".oa-tools" nella home di root
	if config.Chroot {
		if config.LiveRoot == "" {
			return fmt.Errorf("chroot richiesto ma live_root mancante")
		}

		// Percorso HOST: /home/eggs/root-livefs/root/.oa-tools
		chrootWorkDir := filepath.Join(config.LiveRoot, "root", ".oa-tools")
		
		// Creiamo la directory con permessi restrittivi (solo root accede)
		os.MkdirAll(chrootWorkDir, 0700) 

		tmpFile, err := os.CreateTemp(chrootWorkDir, "shell-*.sh")
		if err != nil {
			return fmt.Errorf("impossibile creare script in %s: %w", chrootWorkDir, err)
		}
		tmpFilePath = tmpFile.Name()
		tmpFile.WriteString(scriptContent)
		tmpFile.Close()

		// Percorso CHROOT (quello che vede bash): /root/.oa-tools/shell-XXX.sh
		execPath = "/root/.oa-tools/" + filepath.Base(tmpFilePath)

	} else {
		// Esecuzione locale standard sull'host (assumiamo che oa-tools giri da root)
		hostWorkDir := "/root/.oa-tools"
		os.MkdirAll(hostWorkDir, 0700)

		tmpFile, err := os.CreateTemp(hostWorkDir, "shell-*.sh")
		if err != nil {
			return fmt.Errorf("impossibile creare script in %s: %w", hostWorkDir, err)
		}
		tmpFilePath = tmpFile.Name()
		tmpFile.WriteString(scriptContent)
		tmpFile.Close()

		execPath = tmpFilePath
	}

	// Pulizia chirurgica: rimuoviamo solo il file alla fine. 
	// La cartella .oa-tools può restare, fungerà da cache operativa.
	defer os.Remove(tmpFilePath)

	var cmd *exec.Cmd

	// 2. Rilevamento interprete ed esecuzione
	if config.Chroot {
		// Controllo salvavita: c'è bash? Altrimenti usiamo sh (per Alpine)
		shellPath := "/bin/sh"
		if _, err := os.Stat(filepath.Join(config.LiveRoot, "bin", "bash")); err == nil {
			shellPath = "/bin/bash"
		}

		fmt.Printf("📦 [worker shell] Esecuzione in chroot (via %s)...\n", shellPath)
		cmd = exec.Command("chroot", config.LiveRoot, shellPath, execPath)
	} else {
		fmt.Println("💻 [worker shell] Esecuzione locale...")
		cmd = exec.Command("bash", execPath)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// 3. Avvio
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("esecuzione shell fallita (codice %s): %w", config.Params.Command, err)
	}

	return nil
}