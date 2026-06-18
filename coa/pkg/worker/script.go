// worker/script.go
package worker

import (
	"encoding/json"
	"fmt"
	"os"
)

// RunScript è il wrapper per i file fisici: legge il contenuto e delega al motore centrale
func RunScript(payload []byte) error {
	var config ShellConfig

	// Riutilizziamo la struttura ShellConfig per aprire la busta
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo script: %w", err)
	}

	src := config.Params.Src
	if src == "" {
		return fmt.Errorf("modulo script: parametro 'src' mancante")
	}

	// Leggiamo il file sorgente dal sistema HOST
	scriptContent, err := os.ReadFile(src)
	if err != nil {
		return fmt.Errorf("impossibile leggere lo script sorgente '%s': %w", src, err)
	}

	fmt.Printf("📄 [worker script] Caricato file '%s' dal disco...\n", src)

	// Passiamo il controllo al motore di shell.go che gestirà chroot, iniezione e args
	return executeUnifiedShell(config, scriptContent)
}
