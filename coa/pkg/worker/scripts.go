// worker/script.go
package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// RunScript esegue uno script bash leggendolo da un file sull'host.
// Se in chroot, copia temporaneamente lo script al suo interno prima di eseguirlo.
func RunScript(payload []byte) error {
	// 1. Definiamo la struttura locale
	var config struct {
		Chroot             bool   `json:"chroot"`
		ResolvedTargetRoot string `json:"resolved_target_root"`
		Params             struct {
			Src  string   `json:"src"`  // Il percorso del file sull'host (es. "scripts/setup.sh")
			Args []string `json:"args"` // Argomenti opzionali da passare allo script
		} `json:"params"`
	}

	// 2. Apriamo la busta
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo script: %w", err)
	}

	src := config.Params.Src
	if src == "" {
		return fmt.Errorf("modulo script: parametro 'src' mancante")
	}

	// 3. Leggiamo il file sorgente dal sistema HOST
	scriptContent, err := os.ReadFile(src)
	if err != nil {
		return fmt.Errorf("impossibile leggere lo script sorgente '%s': %w", src, err)
	}

	var tmpFilePath string // Percorso sul sistema host (per la pulizia)
	var execPath string    // Percorso usato da bash

	// 4. Logica di iniezione (Host vs Chroot)
	if config.Chroot {
		if config.ResolvedTargetRoot == "" {
			return fmt.Errorf("chroot richiesto ma resolved_target_root mancante")
		}

		// Creiamo /tmp nel chroot se non esiste
		chrootTmpDir := filepath.Join(config.ResolvedTargetRoot, "tmp")
		os.MkdirAll(chrootTmpDir, 1777)

		// Creiamo il file dentro il chroot
		tmpFile, err := os.CreateTemp(chrootTmpDir, "oa-script-*.sh")
		if err != nil {
			return fmt.Errorf("impossibile creare script temporaneo nel chroot: %w", err)
		}
		tmpFilePath = tmpFile.Name()

		// Scriviamo il contenuto e chiudiamo
		if _, err := tmpFile.Write(scriptContent); err != nil {
			tmpFile.Close()
			return fmt.Errorf("errore scrittura file temporaneo: %w", err)
		}
		tmpFile.Close()

		// Rendiamolo eseguibile
		os.Chmod(tmpFilePath, 0755)

		// Il percorso per la gabbia chroot
		execPath = "/tmp/" + filepath.Base(tmpFilePath)
	} else {
		// Esecuzione locale standard. Bash può leggere il file originale.
		// Non creiamo file temporanei, usiamo direttamente il sorgente.
		execPath = src
		tmpFilePath = ""
	}

	// 5. Garantiamo la pulizia del file temporaneo (se è stato creato)
	if tmpFilePath != "" {
		defer os.Remove(tmpFilePath)
	}

	// 6. Preparazione del comando
	var cmd *exec.Cmd
	if config.Chroot {
		fmt.Printf("📦 [worker] Iniezione ed esecuzione script '%s' in chroot...\n", src)
		// Costruiamo gli argomenti: chroot <root> /bin/bash /tmp/script.sh [args...]
		args := []string{config.ResolvedTargetRoot, "/bin/bash", execPath}
		if len(config.Params.Args) > 0 {
			args = append(args, config.Params.Args...)
		}
		cmd = exec.Command("chroot", args...)
	} else {
		fmt.Printf("💻 [worker] Esecuzione script locale '%s'...\n", src)
		// Costruiamo gli argomenti: bash ./script.sh [args...]
		args := []string{execPath}
		if len(config.Params.Args) > 0 {
			args = append(args, config.Params.Args...)
		}
		cmd = exec.Command("bash", args...)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// 7. Esecuzione
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("esecuzione script fallita: %w", err)
	}

	return nil
}
