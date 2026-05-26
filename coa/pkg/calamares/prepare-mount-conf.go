package calamares

import (
	"fmt"
	"os"
)

// PrepareMountConf genera il file mount.conf dinamico per disinnescare zstd su BIOS
func PrepareMountConf() error {
	tableType := getPartitionTableType()

	// Opzioni Btrfs standard di default (UEFI)
	btrfsOptions := "      - defaults\n      - compress=zstd:1"

	// Se siamo su BIOS (msdos), rimuoviamo la compressione per salvare il GRUB di Jorge
	if tableType == "msdos" {
		btrfsOptions = "      - defaults"
	}

	config := fmt.Sprintf(`---
# mount.conf - Generato dinamicamente da oa-tools
# Filosofia: https://penguins-eggs.net/blog/eggs-bananas

extraMounts:
  - device: proc
    fs: proc
    mountPoint: /proc
  - device: sys
    fs: sysfs
    mountPoint: /sys
  - device: /dev
    mountPoint: /dev
    options:
      - bind
  - device: tmpfs
    fs: tmpfs
    mountPoint: /run
  - device: /run/udev
    mountPoint: /run/udev
    options:
      - bind
  - device: efivarfs
    fs: efivarfs
    mountPoint: /sys/firmware/efi/efivars
    efi: true

btrfsSubvolumes:
  - mountPoint: /
    subvolume: /@
  - mountPoint: /home
    subvolume: /@home
  - mountPoint: /var/cache
    subvolume: /@cache
  - mountPoint: /var/log
    subvolume: /@log

btrfsSwapSubvol: /@swap

mountOptions:
  - filesystem: default
    options:
      - defaults
  - filesystem: efi
    options:
      - defaults
      - umask=0077
  - filesystem: btrfs
    options:
%s
  - filesystem: btrfs_swap
    options:
      - defaults
      - noatime
`, btrfsOptions)

	targetPath := oaInstallerRoot + "/modules/mount.conf"

	// Assicuriamoci che la directory esista
	if err := os.MkdirAll(oaInstallerRoot+"/modules", 0755); err != nil {
		return err
	}

	return os.WriteFile(targetPath, []byte(config), 0644)
}
