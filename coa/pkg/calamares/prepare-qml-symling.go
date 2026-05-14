package calamares

import (
	"fmt"
	"os"
	"path/filepath"
)

// prepareQmlSymlink assicura che Calamares trovi la cartella QML
// dove se l'aspetta (accanto al file di configurazione custom).
func PrepareQmlSymlink() error {
	configDir := oaInstallerRoot
	source := "/usr/share/calamares/qml"
	target := filepath.Join(configDir, "qml")

	// 1. Verifichiamo se il sorgente esiste (per evitare link rotti)
	if _, err := os.Stat(source); os.IsNotExist(err) {
		return fmt.Errorf("sorgente QML non trovata in %s: assicurati che calamares sia installato", source)
	}

	// 2. Controlliamo se il target esiste già
	info, err := os.Lstat(target)
	if err == nil {
		// Se è già un symlink, non facciamo nulla (o potremmo rimuoverlo e rifarlo)
		if info.Mode()&os.ModeSymlink != 0 {
			return nil
		}
		// Se è una cartella o un file reale, forse è meglio segnalarlo o rimuoverlo
		return fmt.Errorf("il target %s esiste già e non è un symlink", target)
	}

	// 3. Creazione del symlink
	// Nota: Richiede che l'applicazione giri con privilegi adeguati (root/sudo)
	err = os.Symlink(source, target)
	if err != nil {
		return fmt.Errorf("errore durante la creazione del symlink QML: %w", err)
	}

	return nil
}
