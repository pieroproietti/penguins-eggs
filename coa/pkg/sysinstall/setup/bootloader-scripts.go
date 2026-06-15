package setup

import (
	"coa/pkg/distro"
	"path/filepath"
)

func bootloaderScripts(d *distro.Distro) error {
	config := BootloaderConfig{Family: d.FamilyID, ID: d.DistroID}

	// Scrive lo script principale
	outBootloader := filepath.Join(InstallerDRoot, "oa-bootloader.sh")
	if err := renderAndSaveEmbedded("bootloader.sh.tmpl", outBootloader, config, 0755); err != nil {
		return err
	}

	// Scrive il ponte
	outBridge := filepath.Join(InstallerDRoot, "oa-bootloader-bridge.sh")
	return renderAndSaveEmbedded("bootloader-bridge.sh.tmpl", outBridge, nil, 0755)
}
