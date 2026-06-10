package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func RunShell(payload []byte) error {
	// 1. Definiamo la struttura che mappa il JSON inviato dal C
	var config struct {
		Chroot             bool   `json:"chroot"`
		LiveRoot string `json:"live_root,omitempty"`
		Params             struct {
			Command string `json:"command"`
		} `json:"params"`
	}

	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON: %w", err)
	}

	scriptContent := config.Params.Command
	if scriptContent == "" {
		return fmt.Errorf("nessun comando specificato nel parametro 'command'")
	}

	var tmpFilePath string // Il percorso reale del file sul sistema host
	var execPath string    // Il percorso che bash userà per leggerlo (diverso se in chroot)

	// 2. Logica di creazione del file temporaneo (Host vs Chroot)
	if config.Chroot {
		if config.LiveRoot == "" {
			return fmt.Errorf("chroot richiesto ma live_root mancante")
		}

		// Se siamo in chroot, il file DEVE esistere fisicamente all'interno del chroot
		// Usiamo la cartella /tmp del liveroot
		chrootTmpDir := filepath.Join(config.LiveRoot, "tmp")
		os.MkdirAll(chrootTmpDir, 1777) // Assicuriamoci che /tmp esista nel chroot

		tmpFile, err := os.CreateTemp(chrootTmpDir, "oa-shell-*.sh")
		if err != nil {
			return fmt.Errorf("impossibile creare script temporaneo nel chroot: %w", err)
		}
		tmpFilePath = tmpFile.Name()
		tmpFile.WriteString(scriptContent)
		tmpFile.Close()

		// Il percorso che il bash chrootato vedrà sarà /tmp/nomefile.sh
		execPath = "/tmp/" + filepath.Base(tmpFilePath)
	} else {
		// Esecuzione locale standard
		tmpFile, err := os.CreateTemp("", "oa-shell-*.sh")
		if err != nil {
			return fmt.Errorf("impossibile creare script temporaneo locale: %w", err)
		}
		tmpFilePath = tmpFile.Name()
		tmpFile.WriteString(scriptContent)
		tmpFile.Close()

		execPath = tmpFilePath // Host e bash vedono lo stesso percorso
	}

	// 3. Assicuriamoci di pulire il file alla fine dell'esecuzione
	defer os.Remove(tmpFilePath)

	// Rendiamo il file eseguibile
	os.Chmod(tmpFilePath, 0755)

	// 4. Esecuzione del comando
	var cmd *exec.Cmd
	if config.Chroot {
		fmt.Printf("📦 Esecuzione script in chroot (%s)...\n", config.LiveRoot)
		// Eseguiamo chroot passando il percorso "interno" dello script
		cmd = exec.Command("chroot", config.LiveRoot, execPath)
	} else {
		fmt.Println("💻 Esecuzione script shell locale...")
		cmd = exec.Command("bash", execPath)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// 5. Avvio e cattura dell'errore
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("esecuzione script fallita (verifica la sintassi bash): %w", err)
	}

	return nil
}
