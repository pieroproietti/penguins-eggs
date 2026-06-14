package setup

import (
	"os"
	"path/filepath"
	"time"
)

// MountConfig contiene i dati da iniettare nel template
type MountConfig struct {
	Date   string
	IsBIOS bool // Flag per disinnescare la compressione zstd per compatibilità GRUB
}

func mountConf() error {
	tableType := getPartitionTableType()

	config := MountConfig{
		Date:   time.Now().Format("2006-01-02"),
		IsBIOS: tableType == "msdos",
	}

	targetPath := filepath.Join(InstallerDRoot, "modules", "mount.conf")

	// Assicuriamoci che la directory esista
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}

	return renderAndSaveEmbedded("mount.conf.tmpl", targetPath, config, 0644)
}
