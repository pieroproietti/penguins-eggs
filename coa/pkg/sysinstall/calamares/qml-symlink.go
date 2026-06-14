package calamares

import (
	"coa/pkg/sysinstall/setup"
	"fmt"
	"os"
	"path/filepath"
)

func QmlSymlink() error {
	configDir := setup.InstallerDRoot
	source := "/usr/share/calamares/qml"
	target := filepath.Join(configDir, "qml")

	// 1. Sorgente: controlla che esista
	if _, err := os.Stat(source); os.IsNotExist(err) {
		return fmt.Errorf("sorgente QML non trovata in %s", source)
	}

	// 2. Target: pulizia preventiva
	// Se la cartella esiste ed è vuota (creata da initWorkspace), la rimuoviamo per creare il link
	info, err := os.Lstat(target)
	if err == nil {
		if info.Mode()&os.ModeSymlink != 0 {
			return nil // Link già esistente, tutto ok
		}
		// Se esiste ed è una cartella (non link), la pialliamo per sostituirla col link
		if info.IsDir() {
			os.RemoveAll(target)
		} else {
			return fmt.Errorf("il target %s esiste ed è un file, non una cartella", target)
		}
	}

	// 3. Creazione del symlink
	err = os.Symlink(source, target)
	if err != nil {
		return fmt.Errorf("errore durante la creazione del symlink QML: %w", err)
	}

	return nil
}
