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
func unpackfsConf() error {
	config := UnpackfsConfig{
		Date:       time.Now().Format("2006-01-02"),
		SquashPath: findSquashfsPath(),
	}

	targetPath := filepath.Join(modulesDir, "unpackfs.conf")
	return renderAndSaveEmbedded("unpackfs.conf.tmpl", targetPath, config, 0644)
}

// findSquashfsPath cerca il filesystem compresso (Logica intatta dal tuo run.go)
func findSquashfsPath() string {
	possiblePaths := []string{
		"/run/miso/bootmnt/manjaro/x86_64/livefs.sfs",
		"/run/miso/bootmnt/manjaro/x86_64/rootfs.sfs",
		"/run/live/medium/live/filesystem.squashfs",
		"/lib/live/mount/medium/live/filesystem.squashfs",
		"/run/archiso/bootmnt/arch/x86_64/airootfs.sfs",
		"/run/initramfs/live/live/filesystem.squashfs",
		"/run/initramfs/live/LiveOS/squashfs.img",
		"/live/filesystem.squashfs",
	}
	for _, p := range possiblePaths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return "/ERRORE_SQUASHFS_NON_TROVATO/filesystem.squashfs"
}
