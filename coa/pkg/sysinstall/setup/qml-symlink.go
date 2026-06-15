package setup

import (
	"fmt"
	"os"
	"path/filepath"
)

// QmlSymlink ora vive direttamente in setup
func QmlSymlink() error {
	// Usiamo direttamente InstallerDRoot nativo!
	qmlDir := filepath.Join(InstallerDRoot, "qml")
	source := "/usr/share/calamares/qml/calamares"
	targetLink := filepath.Join(qmlDir, "calamares")

	fmt.Println(">>> [DEBUG] Entrato in QmlSymlink")
	fmt.Printf(">>> [DEBUG] Percorso Target: %s\n", targetLink)

	if _, err := os.Stat(source); os.IsNotExist(err) {
		fmt.Println(">>> [DEBUG] ERRORE: Sorgente non esiste!")
		return fmt.Errorf("sorgente QML non trovata")
	}

	os.RemoveAll(targetLink)

	fmt.Println(">>> [DEBUG] Sto per eseguire os.Symlink...")
	err := os.Symlink(source, targetLink)
	if err != nil {
		fmt.Println(">>> [DEBUG] FALLIMENTO SYMLINK:", err)
		return err
	}

	fmt.Println(">>> [DEBUG] Symlink creato con successo!")
	return nil
}
