// worker/mksquashfs.go
package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

// RunMksquashfs esegue la compressione leggendo i parametri grezzi passati dal dispatcher.
func RunMksquashfs(payload []byte) error {
	// 1. Struttura locale isolata: definiamo solo ciò che serve a questo modulo
	var config struct {
		Params struct {
			Algorithm    string `json:"algorithm"`
			Level        string `json:"level"`
			LiveRoot     string `json:"live_root"`
			DestFile     string `json:"dest_file"`
			ExcludesFile string `json:"excludes_file"`
		} `json:"params"`
	}

	// 2. Apriamo la busta ricevuta dal dispatcher
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo mksquashfs: %w", err)
	}

	// 3. Estraiamo i parametri
	algo := config.Params.Algorithm
	level := config.Params.Level
	liveRoot := config.Params.LiveRoot
	destFile := config.Params.DestFile
	excludesFile := config.Params.ExcludesFile

	// Controlli di sicurezza fondamentali
	if liveRoot == "" {
		return fmt.Errorf("modulo mksquashfs: parametro 'live_root' mancante")
	}
	if destFile == "" {
		return fmt.Errorf("modulo mksquashfs: parametro 'dest_file' mancante")
	}

	// Setup dei valori di default se mancanti
	if algo == "" {
		algo = "zstd"
	}
	if level == "" || level == "0" {
		level = "3"
	}

	blockSize := "1M"
	procs := fmt.Sprintf("%d", runtime.NumCPU()) // Usa tutti i core disponibili

	// 4. Costruiamo gli argomenti di base per mksquashfs
	args := []string{
		liveRoot,
		destFile,
		"-no-xattrs",
		"-b", blockSize,
		"-processors", procs,
		"-noappend",
		"-wildcards",
		"-p", "mnt d 0755 root root",
		"-p", "media d 0755 root root",
	}

	// Aggiungiamo il file delle esclusioni solo se specificato
	if excludesFile != "" {
		args = append(args, "-ef", excludesFile)
	}

	// 5. Gestione intelligente degli argomenti di compressione
	switch algo {
	case "zstd":
		args = append(args, "-comp", "zstd", "-Xcompression-level", level)
	case "xz":
		// xz non supporta -Xcompression-level su mksquashfs in questo formato
		args = append(args, "-comp", "xz")
	case "gzip":
		args = append(args, "-comp", "gzip")
	default:
		args = append(args, "-comp", algo)
	}

	// 6. Output visivo pulito per il terminale
	fmt.Println("========================================================")
	fmt.Printf("📦 [worker] AVVIO MKSQUASHFS (Profilo: %s L%s, %s, %s Cores)\n", algo, level, blockSize, procs)
	fmt.Println("========================================================")

	// 7. Esecuzione
	cmd := exec.Command("mksquashfs", args...)

	// Colleghiamo l'output al terminale per far scorrere la barra di progresso in tempo reale
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("fallimento mksquashfs: %w", err)
	}

	return nil
}
