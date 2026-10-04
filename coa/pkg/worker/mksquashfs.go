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

	blockSize := squashfsBlockSize
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

	args = append(args, squashfsCompressionArgs(algo, level, runtime.GOARCH)...)

	fmt.Printf("📦 [worker] Running: mksquashfs %s\n", shellJoin(args))

	cmd := exec.Command("mksquashfs", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("mksquashfs failed: %w", err)
	}

	return nil
}
