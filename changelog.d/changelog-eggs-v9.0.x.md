### eggs-9.0.49-1
wardrobe: introduced accessories for costumes, you can wear a costume and choose the accessories to wear with. 
* base, 
* eggs-dev, 
* firmware

Costume hen, now specific just xfce4 configuration and take all the capabilities from base, eggs-dev and firmware. The same happen on gwaydroid and kwaydroid: both are actually using accessiries. in this case, it's evident who - a future accessory waydroid, specifyng that it's need and mantained from tha authors - can lead to a better compatibility and free us to configure it twice.

### eggs-9.0.48-1
* wardrobe: added firmwares: [drivers_wifi, codecs, drivers_various, drivers_video_nvidia, drivers_video_amd, drivers_graphics_tablet, drivers_printer, drivers_network];
* wardrobe: having a dress is pretty useless if it's not ironed, let's introduce **wardrobe ironing** to sort all sortables

### eggs-9.0.47-1
* krill: model, layout, variant and option are selected from ```/usr/share/X11/xkb/rules/xorg.lst``` to be compatible with not systemd systems

### eggs-9.0.46-1
° krill: added keyboard model, layout, variant and option selection from localectl

### eggs-9.0.45-1
* rewrote command:  eggs tools locale;
* krill: added all languages on the selection; 

### eggs-9.0.44-1
* wardrobe: rewote copy skel to current user with rsync

### eggs-9.0.43-1
* wardrobe: added hen (the mother of all eggs) costume, rewrote dirs copies to / and copy skel to current user

### eggs-9.0.42-1
* wardrobe: introduced dirs in place of skel, usr and others. --verbose option now not only get verbose, but until user action

### eggs-9.0.41-1
* added SysLinuxOS by Franco Conidi

### eggs-9.0.40-1
wardrobe: separate [wardrobe samples available](https://github.com/pieroproietti/penguins-wardrobe). I separate wardrobe from eggs to let user to create costumes with graphics, icons and so on. They can't stay indide eggs, becouse are quite eavvy compared to scripts;
tailor: instroduced packagesPip on costumes to install python packages.

### eggs-9.0.38-1
wardrobe: rethinking and rewrote in more clear way tailor.ts, wear.ts, list.ts added show.ts and all costumes *.yml. Added a minimal waydroid costume

### eggs-9.0.37-1
eggs come with a new command: **wardrobe**. To get more information pleas read on the [blog](https://penguins-eggs.net/2022/03/14/dress/)

### eggs-9.0.36-1
* **experimental** version with command recipes. I decided later to change to **wardrobe** - more appropriate - to create a way to automatize creation of custom release of our penguins. 

### eggs-9.0.35-1
* krill: bugfix on removing user live on backup

### eggs-9.0.34-1
* added flag --delete to syncto and syncfrom

### eggs-9.0.33-1
* yolk: it seem the problem of local repository yolk now it's solved;
* changed from versionId to codenameId, added releaseId to better fit compatibility

### eggs-9.0.32-1
* ovary: changed the way we find path for vmlinux;
* tools skel: removed dir .local and added mate, xfce4 (seem they use just .config like gnome)

### eggs-9.0.31-1
* ovary: aligned the way of --verbose work as was made in krill, createInitrd replace copyInitrd and remove - during live boot - search forcrypted partitions;
* dad: changed default to: --fast --addons adapt --theme eggs

### eggs-9.0.30-1
* krill: troubles with bootloader-config and sources-yolk, I home this fix

### eggs-9.0.29-1
Finally we end with the errors installing an iso from UEFI/crypted/tpm systems to another UEFI/crypted/tpm systems:
* krill: stop udisk2.service during installation, you can install surelly also on a terminal in GUI;
* krill: using verbose now we have almost all the informations on eventual installation problems
* ovary: reintroduced /etc/resolv.con cleaning, using new systemctl library;
* systemctl: completely rewrote, it became usable from system or chrooted system.

### eggs-9.0.28-1
* ovary: exclude all the accurence of cryptdisks in rc0.d, etc; removed and clean /etc/crypttab on iso

### eggs-9.0.27-1
* krill: added check if not exist disk
* krill: added support to NVMe and paravirtualizated  disk. Example: /dev/vda, /dev/nvme0n other than /dev/sda
* eggs: updated oclif, @oclif/core, perrisbrewery

### eggs-9.0.26-1
* added theme TeLOS, rewrite Utils.vmlinuz() to get get boot image from  /proc/cmdline

### eggs-9.0.25-1
* krill: added UEFI/LVM2 partition, so now we can install Proxmox VE both on BIOS and UEFI systems;
* krill: installer will refuse to continue if a lvm2 volume is already present.

### eggs-9.0.24-1
* krill --pve flag: reintroducing lvm2 partition for Proxmox VE and testing PVE on the resulting live with dhcp. See [proxmox-ve-live-changelog](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/proxmox-ve-live-changelog.md).

### eggs-9.0.23-1
* krill: bugfix removed annoying bug on unmount process and use a more rational "press a key to exit" if we get errors.

### eggs-9.0.22-1
* krill: await if catch an error, removed last grub modifications introduced with eggs-9.0.21-1 in ```/boot/grub/grub.cfg``` on the live and on the system.

### eggs-9.0.21-1
* krill: wrote all partitions modes: bios, bios crypted, efi, efi crypted. efi=256M, boot=512M, swap=8G, rest to root; created module machine-id; in Ubuntu focal and derivated - eggs produce insert now an ```rmmod tpm``` in ```/boot/grub/grub.cfg``` on the live.

### eggs-9.0.20-4
* bugfix: changed to UUID in /etc/crypttab for full-encrypted systems on Ubuntu focal, checked with netplan too

### eggs-9.0.20
* krill: cleaning and fixes! Krill are small crustaceans of the order Euphausiacea continuously adapted to evolution

### eggs-9.0.19
* krill: ```eggs install --cli --crypto``` added full-crypted systems installation.

### eggs-9.0.18
* renamed blissos theme to waydroid, moved egg-of-ubuntu-impish-waydroid and egg-of-debian-bookworm-waydroid together under the same place: [waydroid](https://sourceforge.net/projects/penguins-eggs/files/iso/waydroid/), due the strong affinity.

### eggs-9.0.16
* ```eggs produce``` just remove users accounts and home. This let to have working servers examples;
* ```eggs produce --backup``` remove servers and users data from live, and put them on a LUKS volume.

From version 9.0.16 we have two new commands: ```eggs syncfrom``` (alias restore) and ```eggs syncto``` (alias backup).

A working installation, can easily sync users and servers data to a luks-eggs-backup:
* ```eggs syncto -f /tmp/luks-eggs-backup``` backup users and servers data to LUKS volume /tmp/luks-eggs-backup:

A new installation, can easyly get users and servers data from a luks-eggs-backup:
* ```eggs syncfrom from -f /tmp/luks-eggs-backup``` restore users and servers data from the LUKS volume /tmp/luks-eggs-backup.

**NOTE:** 
* krill: ```sudo eggs install --cli``` will restore users and servers data automatically;
* installing with calamares: when installation is finished, you need to mount the rootdir of your installed system and, give the following command: ```sudo eggs syncfrom -f /path/to/luks-eggs-backup -r /path/to/rootdir```
* it's possbile actually to change the nest directory, editing configuration file ```/etc/penguins-eggs.d/eggs.yaml```. Example: ```set snapshot_dir: '/opt/eggs/'```, but you can't use the following: /etc, /boot, /usr and /var.

**DISCLAIM:** using this new feature can be dangerous for your data:
* ```syncfrom``` replace all users homes and all servers homes with data from the luck-eggs-backup, Force this data in not appropriate system can easily end in a long disaster recovery;
* I want stress you again on the fact we are working with a **live filesystem** mounted binded to the **REAL filesystem**. This mean who removing a directory under the nest, usually ```/nest/ovarium/filesystem.squashfs```, mean remove it from the REAL filesystem. So, if something went wrong during the iso production and You remain with live filesystem again binded, the shortest way to solve the problem is simply reboot.

### eggs-9.0.15
--backup option: a new common command restore was added it will be be used inside krill (OK) or calamares (to do)

### eggs-9.0.14
--backup option: set minimun luks volume size to 128 MB; it's possible to move nest under /opt

### eggs-9.0.12
--backup option: save users and SERVERS datas in LUKS volume inside ISO, then can be restored by krill. 

### eggs-9.0.11
--backup option: users homes and configurations are saved in LUKS volume inside ISO, then restored by krill.

### eggs-9.0.10
From version 9.0.10, finally we can boot UEFI and standard BIOS.

### eggs-9.0.9
Great cleanup in the themes for isolinux and grub. The grub issue still remains to be solved. 

### eggs-9.0.8
Added LMDE5 elsie and a lot of work to solve UEFI problems. Not fixed yet, but you can boot setting root and prefix from grub rescue

### eggs-9.0.7
autologin and enabling desktop links on gnome

### eggs-9.0.6
Added Elemantary jolnir

### eggs-9.0.5
Added bash/zsh autocomplete, manpages and post_remove in manjaro, added zsh autocomplete in Debian families, updated oclif: removed sha, insert sudo

### eggs-9.0.3
Added linuxmint 20.3 una, added educaandos theme, bug fixex in gnome

### eggs-9.0.2
Just a little changement in splash boot and varius

### eggs-9.0.1
The first version of eggs fully functional on Debian, Devuan, Ubuntu and... Manjaro!!! And soon will come other distros of the Arch Linux family.

### eggs-9.0.0
* An Epiphany present! 

### eggs-9.0.0-BETA
* A Christmas present! 

A preview of eggs version 9.x! Even if the aspect remains substantially unchanged, internally a lot has changed: we have moved to node 16 and the new version of oclif. Everything has been done to create a way to manage even more distributions, not only Debian, Devuan, Ubuntu and derivatives, but also Fedora and Arch Linux. This version however does NOT yet include Fedora, nor Arch Linux, I have to solve the problems related to the use of dracut instead of initramfs-tools of Debian.

If you wand follow Penguins' eggs evolution, You can follow [Discussion](https://github.com/pieroproietti/penguins-eggs/discussions).

I wish You Merry Christmas and Happy New Year
