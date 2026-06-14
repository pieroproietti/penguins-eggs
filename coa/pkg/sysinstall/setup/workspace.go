package setup

import (
	"fmt"
	"os"
	"path/filepath"

	"coa/pkg/assets"
	"coa/pkg/utils"
)

// InitWorkspace pialla la vecchia configurazione e crea l'albero pulito
func initWorkspace() error {
	utils.LogNormal("Generazione ambiente Evolution Edition...")

	// 1. Rimuove tutto
	os.RemoveAll(InstallerDRoot)

	// 2. Estrae installer.d
	if err := assets.ExtractCalamares(InstallerDRoot); err != nil {
		return fmt.Errorf("errore estrazione asset: %v", err)
	}

	// 3. Crea la struttura essenziale richiesta da Calamares
	dirs := []string{
		"modules",
		"branding/eggs",
		"qml", // <--- IL FIX PER L'ERRORE FATAL SUL QML
	}

	for _, d := range dirs {
		if err := os.MkdirAll(filepath.Join(InstallerDRoot, d), 0755); err != nil {
			return fmt.Errorf("errore creazione directory %s: %v", d, err)
		}
	}

	return nil
}
