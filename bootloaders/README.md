# bootloaders

To boot from live, We use bootloaders from Debian bookworm for every distro.

## grub
* grub/grubx64.efi.signed (boot from live cd)
* grub/grubnetx64.efi.signed (boot from network)
* grub/shimx64.efi.signed as bootx64.efi
* grub/x86_64-efi (modules)

## ipxe
* /ipxe.pxe (booting pxe on UEFI)
* /undionly.kpxe (booting from BIOS)

## syslinux
* /syslinux

# Path signed/unsigned
* /usr/lib/grub/x86_64-efi-signed/grubx64.efi.signed
* /usr/lib/grub/x86_64-efi/monolithic/grubx64.efi
* /usr/lib/shim/shimx64.efi.signed
* /usr/lib/shim/shimx64.efi