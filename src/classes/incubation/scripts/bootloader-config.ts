import { tmpdir } from 'os'

/**
 *
 */
export function bootloaderConfig(): string {
   let text = ``
   text += `#!/bin/bash\n`
   text += `\n`
   text += `CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")\n`
   text += `\n`
   text += `# Creo la directory $CHROOT/tmp se mancante \n`
   text += `TMPDIR=$CHROOT/tmp\n`
   text += `if [ ! -d $TMPDIR ]; then\n`
   text += `    echo mkdir $TMPDIR\n`
   text += `fi\n`
   text += `# eseguo apt update\n`
   text += `chroot $CHROOT apt-get -y --allow-unauthenticated update`
   text += `\n`
   text += `# Set secure permissions for the initramfs if we're configuring\n`
   text += `# full-disk-encryption. The initramfs is re-generated later in the\n`
   text += `# installation process so we only set the permissions snippet without\n`
   text += `# regenerating the initramfs right now:\n`
   text += `if [ "$(mount | grep $CHROOT" " | cut -c -16)" = "/dev/mapper/luks" ]; then\n`
   text += `    echo "UMASK=0077" > $CHROOT/etc/initramfs-tools/conf.d/initramfs-permissions\n`
   text += `fi\n`
   text += `\n`
   text += `echo "Running bootloader-config..."\n`
   text += `\n`
   text += `if [ -d /sys/firmware/efi/efivars ]; then\n`
   text += `    echo " * Installing grub-efi (uefi)..."\n`
   text += `    DEBIAN_FRONTEND=noninteractive chroot $CHROOT apt-get -y --allow-unauthenticated install grub-efi-amd64 cryptsetup keyutils\n`
   text += `else\n`
   text += `    echo " * install grub... (bios)"\n`
   text += `    DEBIAN_FRONTEND=noninteractive chroot $CHROOT apt-get -y --allow-unauthenticated install grub-pc cryptsetup keyutils\n`
   text += `fi\n`
   return text
}
