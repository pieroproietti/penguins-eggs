# penguins-bootloaders

Bootloader collection for penguins-recovery. Includes both system-packaged
bootloaders (from Debian/distro repos) and source-built bootloaders.

## System-packaged bootloaders

Collected by `create-bootloaders` from `/usr/lib/`:
grub, ipxe, ISOLINUX, PXELINUX, shim, syslinux, u-boot, refind, systemd-boot.

Cross-distro package names are defined in `common/tool-lists/bootloaders.list`.

## Source-built bootloaders

Defined in `sources.conf`, built by `build-from-source.sh`:

| Name | Repository | Build | Description |
|------|-----------|-------|-------------|
| u-root | [u-root/u-root](https://github.com/u-root/u-root) | Go | Go-based initramfs and bootloader toolkit |
| mkuimage | [u-root/mkuimage](https://github.com/u-root/mkuimage) | Go | u-root tool for building bootable kernel images |
| submarine | [FyraLabs/submarine](https://github.com/FyraLabs/submarine) | Cargo | Rust-based bootloader from FyraLabs |
| rustBoot | [nihalpasham/rustBoot](https://github.com/nihalpasham/rustBoot) | Cargo | Secure Rust bootloader for embedded/IoT |
| kexecboot | [kexecboot/kexecboot](https://github.com/kexecboot/kexecboot) | Make | Kexec-based bootloader with framebuffer UI |
| Clover | [CloverHackyColor/CloverBootloader](https://github.com/CloverHackyColor/CloverBootloader) | EDK2 | UEFI bootloader (Hackintosh/multi-OS) |
| RefindPlus | [RefindPlusRepo/RefindPlus](https://github.com/RefindPlusRepo/RefindPlus) | Make | Enhanced rEFInd UEFI boot manager |
| RefindPlusUDK | [RefindPlusRepo/RefindPlusUDK](https://github.com/RefindPlusRepo/RefindPlusUDK) | EDK2 | UDK build environment for RefindPlus |
| openboot | [openbootdotdev/openboot](https://github.com/openbootdotdev/openboot) | Make | Open-source boot firmware |
| coreboot | [coreboot/coreboot](https://github.com/coreboot/coreboot) | Make | Open-source firmware replacing proprietary BIOS/UEFI |
| U-Boot | [u-boot/u-boot](https://github.com/u-boot/u-boot) | Make | Universal Boot Loader for embedded systems |
| LinuxBoot | [linuxboot/linuxboot](https://github.com/linuxboot/linuxboot) | Make | Linux kernel as firmware (replaces UEFI DXE) |
| Heads | [linuxboot/heads](https://github.com/linuxboot/heads) | Make | Minimal Linux boot firmware with TPM support |
| LinuxBootSMM | [9elements/LinuxBootSMM](https://github.com/9elements/LinuxBootSMM) | Make | LinuxBoot with SMM support |
| systemd-boot | [systemd/systemd](https://github.com/systemd/systemd) | Meson | UEFI boot manager (sd-boot/bootctl) |

## Usage

```bash
# Package system-installed bootloaders
./create-bootloaders

# Clone and build all source bootloaders
./build-from-source.sh

# Build specific bootloaders only
./build-from-source.sh u-root heads coreboot

# Package everything (system + source-built) into bootloaders.tar.gz
./build-from-source.sh && ./create-bootloaders
```

