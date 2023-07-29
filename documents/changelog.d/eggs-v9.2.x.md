### eggs-9.2.8
* added ubunti 22.10 kinetic
* krill installer: Trying to solve a problem on mac-mini (T2 chip), I moved the grub installation to the end of the installation process itself, to still have the installation working even in case of an error.

### eggs-9.2.7
install:
* added flag --domain to pass domain for unattended installation, eg: ```sudo eggs install unrd penguins-eggs.net```
* added flag --none create a minimun swap partition of 256M
* rewrote routines autologin for sddm and lightdm. 

Note: to have autologin on the live your current used MUST to be configured with autologin.

### eggs-9.2.6
Mostly a stabilitation version, with same add:
* eggs install --unattanded --ip, added flag --ip, put hostname as ip-x-x-x-x. Example: ip 192.168.1.2 will have hostname ip-192-168-1-12
* swap 'small' size swap the same of RAM, swap 'suspend' size swap = 2 * RAM
* tested on: Debian: jessie, stretch, buster, bullseye, bookwork, Ubuntu bionic, focal, jammy, Devuan chimaera.

### eggs-9.2.5
```cuckoo``` since version **eggs-9.2.5**, 16 on **september 2022**, is capable to boot BIOS and UEFI machines via PXE on the LAN, however due to a bug in slim package, using sudo eggs cuckoo in dhcp-proxy version will not get UEFI machines to boot. Instead, use: sudo eggs cuckoo --real. 

__Warning__: using ``eggs cuckpp --real`` adds additional dhcp to the network, this may lead to problems or be prohibited by your organization,

### eggs-9.2.4
Added a new command: ```sudo eggs cuckoo```

This command launches a complete PXE server -automatically configured- that allows the ISO image to boot across the local network. It works directly from the live system by installing the dnsmasq and pxelinux packages. Its main limitation is the inability to operate in UEFI mode, but I decided to release it anyway to have it tested and to be able to start a new clean branch for the UEFI features planned for the next release. 

You can partecipate to discussion joining on [telegram channel](https://t.me/penguins_eggs).

### eggs-9.2.3
Introduced unattended installation: ```sudo eggs install --unattended```:
* values configured in /etc/penguins-eggs.d/krill.yaml are used both for unattended installation and as default values for standard installation;
* empty variables in in krill.yaml will take their value from the live system. Example: ```hostname = ''``` take the same hostname of the live;
* created a new module in krill: packages who take cure to add and remove packages during installation according on that specified on ```/etc/calamares/modules/packages.conf```;
* unattended install now wait 30 seconds, before to run without any prompt;
* bugfixes in module setKeyboard, autologin and others.

### eggs-9.2.2
* bugfix flag --release, actually passing release to produce correctly configurare calamares to remove penguins-eggs and itself from the installed system;
* removed same commands actually unusefull: eggs config and eggs remove (config is included in dad and remove fully became a problem of package manager).

### eggs-9.2.1
* produce: added flag --clone. 

Using this flag all user accounts and data will be included uncrypted on the live system and will be possible to install the live system with calamares or krill. 

Example:   '''sudo eggs produce --fast --clone```

You will get on live and installed exactly the same system you cloned.

### eggs-9.1.37
* penguins-oclif and perrisbrewery take now the same version number of eggs, in this cave 9.1.37. We solve the previous error, to read [more](https://github.com/oclif/core/issues/453)

It must work on archlinux, debian, devuan, manjaro, ubuntu and derivates.

### eggs-9.1.36 (*)
First version of eggs capable to remaster and install arch linux! I use mkinitcpio-archiso, but not archiso to implementet remaster of it. At the moment I just released a colibri version, without calamares - you must install with krill - if someone can and want help will be wonderfull and usefull: a unique tool to remaster and install Arch, Debian, Devuan, ManjaroLinux and Ubuntu plus the majority of derivates.

(*) This version was never released, due a problem arise woth oclif. I started to get a timeout error during krill installation and, it was terribly long to find the bug.

### eggs-9.1.35
refresh exclude.list from [resfratasnapshot](https://git.devuan.org/pieroproietti/refractasnapshot-base/src/branch/master/snapshot_exclude.list), this solve the delay in boot from live of bionic

### eggs-9.1.34
Arch: I started to try to use eggs against Arch Linux original, using archiso hooks, here is the [BUILDPKG](https://github.com/pieroproietti/penguins-eggs-archlinux). 


### eggs-9.1.33
* krill: all the methods of class krill-install, are now on individual files under modules. This is not a difference of beaviour, but was made in the hope to help peoples experts in calamares to try/use/collaborate in krill

### eggs-9.1.32
* krill: command install became krill
* krill: added autoconfiguration from internet for timezone;
* krill: now /etc/locale.gen seem to be OK on manjaro
* krill: command localectl set-keymap [map] in krill-sequence don't update /etc/default/keyboard, I tried to force that, but again don't work
* krill: as workaround it' possible to reconfigure keyboard after the installation
         
### eggs-9.1.31
* focal/jammy: removed in before_bootloader_contest.yml command apt-cd:
* manjaro: a lot of work on dependencies and package
* all distros: bugfix module calamares package.yml

### eggs-9.1.29
* nodejs: restart to use node v. 16.x to be compatible with Ubuntu bionic glibc.2.27 
* focal, bionic: rebuild naked CLI version for focal and bionic and added some species:
* manjaro: bug fix module packages.conf
* package: added lvm2 to dependencies
. distros: added linuxmint vanessa

### eggs-9.1.28
* calamares: renamed eggs-cleanup to cleanup; removed complete path to run sed in the script cleanup.sh, becouse a differents paths in Devuan and others

### eggs-9.1.27
* calamares: unified modules eggs-cleanup and remove-link on calamares module eggs-cleanup. This simplify a bit and let to check if /etc/issue and /etc/motd are not present.
* adapt: the link to adapt the monitor to the size of the VM now work alone work now without eggs.

### eggs-9.1.26
* localization: rewrote completely the way to get/edit locale.gen due a prolem with calamares installer

### eggs-9.1.25
* produce: flag --release now configure calamares to remove calamares. eggs and live* dependencies, bugfix enable links on desktop;
* calamares: renamed option --final to the more appropriate --release.

### eggs-9.1.24
* wardrobe wear: added flag --no_firmwares to skip firmwares installation in case we are wearing a costume for a VMs:  most of the cases during developing.

### eggs-9.1.23
* building eggs: thanks a little patch to [oclif](https://github.com/pieroproietti/penguins-oclif), we switched to [pnpm](https://github.com/pnpm/pnpm) in place of [npm](https://github.com/npm/cli) to build eggs, this reduce a lot times for compiling, no changes on the usage. At the same time we moved from nodejs 16.x to nodejs 18.x.

### eggs-9.1.22-1
* XDG: lightdm configuration
* exclusion: added /etc/initramfs-tools/conf.d/resume to exclude.list

### eggs-9.1.21-1
* wardrobe: introduced try_accessories. If an accessory is not compatible with your system wardrobe will emit a warning and continue but for try_accessory the process will continue without any warning. This let to build universal accessories like liquorix, valid for all the varius distros. Consult accessories/liquorix in [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe).

### eggs-9.1.20-1
* wardrobe: if a costume is not compatible with the system, wardrobe will end immidiatly, but if an accesory is not compatible with the system wardrobe will emit a warning and skip it going to the next, the same if an accessory will be not found.

### eggs-9.1.19-1
* wardrobe: all the packages are now filtered if they are availables on the repository. If a package is in sections: dependencies, packages or packages_not_install_recommend wardrobe will emit a warning, if the package is listed in sections: try_packages or try_packages_not_install_recommend wardrobe will skip it and just continue.

### eggs-9.1.18-1
* wardrobe: instroduced new sections: try_packages and try_packages_no_install_recommends on costumes;
* calamares: align calamares configurations files to [calamares_settings_debian](https://salsa.debian.org/live-team/calamares-settings-debian).

### eggs-9.1.17-1
calamares: align calamares configurations files to Ubuntu 22.04 jammy [calamares_settings_lubuntu](https://github.com/lubuntu-team/calamares-settings-ubuntu), this solve the network issue [122](https://github.com/pieroproietti/penguins-eggs/issues/122)

### eggs-9.1.16-1
* wardrobe: changed the way to get SUDO_USER this fix a bug finding ~/.wardrobe in Ubuntu
* wardrobe: wardrobe now install debs depending on the distro, this made possible to have an unique costume/accessory for more distros. Example: we have now just an accessory for waydroid not three differents versions (bullseye, bookworm, jammy). 

### eggs-9.1.15-1
* wardrobe: the configuration scripts of the various: gdm3, lightdm, sddm are now common to all costumes.

### eggs-9.1.14-1
I made some modifications in the way to build eggs, trying to reduce the times of compiling it:
* using [verdaccio](https://verdaccio.org/) private proxy registry;
* replacing npm with [pnpm](https://pnpm.io/) as package manager.

### eggs-9.1.13-1
* gdm3 autologin in live for Debian/Devuan fix

### eggs-9.1.12-1
* wardrobe: removing sources.list control on Ubuntu (use different schema) and testing a lot with Ubuntu 22.04. I did'nt find clean way to get a clean Ubuntu 22.04 CLI only installation as I do with Debian/Devuan,  tryed with Ubuntu server edition minumun and stardard installation, but always there are delay on start of the iso due a wait for networking.

### eggs-9.1.11-1
* wardrobe: added servers section to wardrobe and a samba sample
* commands: removed command bro, removed all command aliases to reduce confusion, re-estabilish warming if a command need to be called with sudo

### eggs-9.1.9-1
* wardrobe: add prefix costumes/ to COSTUME if not specified costumes/ or accessories/ in ironing, show and wear;
* bugfix: wardrobe verions 9.1.8 due a bug don't find accessories.

### eggs-9.1.8-1
wardrobe: the syntax of the wardrobe commands has been modified: in particular the costume flag has been removed and the COSTUME is passed as argument of the command. The default wardrobe is now saved in ~/.wardrobe. Costumes are now included in the wardrobe costumes directory, this creates a better organization of the wardrobe. We are near to be stable.

### eggs-9.1.7-1
* installers: A new idea it's taking form, using wardrobe I added the nice Linuxmint LMDE installer to same custom version - mostly bullseye and chimaera and the result was positive. So now we have 3 different installation possibilities for our iso: krill for CLI systems, live-installer and calamares for GUI systems.

### eggs-9.1.6-1
* bugfix and a new idea

### eggs-9.1.5-1
* wardrobe: try 5 times if apt-get install fail before to exit. Tested against colibri, owl and eagle, the remain problem it's just desktop background.

### eggs-9.1.4-1
* wardrobe: a bit restructured in costumes definitions, look costume colibri for more details and reference

### eggs-9.1.3-1
* changed eggs info, tested wardrobe with owl and 5.17.0-1.2-liquorix-amd64 kernel, plus the usual bunch of fixes and enhancements

### eggs-9.1.2-1
* changed definition of sourcesList in costumes, now a simple string []
* added command eggs wardrobe get to get the wardobe. --repo https://github.com/pieroproietti/penguins-wardrobe
* update command mom adding wardrobe commands
* added default to wardrobe commands: ironing, list, show, wear. Default --wardrobe ./penguins-wardrobe --costume colibri 
* removed npm package pjson and class basket not more necessaries
* update autocomplete scripts and man page

### eggs-9.1.1-1
* wardrobe: added distributions, as an array of [bullseye, bookworn, chimaera, etc] to limit usage of costumes ans accessories just on the appropriate distros.

### eggs-9.1.0-1

A breacking news!

* wardrobe: after a bit of consolidation, I moved the suddivision of firmwares from the code to the wardrobe organization. ```firmwares``` now is a accessory with same own internal accessories. 
* accessories: now accessories can be external and internal. Internal accessories live inside the costume, for example  inside firmwares live codecs, network-cable and so on. Internal accessories have suffix: ```./```: ```./codecs```, ```./network-cable```, etc.
* If you open ```wardrobe.d/accessories/firmwares```, you can find inside: codecs, network-cable, printers, video-nvidia, network-wifi, video-amd and ou are free to add others. 

This result in a great semplification of code and a improved organization. Just adding others firmware categories inside firmwares - such graphics-tables - add an index.yml with the packages you needs; note: if your packages need a specific repo, you can add it too. Add your new accessory on index.yml of firmares and eggs will load it, add the request repos then install yours packages.

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
