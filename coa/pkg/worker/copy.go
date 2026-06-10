package worker

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// RunCopy esegue la copia di file gestendo path locali e chroot.
// Riceve i byte grezzi dal dispatcher e li decodifica autonomamente.
func RunCopy(payload []byte) error {
	// 1. Definiamo la struttura locale ESATTA per questo modulo
	// Questo elimina il bisogno di avere mega-struct globali in giro per il progetto
	var config struct {
		Chroot             bool   `json:"chroot"`
		LiveRoot string `json:"live_root,omitempty"`
		Params             struct {
			Src           string      `json:"src"`
			Dest          string      `json:"dest"`
			IgnoreMissing bool        `json:"ignore_missing"`
			Permissions   os.FileMode `json:"permissions"`
		} `json:"params"`
	}

	// 2. Apriamo il "pacco" ricevuto dal dispatcher
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo copy: %w", err)
	}

	src := config.Params.Src
	if src == "" {
		return fmt.Errorf("modulo copy: parametro 'src' mancante")
	}
	if config.Params.Dest == "" {
		return fmt.Errorf("modulo copy: parametro 'dest' mancante")
	}

	// 3. Routing Intelligente del Percorso di Destinazione
	var dest string
	if config.Chroot {
		if config.LiveRoot == "" {
			return fmt.Errorf("chroot richiesto ma live_root mancante")
		}
		// Destinazione DENTRO il chroot
		dest = filepath.Join(config.LiveRoot)
	} else {
		// Destinazione SULL'HOST (es. /home/eggs/isodir/...)
		dest = config.Params.Dest
	}

	// 4. Apertura file sorgente
	sourceFile, err := os.Open(src)
	if err != nil {
		if config.Params.IgnoreMissing && os.IsNotExist(err) {
			// Uscita pulita e silenziosa se il file manca e ignore_missing è true
			fmt.Printf("📦 [worker] Copia ignorata (sorgente assente): %s\n", src)
			return nil
		}
		return fmt.Errorf("errore apertura sorgente %s: %v", src, err)
	}
	defer sourceFile.Close()

	// 5. Creazione dinamica dell'albero delle directory di destinazione
	destDir := filepath.Dir(dest)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return fmt.Errorf("impossibile creare le directory di destinazione %s: %v", destDir, err)
	}

	// 6. Lettura e calcolo dei permessi
	info, err := sourceFile.Stat()
	if err != nil {
		return fmt.Errorf("impossibile leggere attributi di %s: %v", src, err)
	}

	perms := info.Mode()
	if config.Params.Permissions != 0 {
		perms = config.Params.Permissions // Sovrascrittura permessi se richiesta dal YAML
	}

	// 7. Creazione o sovrascrittura del file di destinazione
	destFile, err := os.OpenFile(dest, os.O_RDWR|os.O_CREATE|os.O_TRUNC, perms)
	if err != nil {
		return fmt.Errorf("errore creazione file destinazione %s: %v", dest, err)
	}
	defer destFile.Close()

	// 8. Travaso dei dati
	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return fmt.Errorf("errore durante la copia dei dati: %v", err)
	}

	// Output pulito (ho aggiornato la label a [worker] per rispecchiare i nuovi pacchetti)
	fmt.Printf("📦 [worker] Copia completata: %s -> %s\n", src, dest)
	return nil
}
