/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

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

	"coa/pkg/pathDefaults"
)

const BootloaderURL = "https://github.com/pieroproietti/penguins-bootloaders/releases/download/v26.1.16/bootloaders.tar.gz"

// completeMarker is written only upon successful extraction: it distinguishes a
// valid cache from one left incomplete by an interrupted run (crash, kill, reboot).
const completeMarker = ".download-complete"

// IsValidBootloadersDir checks if a directory exists and contains valid bootloader assets.
func IsValidBootloadersDir(dir string) bool {
	if dir == "" {
		return false
	}
	fi, err := os.Stat(dir)
	if err != nil || !fi.IsDir() {
		return false
	}
	// A complete marker explicitly signals a verified extraction
	if _, err := os.Stat(filepath.Join(dir, completeMarker)); err == nil {
		return true
	}
	// Check for key directories/files from penguins-bootloaders
	if _, err := os.Stat(filepath.Join(dir, "ISOLINUX")); err == nil {
		return true
	}
	if _, err := os.Stat(filepath.Join(dir, "grub")); err == nil {
		return true
	}
	// Fallback: directory contains entries
	entries, err := os.ReadDir(dir)
	return err == nil && len(entries) > 0
}

// GetUserBootloadersCacheDir returns the user-specific cache directory
// according to XDG base directory specifications ($XDG_CACHE_HOME or ~/.cache).
func GetUserBootloadersCacheDir() string {
	if xdg := os.Getenv("XDG_CACHE_HOME"); xdg != "" {
		return filepath.Join(xdg, "penguins-eggs", "bootloaders")
	}
	home, err := os.UserHomeDir()
	if err == nil && home != "" {
		return filepath.Join(home, ".cache", "penguins-eggs", "bootloaders")
	}
	return ""
}

// ResolveBootloadersDir resolves the active bootloaders path using cascade priority:
// 1. Packaged directory: /usr/share/penguins-eggs/bootloaders (if populated and valid)
// 2. Persistent system cache: /var/cache/penguins-eggs/bootloaders (if populated)
// 3. User cache: $XDG_CACHE_HOME/penguins-eggs/bootloaders (if populated)
// 4. Default destination based on execution privileges.
func ResolveBootloadersDir() string {
	if IsValidBootloadersDir(pathDefaults.BootloadersSystemDir) {
		return pathDefaults.BootloadersSystemDir
	}
	if IsValidBootloadersDir(pathDefaults.BootloadersCacheDir) {
		return pathDefaults.BootloadersCacheDir
	}
	if userCache := GetUserBootloadersCacheDir(); userCache != "" && IsValidBootloadersDir(userCache) {
		return userCache
	}
	if os.Geteuid() == 0 {
		return pathDefaults.BootloadersCacheDir
	}
	if userCache := GetUserBootloadersCacheDir(); userCache != "" {
		return userCache
	}
	return pathDefaults.BootloadersSystemDir
}

// EnsureBootloaders verifies the existence of bootloaders following the cascade.
// If an existing valid installation is found in /usr/share or /var/cache (or user cache),
// it is returned immediately without downloading.
// If missing, it downloads and extracts bootloaders.tar.gz into the persistent cache
// (/var/cache/penguins-eggs/bootloaders for root, or user cache for unprivileged execution).
func EnsureBootloaders(targetDir ...string) (string, error) {
	if len(targetDir) > 0 && targetDir[0] != "" {
		custom := targetDir[0]
		if IsValidBootloadersDir(custom) {
			return custom, nil
		}
		return downloadTo(custom)
	}

	// Cascade check 1: Packaged system directory (no download, no delay)
	if IsValidBootloadersDir(pathDefaults.BootloadersSystemDir) {
		return pathDefaults.BootloadersSystemDir, nil
	}

	// Cascade check 2: Persistent system cache
	if IsValidBootloadersDir(pathDefaults.BootloadersCacheDir) {
		return pathDefaults.BootloadersCacheDir, nil
	}

	// Cascade check 2b: User cache
	if userCache := GetUserBootloadersCacheDir(); userCache != "" && IsValidBootloadersDir(userCache) {
		return userCache, nil
	}

	// Cascade check 3: Missing from all locations, determine download target
	var dest string
	if os.Geteuid() == 0 {
		dest = pathDefaults.BootloadersCacheDir
	} else {
		dest = GetUserBootloadersCacheDir()
		if dest == "" {
			return "", fmt.Errorf("running as non-root and cannot determine user cache directory ($XDG_CACHE_HOME or $HOME); run with sudo to populate system cache in %s", pathDefaults.BootloadersCacheDir)
		}
	}

	return downloadTo(dest)
}

// downloadTo isolates the download and extraction process to a specific destination
func downloadTo(targetDir string) (string, error) {
	if _, err := os.Stat(filepath.Join(targetDir, completeMarker)); err == nil {
		return targetDir, nil
	}

	parent := filepath.Dir(targetDir)
	if err := os.MkdirAll(parent, 0755); err != nil {
		if os.IsPermission(err) {
			return "", fmt.Errorf("permission denied creating cache parent directory %s (run with sudo or ensure directory is writable): %w", parent, err)
		}
		return "", fmt.Errorf("unable to create cache directory %s: %w", parent, err)
	}

	LogNormal("Downloading bootloaders...")

	// Wipe any partial leftovers from an interrupted previous run
	if err := os.RemoveAll(targetDir); err != nil {
		if os.IsPermission(err) {
			return "", fmt.Errorf("permission denied cleaning target directory %s: %w", targetDir, err)
		}
		return "", fmt.Errorf("unable to clean up %s: %w", targetDir, err)
	}

	if err := downloadAndExtract(BootloaderURL, targetDir); err != nil {
		return "", fmt.Errorf("failed to download and extract bootloaders to %s: %w", targetDir, err)
	}

	if err := os.WriteFile(filepath.Join(targetDir, completeMarker), []byte("ok\n"), 0644); err != nil {
		return "", fmt.Errorf("unable to write completion marker in %s: %w", targetDir, err)
	}

	return targetDir, nil
}

// downloadAndExtract isolates network and I/O logic
func downloadAndExtract(url string, targetDir string) error {
	// Security timeout: allow up to 5 minutes for downloading ~22MB on slow connections
	client := &http.Client{
		Timeout: 5 * time.Minute,
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
		if os.IsPermission(err) {
			return fmt.Errorf("permission denied creating %s (run with sudo): %w", targetDir, err)
		}
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
			_ = os.Remove(target)
			if err := os.Symlink(header.Linkname, target); err != nil {
				return err
			}
		}
	}
	return nil
}
