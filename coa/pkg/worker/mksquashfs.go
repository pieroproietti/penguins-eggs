package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

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
		args = append(args, "-comp", "xz")
	case "gzip":
		args = append(args, "-comp", "gzip")
	default:
		args = append(args, "-comp", algo)
	}

	fmt.Printf("📦 [worker] Starting mksquashfs (Profile: %s L%s, %s, %s Cores)\n", algo, level, blockSize, procs)
	
	cmd := exec.Command("mksquashfs", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("mksquashfs failed: %w", err)
	}

	return nil
}
