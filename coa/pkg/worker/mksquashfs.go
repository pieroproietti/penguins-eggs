package worker

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

// Presumiamo che tu abbia una struttura di configurazione simile
type CompressionSettings struct {
	Algorithm string
	Level     string
}

// RunMksquashfs esegue la compressione leggendo i parametri direttamente dalla struct passata da ell.go
func RunMksquashfs(config ActionMksquashfs) error {
	// 1. Estraiamo i parametri dalla struct
	algo := config.Params.Algorithm
	level := config.Params.Level
	liveRoot := config.Params.LiveRoot
	destFile := config.Params.DestFile
	excludesFile := config.Params.ExcludesFile

	// Setup dei valori di default se mancanti
	if algo == "" {
		algo = "zstd"
	}
	if level == "" || level == "0" {
		level = "3"
	}

	blockSize := "1M"
	procs := fmt.Sprintf("%d", runtime.NumCPU()) // Usa tutti i core disponibili

	// 2. Costruiamo gli argomenti di base per mksquashfs
	args := []string{
		liveRoot,
		destFile,
		"-no-xattrs",
		"-b", blockSize,
		"-processors", procs,
		"-noappend",
		"-wildcards",
		"-ef", excludesFile,
		"-p", "mnt d 0755 root root",
		"-p", "media d 0755 root root",
	}

	// 3. Gestione intelligente degli argomenti di compressione
	switch algo {
	case "zstd":
		args = append(args, "-comp", "zstd", "-Xcompression-level", level)
	case "xz":
		// xz non supporta -Xcompression-level su mksquashfs
		args = append(args, "-comp", "xz")
	case "gzip":
		args = append(args, "-comp", "gzip")
	default:
		args = append(args, "-comp", algo)
	}

	// 4. Output visivo
	fmt.Println("========================================================")
	fmt.Printf("🚀 AVVIO MKSQUASHFS (Profilo: %s L%s, %s, %s Cores)\n", algo, level, blockSize, procs)
	fmt.Println("========================================================")

	// 5. Esecuzione
	cmd := exec.Command("mksquashfs", args...)

	// Colleghiamo l'output al terminale per la barra di progresso
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
