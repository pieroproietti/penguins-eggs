// worker/copy.go (o dove tieni le tue struct)
package worker

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func RunCopy(config ActionCopy) error {
	src := config.Params.Src

	// 1. Routing Intelligente del Percorso di Destinazione
	var dest string
	if config.Chroot {
		// Destinazione DENTRO il chroot
		dest = filepath.Join(config.ResolvedTargetRoot, config.Params.Dest)
	} else {
		// Destinazione SULL'HOST (es. /home/eggs/isodir/...)
		dest = config.Params.Dest
	}

	// 2. Apertura file sorgente
	sourceFile, err := os.Open(src)
	if err != nil {
		if config.Params.IgnoreMissing && os.IsNotExist(err) {
			// Uscita pulita e silenziosa se il file manca e ignore_missing è true
			fmt.Printf("🥚 [oa-ell] Copia ignorata (sorgente assente): %s\n", src)
			return nil
		}
		return fmt.Errorf("errore apertura sorgente %s: %v", src, err)
	}
	defer sourceFile.Close()

	// 3. Creazione dinamica dell'albero delle directory di destinazione
	destDir := filepath.Dir(dest)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return fmt.Errorf("impossibile creare le directory di destinazione %s: %v", destDir, err)
	}

	// 4. Lettura e calcolo dei permessi
	info, err := sourceFile.Stat()
	if err != nil {
		return fmt.Errorf("impossibile leggere attributi di %s: %v", src, err)
	}

	perms := info.Mode()
	if config.Params.Permissions != 0 {
		perms = os.FileMode(config.Params.Permissions) // Sovrascrittura permessi se richiesta dal YAML
	}

	// 5. Creazione o sovrascrittura del file di destinazione
	destFile, err := os.OpenFile(dest, os.O_RDWR|os.O_CREATE|os.O_TRUNC, perms)
	if err != nil {
		return fmt.Errorf("errore creazione file destinazione %s: %v", dest, err)
	}
	defer destFile.Close()

	// 6. Travaso dei dati
	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return fmt.Errorf("errore durante la copia dei dati: %v", err)
	}

	// Output pulito
	fmt.Printf("🥚 [oa-ell] Copia completata: %s -> %s\n", src, dest)
	return nil
}
