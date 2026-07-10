package utils

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const BootloaderURL = "https://github.com/pieroproietti/penguins-bootloaders/releases/download/v26.1.16/bootloaders.tar.gz"

// completeMarker si scrive solo a estrazione riuscita: distingue una
// cache valida da una lasciata a metà da un run precedente interrotto
// (crash, kill, VM riavviata durante il download/estrazione).
const completeMarker = ".download-complete"

// EnsureBootloaders checks if the bootloaders directory exists and
// contains a completed download. If not, it (re)downloads and extracts them.
func EnsureBootloaders(targetDir string) error {
	// 1. Check if a previous download completed successfully
	if _, err := os.Stat(filepath.Join(targetDir, completeMarker)); err == nil {
		return nil
	}

	LogNormal("Bootloaders not found (or incomplete) in %s. Starting download...", targetDir)

	// 2. Wipe any partial leftovers from an interrupted previous run,
	// then download and extract fresh.
	if err := os.RemoveAll(targetDir); err != nil {
		return fmt.Errorf("unable to clean up %s: %w", targetDir, err)
	}
	if err := downloadAndExtract(BootloaderURL, targetDir); err != nil {
		return fmt.Errorf("failed to download and extract bootloaders: %w", err)
	}

	// 3. Only now, after everything extracted successfully, mark it complete.
	if err := os.WriteFile(filepath.Join(targetDir, completeMarker), []byte("ok\n"), 0644); err != nil {
		return fmt.Errorf("unable to write completion marker: %w", err)
	}

	return nil
}

// downloadAndExtract isolates network and I/O logic
func downloadAndExtract(url string, targetDir string) error {
	// Security timeout: if the network freezes, abort after 30s
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("network error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server responded with status %d", resp.StatusCode)
	}

	// Create a temporary file in /tmp to avoid partial writes at target
	tmpFile, err := os.CreateTemp("", "bootloaders-*.tar.gz")
	if err != nil {
		return fmt.Errorf("unable to create temporary file: %w", err)
	}
	defer os.Remove(tmpFile.Name()) // The file will be removed automatically
	defer tmpFile.Close()

	// Data transfer
	if _, err := io.Copy(tmpFile, resp.Body); err != nil {
		return fmt.Errorf("transfer interrupted: %w", err)
	}

	// Make sure target directory exists
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return fmt.Errorf("unable to create target directory: %w", err)
	}

	// Reset temporary file pointer to allow reading
	if _, err := tmpFile.Seek(0, io.SeekStart); err != nil {
		return fmt.Errorf("failed to seek temporary file: %w", err)
	}

	// Decompress and extract
	if err := extractTarGz(tmpFile, targetDir); err != nil {
		// Clean up target directory if extraction fails
		os.RemoveAll(targetDir)
		return fmt.Errorf("decompression/extraction error: %w", err)
	}

	return nil
}

// extractTarGz extracts a .tar.gz archive reader to the dest directory
func extractTarGz(r io.Reader, dest string) error {
	gzr, err := gzip.NewReader(r)
	if err != nil {
		return err
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		cleanPath := filepath.Clean(header.Name)
		parts := strings.Split(cleanPath, string(filepath.Separator))

		var relPath string
		if len(parts) > 1 {
			relPath = filepath.Join(parts[1:]...)
		} else {
			continue // Skip root directory of tarball
		}

		target := filepath.Join(dest, relPath)

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, 0755); err != nil {
				return err
			}
		case tar.TypeReg:
			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}
			f, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR|os.O_TRUNC, os.FileMode(header.Mode))
			if err != nil {
				return err
			}
			if _, err := io.Copy(f, tr); err != nil {
				f.Close()
				return err
			}
			f.Close()
		case tar.TypeSymlink:
			if err := os.Symlink(header.Linkname, target); err != nil {
				return err
			}
		}
	}
	return nil
}
