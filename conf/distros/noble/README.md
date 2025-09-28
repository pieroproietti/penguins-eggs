# Ubuntu 24.04 noble

Completely renewed, but the problem of crypted persist!

## Modules
* partition
* fstab
* initcpiocfg/initramfs-tools
* bootloader


## no need to add on /etc/initramfs/modules
```
ahci
sd_mod
sr_mod

# Controller NVMe
nvme
nvme_core

# Controller per macchine virtuali (molto importante!)
virtio
virtio_pci
virtio_scsi

# Supporto USB (per installazioni su dischi esterni)
usb_storage

# Moduli per la gestione dei filesystem e della crittografia
ext4
dm_mod
dm_crypt
```