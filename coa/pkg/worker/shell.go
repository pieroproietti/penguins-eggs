// worker/shell.go
package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// ShellConfig è la struttura unificata per script e shell
type ShellConfig struct {
	Chroot   bool   `json:"chroot"`
	LiveRoot string `json:"live_root,omitempty"`
	Params   struct {
		Command string   `json:"command,omitempty"`
		Src     string   `json:"src,omitempty"`
		Args    []string `json:"args,omitempty"`
	} `json:"params"`
}

// RunShell gestisce i comandi "inline" (stringhe dirette dallo YAML)
func RunShell(payload []byte) error {
	var config ShellConfig
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo shell: %w", err)
	}

	if config.Params.Command == "" {
		return fmt.Errorf("nessun comando specificato nel parametro 'command'")
	}

	// 'set -e' blocca lo script al primo errore
	scriptContent := []byte("set -e\n\n" + config.Params.Command)

	return executeUnifiedShell(config, scriptContent)
}

// executeUnifiedShell è il cuore operativo (privato) condiviso da shell e script
func executeUnifiedShell(config ShellConfig, scriptContent []byte) error {
	var tmpFilePath string // Percorso fisico sull'host
	var execPath string    // Percorso logico per la shell (interno o esterno)

	// 1. Logica della directory unificata ".oa-tools"
	if config.Chroot {
		if config.LiveRoot == "" {
			return fmt.Errorf("chroot richiesto ma live_root mancante")
		}

		// Percorso HOST: /.../live_root/root/.oa-tools
		chrootWorkDir := filepath.Join(config.LiveRoot, "root", ".oa-tools")
		
		// Creiamo la directory con permessi restrittivi
		os.MkdirAll(chrootWorkDir, 0700) 

		tmpFile, err := os.CreateTemp(chrootWorkDir, "oa-exec-*.sh")
		if err != nil {
			return fmt.Errorf("impossibile creare script in %s: %w", chrootWorkDir, err)
		}
		tmpFilePath = tmpFile.Name()
		tmpFile.Write(scriptContent)
		tmpFile.Close()

		// Percorso CHROOT (quello che vede bash)
		execPath = "/root/.oa-tools/" + filepath.Base(tmpFilePath)

	} else {
		// Esecuzione locale standard sull'host
		hostWorkDir := "/root/.oa-tools"
		os.MkdirAll(hostWorkDir, 0700)

		tmpFile, err := os.CreateTemp(hostWorkDir, "oa-exec-*.sh")
		if err != nil {
			return fmt.Errorf("impossibile creare script in %s: %w", hostWorkDir, err)
		}
		tmpFilePath = tmpFile.Name()
		tmpFile.Write(scriptContent)
		tmpFile.Close()

		execPath = tmpFilePath
	}

	// Rendiamo il file sempre eseguibile
	os.Chmod(tmpFilePath, 0755)

	// Pulizia chirurgica garantita a fine esecuzione
	defer os.Remove(tmpFilePath)

	var cmd *exec.Cmd

	// 2. Rilevamento interprete ed esecuzione
	if config.Chroot {
		shellPath := "/bin/sh"
		if _, err := os.Stat(filepath.Join(config.LiveRoot, "bin", "bash")); err == nil {
			shellPath = "/bin/bash"
		}

		fmt.Printf("📦 [worker core] Esecuzione in chroot (via %s)...\n", shellPath)
		
		// Costruiamo gli argomenti: chroot <root> /bin/bash /root/.oa-tools/file.sh [args...]
		args := []string{config.LiveRoot, shellPath, execPath}
		if len(config.Params.Args) > 0 {
			args = append(args, config.Params.Args...)
		}
		cmd = exec.Command("chroot", args...)
	} else {
		fmt.Println("💻 [worker core] Esecuzione locale...")
		
		// Costruiamo gli argomenti: bash /root/.oa-tools/file.sh [args...]
		args := []string{execPath}
		if len(config.Params.Args) > 0 {
			args = append(args, config.Params.Args...)
		}
		cmd = exec.Command("bash", args...)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// 3. Avvio
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("esecuzione fallita: %w", err)
	}

	return nil
}
