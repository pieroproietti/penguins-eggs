package builder

import (
	"io"
	"os"
	"path/filepath"
)

// copyDir copia ricorsivamente una directory da src a dst
func copyDir(src string, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Calcola il percorso relativo per la destinazione
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		targetPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return os.MkdirAll(targetPath, info.Mode())
		}

		return copyFile(path, targetPath)
	})
}

// copyFile copia un singolo file mantenendo i permessi
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	// Crea la cartella padre se non esiste (sicurezza extra)
	os.MkdirAll(filepath.Dir(dst), 0755)

	destFile, err := os.OpenFile(dst, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	// Preserva i permessi del file originale
	info, err := os.Stat(src)
	if err == nil {
		os.Chmod(dst, info.Mode())
	}

	return nil
}
