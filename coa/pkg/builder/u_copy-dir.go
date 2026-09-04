package builder

import (
	"io"
	"os"
	"path/filepath"
)

// copyDir recursively copies a directory from src to dst
func copyDir(src string, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Compute the relative path for the destination
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		targetPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			if err := os.MkdirAll(targetPath, packageMode(info.Mode())); err != nil {
				return err
			}
			return os.Chmod(targetPath, packageMode(info.Mode()))
		}

		return copyFile(path, targetPath)
	})
}

// copyFile copies a single file preserving permissions
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	// Create parent directory if it doesn't exist (extra safety)
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

	// Preserve executable bits while removing group/other write permissions.
	// Package contents must not depend on the developer's umask or workspace ACLs.
	info, err := os.Stat(src)
	if err == nil {
		if err := os.Chmod(dst, packageMode(info.Mode())); err != nil {
			return err
		}
	}

	return nil
}

func packageMode(mode os.FileMode) os.FileMode {
	return mode.Perm() &^ 0022
}
