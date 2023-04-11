penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguins' eggs Debian package

Usually the last version is the right one. Detailed instrunctions for usage are published on the [Penguins' eggs book](https://penguins-eggs.net/book). 
You can follow the project also consulting the [commit history](https://github.com/pieroproietti/penguins-eggs/commits/master). 

## Changelog [deprecated] versions 
Versions are listed on reverse order, the first is the last one.

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

### eggs-8.17-15
* changement in --backup option and check it work, producing encrypted backup and restorings

### eggs-8.17-14
* refactoring and stabilization, added messages in issue and motd and remove then with calamares and krill

### eggs-8.17-13
* added calamares configuration no-display-manager, removed live-config and live-config-systemd in Debian bullseye, Devuan chimaera, Ubuntu focal and next

I must to check if removing live-config and live-config-systemd bring problems and check if it is possible to remove it in buster, and previous versions

### eggs-8.17-12
* added kali-rolling, added cli-autologin Devuan (sysvinit)

### eggs-8.17-11
* added Devuan daedalus, bugfix tools:stat, removed apt in favor of apt-get.

Hard tested on all Debian version from jessie to bookworm, i386 and amd64, installable with calamares or krill installers

### eggs-8.17-10
* added Devuan chimaera

I also cleaned the templates of the distros removing bullseye as it was just a copy of buster

### eggs-8.17-9
* removed npm package and localization, bugfixes in command eggs remove --autoremove

### eggs-8.17-8
* restored bionic compatubility

I worked in pacman: rewrote pacman.packages() for installation than removal.

### eggs-8.17-7
* live-config was reintroduced in package dependencies

I worked in pacman.links4Debs trying to reorder the code. Inserted in eggs config the display of the type of eggs package in use, corrected the isDebPackage(), isNpmPackage() functions in pacman. live-config is not taken because it's part of the version dependencies (bionic doesn't want it - but I should check)

### eggs-8.17-6
* added Debian 12 bookworm

Actually bullseye take all configuration from buster, simply a bit

### eggs-8.17-5
* added Ubuntu 22.04 jammy, paths to templates 

I modified in class ovary paths to templates from /usr/lib/penguins-eggs/conf/distros to right path /etc/penguins-eggs.d/distros. 

This can impact in many cases becouse most configurations distros are just a directory filled with links to buster or focal made from class pacman during installation

### eggs-8.17-4
* calamaresPolicies moved to Pacman, now eggs config configures calamares policies too

### eggs-8.17-3
* removed https check in axios.get(), it was generating error despite hpps://penguins-eggs.net certificate is correct

### eggs-8.17-2
* added ubuntu umpish in the list of compatible distros

### eggs-8.17-1
* building hen a debian bullseye xfce liveCD installable with all the necessary to build eggs from sources. 

### eggs-8.17-0 
* I toke version 8.0.28 and rebuild it to be compatible with node8.17. Actually it run in bullseye too, but We must to rebuild the changement from 8.0.30 to t.1.4

## eggs-8.1.4
* reset prefix if you choose --basename YourName you will get YourName-amd64_2021-08-13_1031.iso

### eggs-8.1.3
* calamares now, will be always enabled with no password if it is installed by eggs calamares --install or eggs config

### eggs-8.1.2
* MX21: they have so good mx-snapshot and mx-installer. I just want play with it and tried remastering it with eggs, install with krill, calamares and minstall! So, I'm starting to support mx-installer as calamares light alternative.

### eggs-8.1.1
* note: same as versione 8.1.0 but using node10, to solve the problem in 8.1.0 version 

### eggs-8.1.0 retired
* bugfix: eggs tools:clean don't remove more /var/lib/apt/list, where was a problem with mintupdate ((in this version due a problem with node8, krill and eggs info was not working)

### eggs-8.0.30
* bugfix: krill installer: eggs install now support installation on UEFI systems

### eggs-8.0.28
* backup adapt luks encrypted volume to user's data size. Working on standard and full encrypted filesystem systems

### eggs-8.0.27
* rewrite/refactor pacman and perrisbrewery using new common dependencies.ts introduced now (article on the blog)

### eggs-8.0.26
* eggs produce --backup working with luks: all users accounts and their home are saved in crypted volume. bugfix postrm. I added cryptsetup to the dependencies, so you will be forced to use sudo apt install -f to install eggs

### eggs-8.0.24 retired
* partial rewrite in perrisbrewery due a problem from same version 8.0.18 - 8.0.23. I hope it is solved, but need confirm. It was a bug in the postrm script corrected in eggs-8.0.26 version

### eggs-8.0.22 retired
* just same refactoring and removed last ; in krill_prepare networking dns

### eggs-8.0.20 retired
* added domain and dns network configuration in krill

### eggs-8.0.19 retired
* live user is now created also for backups, iso volid became just basename, no limitations on name of isos

### eggs-8.0.18
* krill finally support network configuration

### eggs-8.0.16
* creating a backup produce ISO prefixed by "backup-" not "egg-of-", eggs export:iso include now --backup option too

### eggs-8.0.15
* krill finally support keyboard configuration

### eggs-8.0.14
* re added rsync, after unsquashfs, to let modifications in live to be reflected in the installed system

### eggs-8.0.13
* now we are using unsquashfs during the unpacking phase in cli krill installer

### eggs-8.0.12
* we are using cfonts simple for titles, removed package figlet

### eggs-8.0.11
* added progress bar during unpacking phase in cli krill installer

### eggs-8.0.10
* added linuxmint 20.3 uma

### eggs-8.0.9
* sudo eggs calamares --install now install and configure calamares to run without asking for password

### eggs-8.0.8
* added --backup to produce: to save users datas, eggs install ok in debian and ubuntu

### eggs-8.0.7
* added syslinux-common to dependencies, thanx to aravind@stmdocs.in, uefi installation tested and working amd64

### eggs-8.0.6
* finished restucturation to include arm. Now we need two things: adapt krill installer to UEFI and finally make UEFI for arm. 

### eggs-8.0.5
* added eggsArch and machineArch to respect rasberry-desktop-i386 but with kernel amd64

### eggs-8.0.4
* added arm64 package and started test on arm64 and armel architectures.
eggs will run on armel and arm64 architecture, but we need to generate a new UEFI section for this builds.

### eggs-8.0.3
* cleaning and testing krill: uefi down in bullseye, ok buster and probably others versions

### eggs-8.0.2
* after two years we resolve a bug in eggs old more than two years, now I'm using mkinitramfs and NOT update-initramfs -u 

### eggs-8.0.1
* test on bullseye with and without calamares

### eggs-8.0.0 
* krill installer come now with eggs. 

### eggs-7.8.50
* more steps to krill, eggs now produce configuration for krill or calamares in all the distro/version

### eggs-7.8.49
* a step more to krill: configuration for jessie and stretch. More modern versions use same configuration of calamares.

### eggs-7.8.48
* remove unused dependencies, announcing krill installer for CLI version

### eggs-7.8.47
* added Ubuntu hirsute (Ubuntu 20.04) to compatibily list

### eggs-7.8.46
* checking and rewriting eggs tools:skel.

### eggs-7.8.45
* think a plan to rewrite eggs CLI installer

### eggs-7.8.44
* added theme neon, revisited theme eggs

### eggs-7.8.43
* select between zstd/lz4/gzip for fast compression. In produce we have --release in place of --final (add max compression and sterilize)

### eggs-7.8.42
* eggs clean diversion in calamares before remove, bugfix in eggs calamares --remove and --install. Added --addons in produce, take place of --adapt, --pve

### eggs-7.8.41
* removed drivelist package from eggs, jessie now work with the mainstrem eggs, removed xterm from dependencies

### eggs-7.8.40
* zstd -Xcompression-level 1 take place of lz4 in fast compression, others adpment for jessie.

### eggs-7.8.39
* added possibility to customize default partition in theme: openos will have btrfs as default

### eggs-7.8.38
* working in cli installer

### eggs-7.8.37
* added livecd theme for ufficiozero, check option --final in produce and calamares

### eggs-7.8.36
* added livecd theme for openos, added full name on the livecd boot and in installed system boot

### eggs-7.8.35
* adaptment to mx linux, machine-id, grub-efi-amd64-bin in place of grub-efi-amd64 in Utils.isUEFI(). Perhaps we must test also grub-efi-i386-bin for i386?

### eggs-7.8.34
* added .disk folder in iso with info, mkiso, etc. added version in calamares, isGui, and others

### eggs-7.8.31
* bugfixes: check the presence of vmlinuz and initrd_img else stop, codenameLikeId in rootTemplate of calamares (deprecated)

### eggs-7.8.30
* rewrite of distros.ts class: cleanup and reorganization

### eggs-7.8.29
* eggs mom change in accord with new commands and flags

### eggs-7.8.28
* postinst just alert for the absense of calamares in GUI systems during eggs installation. show.qml fix presentation

### eggs-7.8.27
* removed the compression filter by processor for ia64, added for ARM

### eggs-7.8.26
* bufixes and compression filter by processor

### eggs-7.8.25
* eggs ask for calamares if it is not installed, fixes in themes eggs and openos

### eggs-7.8.24
* added theme openos from Sebastien <admi.openos.neon@gmail.com>

### eggs-7.8.23
* patch for remove //@ in path btrfs, moved vmlinuz and initrd_img configurations in eggs.yml

### eggs-7.8.22
* apt remove and apt purge working, sddb bugfix, calamares show revisited

### eggs-7.8.20
* all bugfix sddm desktop manages, npm package bugfixes

### eggs-7.8.18
* cleaning and extending pre e post installations, man, npm package, etc

### eggs-7.8.15
* add filter for arch in export:iso

### eggs-7.8.14
* added siduction to supported distros, aka: seduct from siduction!

### eggs-7.8.13
* modified pre e post install scripts and added check presence directory man1   and bash_completion.d. 

### eggs-7.8.12
* added cli-autologin in naked live versions. 

### eggs-7.8.11
* removed unused commands: initrd, pve and sanitize. New version eggs.1 man and eggs.1.html

### eggs-7.8.10
* perrisbrewey: just a step in the brewery and preinst, postinst, prerm e postrm are all ready!

### eggs-7.7.33
* added display user and password on liveCD. Most prerequisites packages are now as dependecies

### eggs-7.7.32
* bugfix add autocomplete in i386. Added control, preinst, postinst, prerm, postrm in deb packages 

### eggs-7.7.31
* bugfix export:iso, I hope definitive!

### eggs-7.7.30
* bugfix export:iso, changed locales array to user configuration plus en_US.UTF8.

### eggs-7.7.29
* workaround to solve problems compatility oclif-plugings with node8, actually all commands works on i386, except autocomplete and command-not-found.

### eggs-7.7.28
* added --prefix in produce, mom get you original manual and translations at your fingertips

### eggs-7.7.27
* eggs init in place of prerequisites. The new version will install man and aucomplete. Sorry, due nodejs version, I forced to remove i386 version.

### eggs-7.7.24
* mom now only cli version. update all dependecies except js-yaml 3.14.1 - 4.0.0, but node8 don't work.

### eggs-7.7.23
* mom execute mom-cli if zenity is not present. hostname fixed in hatching

### eggs-7.7.21
* bugfix eggs.yaml, refactoring settings. Now we have theme saved in dad, and others vars are possible

### eggs-7.7.18
* added Linux Mint 20.1 ulyssa 

### eggs-7.7.17
* resolved bug #38 mancata rimozione yolk.list e mancata creazione di machine-id

### eggs-7.7.16
* little bug fix in mom and mom-cli to let install and use of man

### eggs-7.7.15
* added command eggs tools:man. Install/remove man pages for eggs

### eggs-7.7.9
* install system without internet update, just yolk

### eggs-7.7.8
* cleaning and bug fixes

### eggs-7.7.7
* added command dad, expanded mom both gui/cli helpers for reproductive eggs!

### eggs-7.7.6 deprecated
* added command mom, a gui/cli helper for reproductive eggs!

### eggs-7.7.5.1_deb deprecated
* bugfix in bullseye and deepin to not confuse versions

### eggs-7.7.4.1_deb deprecated
* added guadalinex theme

### eggs-7.7.3.1_deb deprecated
* fixed annoying bug in option safe booting from livecd

### eggs-7.7.0.1_deb deprecated
* added autocomplete bash

### eggs-7.6.88.1_deb deprecated
* changing and fixes in devuan beowulf, ubuntu focal, Ubuntu groovy

### eggs-7.6.86.1_deb deprecated
* changed commands prerequisites and renamed sterilize as remove, added different flags.

### eggs-7.6.85.1_deb deprecated
* changing the configuration. I suggest to remove the old configuration dir before to use: 
  * sudo rm /etc/penguins-eggs.d -rf
  * sudo eggs prerequisites
* updated cli installer, new defailt address, gateway, dns, etc. 
* introduced experimental pve-live.service.

### eggs-7.6.83.1_deb deprecated
* reintroduced armel arch; info now show running mode

### eggs-7.6.82.1_deb deprecated
* fix gdm3 displaymanager in calamares configuration, export deb armel

### eggs-7.6.81.1_deb deprecated
* restored debian theme for calamares, check install-debian, clean flags usage in export

### eggs-7.6.80.1_deb deprecated
* displays the command flags

### eggs-7.6.79.1_deb deprecated
* mx-installer starting to work (experimental)

### eggs-7.6.78.1_deb deprecated
* solved permissions problems in /tmp, mxlinux now install with calamares, trying to become mx-installer compatible.

### eggs-7.6.77.1_deb deprecated
* select vmlinuz and initrd.img version from cmdline del kernel

### eggs-7.6.76.1_deb deprecated
* introducing basket update, removed documents from packages.

### eggs-7.6.73.1_deb deprecated
* finishing touches in update: show sources and versions.

### eggs-7.6.72.1_deb deprecated
* changes for site, readme, terminal session and so on.

### eggs-7.6.71.1_deb deprecated
* just a little hack for the vmlinuz link in proxmox-ve.

### eggs-7.6.70.1_deb deprecated
* finally eggs is again able to remaster and install the naked version (without graphical interface) of your system.

### eggs-7.6.65.1_deb deprecated
* update -i show the last 4 versions ordered and select the correct architecture; check presence of dpkg-packages before to run yolk

### eggs-7.6.63.1_deb deprecated
* remake configuration of calamares for bullseye, be careful with lsb_release in bullseye otherwise UEFI boot will not work

### eggs-7.6.62.1_deb deprecated
* changed the way to work of ovary, put /boot, /etc, /usr, /var in overlayfs, create /home just like a normal directory who is not deleted, until kill

### eggs-7.6.61.1_deb deprecated
* exclude yolk from copy, cleaning tools.yaml using settings from eggs.

### eggs-7.6.60.1_deb deprecated
* improvement:  if you installed eggs as debian package, you can now update it with sudo eggs update -i.

### eggs-7.6.57.1_deb deprecated
* improvment: added Ubuntu groovy to the supported versions. Remain same trouble with displaymanager - actually disabled - and the link in the desktop are non able to be executed before to click right key on the mouse and click on let to execute.

### eggs-7.6.56.1_deb deprecated
* bugfix: added apt install -y --allow-unauthenticated shim-signed in focal and reintroduced download shim-signed e dependecies in yolk;

### eggs-7.6.55.1_deb deprecated
* bugfix: from test I saw who it is not possible to install shim-signed from yolk, perhaps becouse yolk is not signed? I  removed it to not impact with others distros;

* focal will not install without internet connection on UEFI.

I removed 

### eggs-7.6.54.1_deb deprecated
* bugfix: LMDE debbie don't start using it's name in EFI, so eggs change bootloaderEntryName=Debian for
this distro;

* bugfix: added shim-signed to the packages of local repository yolk. 


### eggs-7.6.53.1_deb deprecated
* tested on: buster/beowulf/bionic/focal
* distro tested: Debian buster amd64, Devuan beowulf i386/amd64, Linux Mint 19.3 amd64, Linux Mint ulyana amd64, LMDE debbie amd64.

### eggs-7.6.52.1_deb deprecated
improvment: added in eggs fuctions who was before in penguins-tools. Don't get worried, are mostly for developers!
Here we are:
* export:deb export debian packages (only for developers)
* export:docs export documentation (only developers)
* export:iso exporting iso image created via scp in accord with configuration in /etc/penguins-eggs.d/tools.yaml

improvment. Introducing a tools command to reach the following commands, part of them was present before, other addedd:
* tools:clean like previous eggs clean

* tools:initrd sperimental. Edit initrd to remove resume and crypto from inird on the ISO

* tools:locales like previous eggs clean

* tools:sanitize clear all the stuffs created from eggs (calamares configurations. script, etc)

* tools:skel like previous eggs skel

* tools:yolk like previous eggs

improvment. Now yolk check better the dependences for the local repository and is possible, for example
to create an ISO form a Bios installation and install it on a UEFI machine, without need to be on line
during the installation.

Yolk is created automatically during the produce, but if the repository exists then produce will
use the previous version. 

You can, of course, recreate yolk repository in /var/local/yolk giving command: sudo eggs tools:yolk, or - short way - add flag -y in produce.

bugfix: Devuan don't start using it's name in EFI, so eggs change bootloaderEntryName=Debian for
this distro.

book: soon we will align the italian book with this new edition.

### eggs-7.6.50.1_.deb deprecated
bugfix: just an await before the call yolk.create()... It worked the same, but with a better output.

### eggs-7.6.49.1_.deb
One user pointed out to me an annoying problem with eggs, the impossibility of installation in the absence of internet.

After studying it, I am proud to present yolk, a very small local repository, responsible for making it possible to install the system in the absence of internet. 

There are no changes in the way to use the eggs but, during the production process, a small repo is created in /var/local/yolk, and the related calamares modules are built to add this local repo to the apt sources. 

Yolk is very little, about 2.1 MB and contains only the following packages: grub-pc, grub-pc-bin, cryptsetup, keyutils, grub-efi-amd64 and rub-efi-amd64-bin. 

After installation yolk is removed from apt sources.

### eggs-7.6.48.1_.deb deprecated
* rewrote of the commands prerequisites and sterilize, they now try to explain better that  will happen behind the scenes, during their use. It remain the possibility to see all via --verbose flag.

### eggs-7.6.47.1_.deb deprecated
* added a beutifull new theme for ufficiozero thanx to Julian Del Vecchio.

### eggs-7.6.46.1_.deb deprecated
* changed flags in produce and calamares. just added flag --final to make the final version of your project: all the packages relative to the "reproduction"  will be removed during the installation with the gui installer;
* module packages in calamares now work in accord with the flag --final, if present will build the remove section in packages.conf (you can check this file in /etc/calamares/modules) if not, only section try-install will be build. This section is ideal for international packages, languages, etc.

### eggs-7.44.1_.deb deprecated
* buxfix: there was a little problem with links in the previus version.

### eggs-7.6.43.1_.deb deprecated
* improvement: patch per bionic in calamares module grubcf, added check plymouth from successive version of calamares (in bionic calamares is quite old and not mantained);
* improvment: actually is possible to use directly produce after the installation, eggs will propose the necessary operations to install prerequisites, calamares and so on;
* bugfix: the previous version I put distro.codenameId as productName in calamares, but due the fact who was used ad EFI name too, Debian refuse to boot. So I changed in branding.ts the line bootloaderEntryName=productName to bootloaderEntryName = distro.distroId.

### eggs-7.6.42.1_.deb deprecated
* removed open-infrastructure-system-config dependencies from ubuntu bionic. 

### eggs-7.6.41._1.deb
* using mustache for templates (grub, isolinux, locale.gen, locale);
* check exist links to distros in new installation or update;
* removed clean from packman and using clean from bleach, removing all apt space used;
* made new isolinux and grub.cfg for bionic and focal, with languages
* actualy eggs produce a boot menu, with the first item language host, submenu languages and menu safe.

### eggs-7.6.40._1.deb deprecated
* beowulf, bionic, buster, focal buxfixes in yml configurazion of calamares:
* added bullseye as supported distros;
* rewrite command kill with new class settings, and removed flag --umount;
* added - but not yet activated - new class initrd to configurare resume and crypto in the live initrd.img
* changed the way eggs work, not remove prerequisites. Added --sterilize flag in produce and calamares, if yuo want to remove them.
* hard tested on beowulf, bionic, buster, focal the reproductive system: produce, install, modify, produce, and so on.

### eggs-7.6.39_1.deb deprecated
* bugfix su bionic - thanx to Adriano Morselli

### eggs-7.6.38_1.deb deprecated
* focal bugfix in packages.conf, don't let to remove packages;
* all calamares packages.conf, try_install libreoffice-help-l10n-$LOCALE, firefox-esr-$LOCALE, thunderbird-locale-$LOCALE etc (give feedback for addictions);

### eggs-7.6.37_1.deb deprecated
* simplified calamares configuration, all the work now is on fisherman class;
* revisited completely the way to build links for the various user case (sources, npm or package deb);
* added slim to desktop managers for autologin in live;
* tested on UfficioZero Linux Roma (beowulf i386), Linux Mint tricia 19.3 i386, UfficioZero Tropea (focal x86_64), Debian buster x86_64.

### eggs-7.6.36_1.deb deprecated
During the creation tests made by UfficioZero, a serious error was found in the generated debian packages: eggs-7.6.35-amd64 and eggs-7.6.35-i386.deb.

This error is due to the fact that debian packaging made with oclif-dev does not keep the symbolic links, so a later version was made, in which these links are created when installing the prerequisites.

The current deb version, was tested on UfficioZero Roma (Devuan beowulf() i386 and UfficioZero Tropea (Linux Mint ulyana/Ubuntu focal).

### eggs-7.6.35_1.deb deprecated
OK, now we are pointing to internationalization and customization. 

Is changed the configuration file and its position

/etc/penguins-eggs.yaml  -> /etc/penguins-eggs.d/eggs.yaml

In /etc/penguins-eggs.d you will find a README.md, a tools.yaml, and two links:

/etc/penguins-eggs.d/addons
/etc/penguins-eggs.d/distros

Read /etc/penguins-eggs.d/README.md for more specific usage and mean.


### eggs-7.6.34_1.deb deprecated
This is an important version, in which a lot of work is completed, the reasons are the following:

* Just finished the rewriting work. Well now we have officially Debian buster, Devual beowulf, Ubuntu focal and 
Ubuntu bionic fully supported, both for standard BIOS installation and UEFI installation, both on i386 and 
amd64 architecture.

* Of course it follows that other derived distros can also be easily remastered: Linux Mint 20.20, Linux Mint 19.3, etc. 

* I also tried Deepin 20, which works perfectly, but only on standard BIOS machines.

### eggs-7.6.33_1.deb deprecated
I made a rethinking and rewriting of the part of eggs who work with calamares. Before I build the configuration completely with code
now I choose to use directly yaml files ed use them as template. Well, was hard - test alla on buster, focal, devuan and bionic 
it's a big question but, finally we have a a great result:
* eggs now work in UEFI with ubuntu focal

### eggs-7.6.28_1.deb
* created /etc/xdg/autostart/penguins-links.desktop to build links on the desktop on live and new users, due the localization;
* create a module in calamares to remove installation link;
* on lxde, now we create links in different schema to be compatible with it, except for installer;
* tested on cinnamon, lxde in Debian, Devuan

### eggs-7.6.22_1.deb deprecated
Introduced command locales, install and clean all the locale not necessary, leaving only the defined ones.

### eggs-7.6.20_1.deb deprecated
Finally localisation start to work, your system can boot live in different languages [issue #34](https://github.com/pieroproietti/penguins-eggs/issues/34)

### eggs-7.6.18_1.deb deprecated
Cleanig configuration, writings [issues](https://github.com/pieroproietti/penguins-eggs/issues) and trying to solve. 

### eggs-7.6.14_1.deb deprecated
Fixed bug that prevented grub from loading the kernel and initrd.img from the iso image. The error was only detectable on UEFI machines.

### eggs-7.6.13_1.deb deprecated
Revisited the creation of the liveCD boot for standard and UEFI machines. Fixed the safe option in the isolinux menu and in the grub menu.

### eggs-7.6.12_1.deb deprecated
This is a version mosty rethink and bug fixes. eggs calamares now work as prerequisites, alone install and configure calamares, calamares -c only configuration.
I changed also few flags in produce, with the idea to not have _ in them. So proxmox_ve became ve, remote_assistance becamo rassistance, etc. I changed something
in calamares modules too, to get the flag theme. The next versione will be a bugfixes too, I need to check why disappered in the boot from iso the option safe.

### eggs-7.6.11_1.deb deprecated
Bux fix for Devuan beowolf support, minor errors remain to fix wicd, but I'm sure some users will segnale it. Currently eggs supports and has been tested on Debian, Ubuntu and Devuan

### eggs-7.6.0-10 deprecated
Bug fix for Devuan, now in beowulf We can build iso and start it. To login go to console and sudo startx.

### eggs-7.6.0-9 deprecated
Bug fix for produce flag --installer_choice and --dwagent now working. First implementaion addon for proxmox_ve.

### eggs-7.6.0-7 deprecated
I write here changement in the last few and short time versions, after the last cleaning and reorder. Now You can customize eggs with your theme, or add some particular aspect. Look in /addons or ask to the author for more informations.

* eggs adjust became eggs adapt (to adapt video resolution in VM);
* check for /etc/skel/Desktop, if exist eggs don't translate Desktop folder;
* removed, at moment, flag for addons but not it's implementation. (probably we will back again, but at the moment the flag is unusefull);
* removed flag assistant and rewrote it as install-choice to let to chosen beetwen cli or calamares installation;
* created flag --theme for theming eggs installtion with calamares;
* created addons to let vendors to build specific addon to customize eggs.

### eggs-7.6.0-1 deprecated
Continuing the collaboration with ufficiozero.org, we closed an important bug in Ubuntu and derived: after installation, the resolution of dns addresses was missing. Currently the network works correctly with Debian Buster, Ubuntu focal, Ubuntu cosmic and Ubuntu bionic, Linux mint 20.20, Linux mint 19.3

### eggs-7.5.139-1 deprecated
During some attempts to collaborate in order to get a remastering of Linux Mint, we discovered and fixed the following bugs:
* Bug fix for custom live user configuration. Now you can actually use any live CD user name and password by configuring it in /etc/penguins-eggs.yaml
* bug fix for ubuntu focal and ubuntu bionic, calamares was not configured to delete the live CD user.
Thanx to Adriano Morselli developer at ufficiozero.org for the segnalation.


### eggs-7.5.132-1 deprecated
This morning I noticed with surprise that all the versions made with eggs-7.5.130-1 loaded on sourceforge, were affected by a serious problem: the user created was not part of the sudo group. After some investigation I discovered that it was due to a typing error in the focal.ts, bionic.ts and buster.ts modules that create the configuration for calamari. Instead of writing defaultGroups I had written defaultGroups and of course it is not the same! This version fixes the problem, I am reloading the images and packages.

### eggs-7.5.130-1 deprecated
eggs now completely support - remaster the system and use GUI installer calamares - for:
* Debian 10 Buster (i386/amd64)
* Ubuntu 20.04 Focal (amd64)
* Linuxmint 20 ulyana (amd64)
* Linuxmint 19.3 tria (i386/amd64)
* Lubuntu 18.04 (i386/amd64)
* Ubuntu 18.04 bionic (i386/amd64)

You will find new examples of the ISOs on [Penguins' eggs sourceforge](https://sourceforge.net/projects/penguins-eggs/files/iso/)


### eggs-7.5.129-1 deprecated
Well, the big moment has arrived: 

eggs now allows you to remaster the system and use calamares for installation on:
* Linuxmint 20 ulyana
* Ubuntu 20.04 Focal
* Debian 10 Buster and derivatives.
Other versions can of course be remastered, but without the possibility of using calamares with installer.
I would like to push compatibility up to Linuixmint 19.3 tricia for the possibility of a robust i386 distro included.
Unfortunately, neither Ubuntu nor Linuxmint are releasing the new versions on i386 architecture.


### eggs-7.5.126-1 deprecated
work in progress to adapt our script to work with calamares installer in Ubuntu focal and Linux mint.
Calamares again don't work in ubuntu and Mint, but thanx to big refactoring is more simple to adapt it:
* abbreviated writing of calamares-modules in buster
* created focal from buster, added instances, shellprocess, contextualprocess and scripts from lubuntu
* rewritten most of the buster modules, only packages and displaymanager remain
* created buster from previuos script

### eggs-7.5.124-1 deprecated
eggs compatible again with node14 and node8.

* eggs compatible again with node14 and node8;
* the versions for i386 and for amd64 start from the same code, but are spelled with node8 or node14 respectively;
* it is therefore possible. use the version of node present on the system;
* the structure of calamares has been modified to adapt it to the need to insert different setting versions, one for each distribution.

### eggs-7.5.122-1 deprecated
Sometimes, to move forward, you need to step back first.

Well, in order not to miss the opportunity to have debian packages for both the i386 and amd64 architecture, I chose to go back to the old Node8, the latest version released by nodesource for both architectures.

The main change in this version is, of course, the presence of the i386 version, which can be a good opportunity for all people with old hardware combined with young will to experiment with them.

But not only!

Now the various READMEs, links, etc point to the new site https://penguins-eggs.net. 

Come in here for more informations.


### eggs-7.5.110-1
Here we are, I was looking for a solution to facilitate myself in the work of adapting Ubuntu and Deepin to calamares and, trafficking with this, as often happens a new idea came up:

- flag --dry (shord "d")

Eggs, from this version, in addition to being able to directly generate the ISO, can be used with the --dry option which instead generates the structure and scripts necessary to complete the work. And, neither creating the filesystem.squasfs nor the iso image is obviously instantaneous. However, scripts are generated, which therefore allow the user to bind and ubind the live filesystem, its compression and the generation of the ISO.
- introduct in ```eggs produce``` the flag --dry. Eggs run without produce not squashfs, nor iso image, but creating same scripts: bind, ubind, mksquashfs and  mkiso to let you to change your live filesystem and your iso filesystem before to package it.

Of course, besides being able to work in the live filesystem and in the iso folder, you can also change all the compression, generation, etc. parameters.

- introduced the --dry operation without the production of the iso but only the scripts necessary for it;
- included in the ovary, in addition to the necessary scripts, a short explanatory README.md.


### eggs-7.5.100-1
One hundred is a round figure, plus something has been done.

I worked a lot on the cli installer built into eggs, the work started with the idea of adding formatting LVM2 for Proxmox VE, but also continued with the intention - I hope successful - to make it more easily usable.

At the moment Ubuntu focal and the various derivatives (Linux Mint included) they can be installed ONLY with the cli-installer, while for Debian buster and LMDE4 are recommended to use the installer Calamares.

ATTENTION: the use of the eggs cli installer is still from ONLY for experts if you erase the disc.

- link on the desktop for cli-installer or calamares depending on the presence of the latter;

- desktop link for eggs adjust only for Desktop managers that do not resize the monitor if it is enlarged on the virtual machines (LXDE, LXQT, XFCE and Mate). Obviously the effect is visible only when using virtual machines with the integration tools installed, for example: spice-vdagent for KVM.

- removed the enabling of the desktop links on gnome (some problems related to the use of the gio command that requires the mounting of / dev also in the construction phase of the iso remain to be solved. but it remains busy. (If anyone has same suggestions ...)

- Bem-vindo aos novos amigos brasileiros, teremos que pensar em uma internacionalização do pacote.

- Welcome to the new Brazilian friends, sooner or later we will have to think about an internationalization of the package.

- Benvenuto ai nuovi amici brasiliani, bisognerà prima o poi pensare ad una internazionalizzazione del pacchetto.



### eggs  7.5.86

- modified the call to xorriso, trying to make it analogous to systemback (according to the suggestions of Franco Conidi);

- reimported - and corrected - the utils from tools;

- cleaning of makeIsoImage () in ovary;

- copy of the utils in penguins-tools, to standardize the tools;

- various cleaning of the code.


### 7.5.81
- work continues for compatibility with Ubuntu, currently it is possible to remaster it and install with eggs cli install;

- more than a few freaks to make the gnome links work by marking them trusted with the gio command which, however, as the user is not logged in, must be launched with sudo -u user dbus-launch gio set ...;

Of course eggs remains compatible with Debian Buster.



### eggs-7.5.76
Eggs is becoming adept at remastering Ubuntu 20.04 focal, it manages to remaster Ubuntu without any problem. For the installation, at the moment, it is not possible to do it with the graphic installer but only with the built-in one.

- restructuring of the code to allow selection among the various distros;

- fixing hotspots for focal Ubuntu remastering (both ubuntu-server and Ubuntu-desktop);

- xbuntu, kubuntu, UbuntuMate and UbuntuBudgie versions boot properly.

It remains to fix the configuration of the graphical installer for Ubuntu.


### eggs-7.5.72
- skel command for copying the user configuration in /etc/skel. It works very well on cinnamon. Need to test it on other desktop Managar, maybe tell me which ones you are interested in.


### eggs 7.5.64
- possibility to configure the live user name and passwords directly in the / etc / penguins-eggs file (there are those who prefer live / evolution, those who demo / demo, etc;

- creation of the live user ALWAYS and only as the only user of the liveCD part of the sudo group.

I chose to make this change for better cleaning and user control. At the moment I only uploaded the npm version

### eggs-7.5.60-1
- cleaning of git repository: remuved old documentts,  in documents


### eggs-7.5.51-1
- info: nuovo look;
- produce: if the prerequisites are not installed, it correctly proposes their installation;
- installer cli: introduced a new display to confirm the entered values.

I have problems with the cli installer, it is quite good and has also become humanly usable, but for some reason that I don't know, after the installation, during the boot phase, a boot delay is generated which, by performing the installation with calamares


In particular, it reports:

```mdadm: no array found in config file or automatically```

(I use only virtual machines on proxmox-ve, so I don't need and have disk arrays)

and, once past the rock, it still waits 1:30 for:

```A start job is running for /sys/subsystem/net/devices/multi/user```

If someone can help me, don't esitate, thanx.

### eggs-7-5-57-1
- add warning for look new versions;
- the presentation of calamares translated into English;
- added verbose option also in ```adjust``` command;
- changed name and position of the exclude.list;
- restructured and simplified exclude list, insert options for apache2 and pveproxy.

### eggs-7.5.54-1
- tested with LMDE4, both standard amd EFI machines.

### eggs-7.5.44-1
- installer cli: fstab will use UUID no more /dev/sda1, etc
- installer cli: removal of the user and group of the liveCD during installation

### eggs-7.5.40-1
* fixed failure to remove CD user group pending, edit the fstab file in the cli installer by adding the blkids.


### eggs-7.5.39-1
* added skel command: copy of the Desktop configuration in / etc / sket;
* correct and tested functioning of the installer cli.

### eggs-7.5.36-1
* added flag -a for the installation assistant which allows the choice between graphical installation and cli installation;
* corrected problem of deleting apt lists on the version installed with graphic installer.

Happy 1st of May to all


### eggs-7-5-34-1
- Eliminated the ISO construction error on a non-UEFI machine. Previously, since the grub-efi-amd64 package and its dependencies were not installed, eggs failed even if the make_efi = no value had been set correctly in the configuration file;

* Introduced a further flag in eggs produce, for the addition on the desktop of the installation assistant that allows you to choose between calamares or installer cli.

### eggs_7.5.18-1_amd.deb
In these versions from 7.5.0-1 to 7.5.18-1 I have completely revised the commands trying - as much as possible - to simplify the use. This version, in case of prerequisites not installed, asks the user to install them on the fly and so does for calamares (if in / etc / penguins-eggs force-installer = yes) and for the configuration file itself which, if absent, is automatically generated. Furthermore, for non-graphical workstations, calamares are no longer configured, obviously not necessary and the installation takes place directly with eggs.

If you have problems, try using the -v flag to view the video output of the various calls.

### eggs_7.5.0-1_amd,deb
* Finally we have the working UEFI version.


# Help
Don't esitate to ask me for suggestions and help.

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations

You can find more informations at [Penguins' eggs blog](https://penguins-eggs.net).

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* mail: piero.proietti@gmail.com

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
