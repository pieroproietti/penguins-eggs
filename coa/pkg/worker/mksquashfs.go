package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

func shellJoin(args []string) string {
	quoted := make([]string, len(args))
	for i, a := range args {
		if strings.ContainsAny(a, " \t") {
			quoted[i] = fmt.Sprintf("%q", a)
		} else {
			quoted[i] = a
		}
	}
	return strings.Join(quoted, " ")
}

func RunMksquashfs(payload []byte) error {
	var config struct {
		Params struct {
			Algorithm    string `json:"algorithm"`
			Level        string `json:"level"`
			LiveRoot     string `json:"live_root"`
			DestFile     string `json:"dest_file"`
			ExcludesFile string `json:"excludes_file"`
		} `json:"params"`
	}

	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("error parsing JSON for mksquashfs module: %w", err)
	}

	algo := config.Params.Algorithm
	level := config.Params.Level
	liveRoot := config.Params.LiveRoot
	destFile := config.Params.DestFile
	excludesFile := config.Params.ExcludesFile

	if liveRoot == "" {
		return fmt.Errorf("mksquashfs module: missing 'live_root' parameter")
	}
	if destFile == "" {
		return fmt.Errorf("mksquashfs module: missing 'dest_file' parameter")
	}

	if algo == "" {
		algo = "zstd"
	}
	if level == "" || level == "0" {
		level = "3"
	}

	blockSize := "1M"
	procs := fmt.Sprintf("%d", runtime.NumCPU())

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

	if excludesFile != "" {
		args = append(args, "-ef", excludesFile)
	}

	switch algo {
	case "zstd":
		args = append(args, "-comp", "zstd", "-Xcompression-level", level)
	case "xz":
		// -Xbcj x86 aplica un filtro de pre-procesamiento pensado para
		// código x86/x86_64 (reordena offsets de saltos/llamadas para
		// que se repitan más patrones), mejorando la compresión real de
		// xz en un sistema Linux típico sin costo de compatibilidad:
		// mksquashfs/unsquashfs lo soportan de forma nativa y
		// transparente al montar/leer el squashfs resultante.
		args = append(args, "-comp", "xz", "-Xbcj", "x86", "-Xdict-size", "1M")
	case "gzip":
		args = append(args, "-comp", "gzip")
	default:
		args = append(args, "-comp", algo)
	}

	fmt.Printf("📦 [worker] Running: mksquashfs %s\n", shellJoin(args))

	cmd := exec.Command("mksquashfs", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("mksquashfs failed: %w", err)
	}

	return nil
}
