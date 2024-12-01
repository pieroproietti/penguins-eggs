# ALDOS

Let me finish with testing and corrections, and will try this weekend with penguin-eggs.

Latest ISO has all the features I wanted, except LVM (it's a calamares bug).
- 4 partitions schema (/boot, /, /home, swap)
- Zram enabled after first boot
- /tmp as tmpfs

The issue for penguins-eggs seems to be a conflict with syslinux (boot loader for ISO). 
The livecd-tools version used to create the LiveCD only works with syslinux 4.*. Versions 5.* and 6.* 
use a different name schema for files used to boot.

I'm using syslinux from the origina version on https://www.kernel.org/pub/linux/utils/boot/syslinux/6.xx/ version 6.03, the last. 

I include the necessary files under [syslux](https://github.com/pieroproietti/penguins-eggs/tree/master/syslinux) then during the creation of the ISO they are placed where need /isolinux.

The ISO has the following structure:

/

Does penguin-eggs uses syslinux from host OS or from the the OS inside the ISO?

Please upload the ISO created with penguins-eggs. 
Will compare with a working ISO to find out whats needed.

This is the configuration file for syslinux located as isolinux/isolinux.cfg. Please send me the one from your ISO.

