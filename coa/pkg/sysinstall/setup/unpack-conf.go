package setup

import (
	"os"
	"path/filepath"
	"time"
)

type UnpackfsConfig struct {
	Date       string
	SquashPath string
}

// PrepareUnpackfsConf genera il modulo unpackfs dinamico
func unpackfsConf(source string) error {
	config := UnpackfsConfig{
		Date:       time.Now().Format("2006-01-02"),
		SquashPath: source,
	}

	targetPath := filepath.Join(modulesDir, "unpackfs.conf")
	return renderAndSaveEmbedded("unpackfs.conf.tmpl", targetPath, config, 0644)
}

const ErrorSquashfsNotFound = "/ERROR_SQUASHFS_NOT_FOUND/filesystem.squashfs"

// FindSquashfsPath cerca il filesystem compresso
func FindSquashfsPath() string {
	possiblePaths := []string{
		"/run/miso/bootmnt/manjaro/x86_64/livefs.sfs",
		"/run/miso/bootmnt/manjaro/x86_64/rootfs.sfs",
		"/run/live/medium/live/filesystem.squashfs",
		"/lib/live/mount/medium/live/filesystem.squashfs",
		"/run/archiso/bootmnt/arch/x86_64/airootfs.sfs",
		"/run/initramfs/live/live/filesystem.squashfs",
		"/run/initramfs/live/LiveOS/squashfs.img",
		"/live/filesystem.squashfs",
		"/home/eggs/isodir/live/filesystem.squashfs",
		"/home/eggs/live/filesystem.squashfs",
	}
	for _, p := range possiblePaths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	var found string
	filepath.WalkDir("/home/eggs", func(path string, d os.DirEntry, err error) error {
		if err == nil && !d.IsDir() && filepath.Base(path) == "filesystem.squashfs" {
			found = path
			return filepath.SkipAll
		}
		return nil
	})
	if found != "" {
		return found
	}
	return ErrorSquashfsNotFound
}
