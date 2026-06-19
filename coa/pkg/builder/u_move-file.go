package builder

import (
	"fmt"
	"io"
	"os"
)

// moveFile moves a file safely even across different filesystems (e.g. tmpfs -> ext4)
func moveFile(sourcePath, destPath string) error {
	// 1. Try native rename (instant, works if on the same filesystem)
	err := os.Rename(sourcePath, destPath)
	if err == nil {
		return nil
	}

	// 2. If it fails (typical "cross-device link" error), fall back to copy and delete
	inputFile, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("unable to open source: %v", err)
	}
	defer inputFile.Close()

	outputFile, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("unable to create destination: %v", err)
	}
	defer outputFile.Close()

	// Copy bytes (io.Copy avoids loading the entire file into RAM at once)
	_, err = io.Copy(outputFile, inputFile)
	if err != nil {
		return fmt.Errorf("error during copy: %v", err)
	}

	// Close the source file before deleting it
	inputFile.Close()

	// Delete the original
	return os.Remove(sourcePath)
}
