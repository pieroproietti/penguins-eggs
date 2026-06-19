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
	utils.LogNormal("Generating Evolution Edition environment...")

	// 1. Rimuove tutto
	os.RemoveAll(InstallerDRoot)

	// 2. Estrae installer.d
	if err := assets.ExtractCalamares(InstallerDRoot); err != nil {
		return fmt.Errorf("error extracting assets: %v", err)
	}

	// 3. Crea la struttura essenziale richiesta da Calamares
	dirs := []string{
		"modules",
		"branding/eggs",
		"qml",
	}

	for _, d := range dirs {
		if err := os.MkdirAll(filepath.Join(InstallerDRoot, d), 0755); err != nil {
			return fmt.Errorf("error creating directory %s: %v", d, err)
		}
	}

	return nil
}
