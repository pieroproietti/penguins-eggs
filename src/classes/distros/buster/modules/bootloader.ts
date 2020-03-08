/**
 * 
 */
export function fstab(): string {
    let text = ``
    text += `# Bootloader configuration. The bootloader is installed to allow\n`
    text += `# the system to start (and pick one of the installed operating\n`
    text += `# systems to run).\n`
    text += `---\n`
    text += `# Define which bootloader you want to use for EFI installations\n`
    text += `# Possible options are 'grub', 'sb-shim' and 'systemd-boot'.\n`
    text += `efiBootLoader: "grub"\n`
    text += `\n`
    text += `# systemd-boot configuration files settings, set kernel and initramfs file names\n`
    text += `# and amount of time before default selection boots\n`
    text += `kernel: "/vmlinuz-linux"\n`
    text += `img: "/initramfs-linux.img"\n`
    text += `fallback: "/initramfs-linux-fallback.img"\n`
    text += `timeout: "10"\n`
    text += `\n`
    text += `# Optionally set the menu entry name and kernel name to use in systemd-boot.\n`
    text += `# If not specified here, these settings will be taken from branding.desc.\n`
    text += `#\n`
    text += `# bootloaderEntryName: "Generic GNU/Linux"\n`
    text += `# kernelLine: ", with Stable-Kernel"\n`
    text += `# fallbackKernelLine:  ", with Stable-Kernel (fallback initramfs)"\n`
    text += `\n`
    text += `# GRUB 2 binary names and boot directory\n`
    text += `# Some distributions (e.g. Fedora) use grub2-* (resp. /boot/grub2/) names.\n`
    text += `# These names are also used when using sb-shim, since that needs some\n`
    text += `# GRUB functionality (notably grub-probe) to work. As needed, you may us\n`
    text += `# complete paths like /usr/bin/efibootmgr for the executables.\n`
    text += `#\n`
    text += `grubInstall: "grub-install"\n`
    text += `grubMkconfig: "grub-mkconfig"\n`
    text += `grubCfg: "/boot/grub/grub.cfg"\n`
    text += `grubProbe: "grub-probe"\n`
    text += `efiBootMgr: "efibootmgr"\n`
    text += `\n`
    text += `# Optionally set the bootloader ID to use for EFI. This is passed to\n`
    text += `# grub-install --bootloader-id.\n`
    text += `#\n`
    text += `# If not set here, the value from bootloaderEntryName from branding.desc\n`
    text += `# is used, with problematic characters (space and slash) replaced.\n`
    text += `#\n`
    text += `# The ID is also used as a directory name within the EFI environment,\n`
    text += `# and the bootloader is copied from /boot/efi/EFI/<dirname>/ . When\n`
    text += `# setting the option here, keep in mind that the name is sanitized\n`
    text += `# (problematic characters, see above, are replaced).\n`
    text += `#\n`
    text += `# efiBootloaderId: "dirname"\n`
    text += `\n`
    text += `# Optionally install a copy of the GRUB EFI bootloader as the EFI\n`
    text += `# fallback loader (either bootia32.efi or bootx64.efi depending on\n`
    text += `# the system). This may be needed on certain systems (Intel DH87MC\n`
    text += `# seems to be the only one). If you set this to false, take care\n`
    text += `# to add another module to optionally install the fallback on those\n`
    text += `# boards that need it.\n`
    text += `installEFIFallback: false\n`
    return text
}