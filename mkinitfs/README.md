# Hic sunt leones! 

## AlpineLinux

On Arch we have HOOKS

```
MODULES=()
BINARIES=()
FILES=()
HOOKS=(base udev modconf memdisk archiso archiso_loop_mnt archiso_pxe_common archiso_pxe_nbd archiso_pxe_http archiso_pxe_nfs kms block filesystems keyboard)
COMPRESSION="zstd"
```

On AlpineLinux whe have features:
```
features="ata base ide scsi usb virtio ext4"
```