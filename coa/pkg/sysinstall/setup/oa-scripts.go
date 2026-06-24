package setup

import (
	"coa/pkg/distro"
	"path/filepath"
)

func oaScripts(d *distro.Distro) error {
	config := OaConfig{Family: d.FamilyID, ID: d.DistroID}

	// Scrive lo script initramfs
	outInitramfs := filepath.Join(InstallerDRoot, "oa-initramfs.sh")
	if err := renderAndSaveEmbedded("oa-initramfs.sh.tmpl", outInitramfs, config, 0755); err != nil {
		return err
	}

	// Scrive lo script bootloades
	outBootloader := filepath.Join(InstallerDRoot, "oa-bootloader.sh")
	if err := renderAndSaveEmbedded("oa-bootloader.sh.tmpl", outBootloader, config, 0755); err != nil {
		return err
	}

	// Scrive il chroot-runner
	outBridge := filepath.Join(InstallerDRoot, "oa-chroot-runner.sh")
	return renderAndSaveEmbedded("oa-chroot-runner.sh.tmpl", outBridge, nil, 0755)

}
