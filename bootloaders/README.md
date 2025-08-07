# bootloaders

To boot from live, I want to use bootloaders from Debian trixie for every distro. 

We need create two different ISOs: one for i386 and amd64, and another form arm64:
* penguins-bootloaders-pc.deb (i386 ed x86_64)
* penguins-bootloaders-arm64.deb

This packages will have just it's arch files.


## grub (only amd64 and arm64)
* grub/grubx64.efi.signed (boot from live cd)
* grub/grubnetx64.efi.signed (boot from network)
* grub/shimx64.efi.signed as bootx64.efi
* grub/x86_64-efi (modules)

## ipxe
* /ipxe.pxe (booting pxe on UEFI)
* /undionly.kpxe (booting from BIOS)

## syslinux (only i386 and amd64)
* /syslinux

# Debian paths
## i386
* syslinux
    * /usr/lib/syslinux/
    * /usr/lib/syslinux/bios/ (c32)
    * /usr/lib/ISOLINUX/isohdpfx.bin


## amd64
* syslinux (vedi i386)
* /usr/lib/grub/
    * /usr/lib/grub/i386-pc (not used)
    * /usr/lib/grub/x86_64-efi-signed/* grubx64.efi.signed
    * /usr/lib/grub/x86_64-efi/monolithic/* grubx64.efi
* /usr/lib/shim
    * /usr/lib/shim/shimx64.efi.signed
    * /usr/lib/shim/shimx64.efi


## arm64
* grub
    * /usr/lib/grub/aarm64-efi-signed/grubx64.efi.signed
    * /usr/lib/grub/aarm64-efi/monolithic/grubx64.efi

* shim
    * /usr/lib/shim/shimx64.efi.signed
    * /usr/lib/shim/shimx64.efi

