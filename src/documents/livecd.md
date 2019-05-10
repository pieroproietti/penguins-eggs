# LiveCD

From https://live-team.pages.debian.net/live-manual/html/live-manual/the-basics.en.html


With live systems, it's an operating system, built for one of the supported architectures (currently amd64 and i386). It is made from the following parts:

* Linux kernel image, usually named vmlinuz
* Initial RAM disk image (initrd): a RAM disk set up for the Linux boot, containing modules possibly needed to mount the System image and some scripts to do it.
* System image: The operating system's filesystem image. Usually, a SquashFS compressed filesystem is used to minimize the live system image size. Note that it is read-only. So, during boot the live system will use a RAM disk and 'union' mechanism to enable writing files within the running system. However, all modifications will be lost upon shutdown unless optional persistence is used (see Persistence).
* Bootloader: A small piece of code crafted to boot from the chosen medium, possibly presenting a prompt or menu to allow selection of options/configuration. It loads the Linux kernel and its initrd to run with an associated system filesystem. Different solutions can be used, depending on the target medium and format of the filesystem containing the previously mentioned components: isolinux to boot from a CD or DVD in ISO9660 format, syslinux for HDD or USB drive booting from a VFAT partition, extlinux for ext2/3/4 and btrfs partitions, pxelinux for PXE netboot, GRUB for ext2/3/4 partitions, etc.
