package engine

import (
	"os"
)

// SquashfsConfig contiene i parametri dinamici per mksquashfs
type SquashfsConfig struct {
	Compression      string
	CompressionLevel string
	BlockSize        string
	Processors       string
}

// GetSquashfsArgs decide i parametri in base all'ambiente
func GetSquashfsArgs() []string {
	// 1. Valori di default (Ottimali per uso locale a Roma)
	config := SquashfsConfig{
		Compression:      "zstd",
		CompressionLevel: "3",
		BlockSize:        "1M",
		Processors:       "4", // Default prudenziale
	}

	// 2. Rilevamento automatico dei processori locali (opzionale)
	// Se vuoi usare tutti i core della tua macchina locale:
	// config.Processors = fmt.Sprintf("%d", runtime.NumCPU())

	// 3. "Cura Dimagrante & Velocità" per GitHub Actions
	if os.Getenv("GITHUB_ACTIONS") == "true" {
		config.CompressionLevel = "1" // Velocità massima
		config.BlockSize = "256K"     // Meno RAM e CPU impegnata
		config.Processors = "2"       // I runner standard hanno 2 core
	}

	// Costruiamo la slice degli argomenti
	return []string{
		"-no-xattrs",
		"-comp", config.Compression,
		"-Xcompression-level", config.CompressionLevel,
		"-b", config.BlockSize,
		"-processors", config.Processors,
		"-noappend",
		"-wildcards",
	}
}
