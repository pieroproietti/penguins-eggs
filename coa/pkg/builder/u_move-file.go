package builder

import (
	"fmt"
	"io"
	"os"
)

// moveFile sposta un file in modo sicuro anche tra file system diversi (es. tmpfs -> ext4)
func moveFile(sourcePath, destPath string) error {
	// 1. Proviamo il rename nativo (istanteo, funziona se siamo sullo stesso disco)
	err := os.Rename(sourcePath, destPath)
	if err == nil {
		return nil
	}

	// 2. Se fallisce (tipico errore "cross-device link"), eseguiamo Copia e Cancella
	inputFile, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("impossibile aprire il sorgente: %v", err)
	}
	defer inputFile.Close()

	outputFile, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("impossibile creare la destinazione: %v", err)
	}
	defer outputFile.Close()

	// Copiamo i byte (usando io.Copy evitiamo di caricare tutto il file in RAM in un colpo solo)
	_, err = io.Copy(outputFile, inputFile)
	if err != nil {
		return fmt.Errorf("errore durante la copia: %v", err)
	}

	// Chiudiamo il file sorgente prima di poterlo eliminare
	inputFile.Close()

	// Eliminiamo l'originale
	return os.Remove(sourcePath)
}
