# Hic sunt leones! 

## AlpineLinux

On Arch we have HOOKS, eg:

```
MODULES=()
BINARIES=()
FILES=()
HOOKS=(base udev modconf memdisk archiso archiso_loop_mnt archiso_pxe_common archiso_pxe_nbd archiso_pxe_http archiso_pxe_nfs kms block filesystems keyboard)
COMPRESSION="zstd"
```

on AlpineLinux whe have features:
```
features="ata base ide scsi usb virtio ext4"
```
## List feathures
```
mkinitfs -L 
```

## apkvol

apkvol=cdrom/live/

HTTP, HTTPS or FTP URL to an apkovl.tar.gz file which will be retrieved and
applied. Can also be a filesystem path, optionally prepended with the device
name without the /dev/ prefix.

## overlaytmpfs
When booting from a read-only filesystem, you can specify this flag to have
your changes written to an in-memory temporary overlayfs.  The underlying
filesystem will always be mounted read-only, the overlay always writable.

