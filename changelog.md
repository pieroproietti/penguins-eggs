penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-cyan)](https://penguins-eggs.sourceforge.io/)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguin's eggs Debian package

Note: **eggs_9.x.x_armel.deb** __is compiled for armel and could also be released for arm64, however it is not working. I am releasing it to look for someone who has the skills and wants to collaborate on the development__.

Detailed instructions for usage are published on the [penguin's eggs book](https://penguins-eggs.net/book). 
You can follow the project also consulting the [commit history](https://github.com/pieroproietti/penguins-eggs/commits/master). 

## Changelog
Versions are listed on reverse order, the first is the last one. Old versions are moved to [versions](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/versions/). 

### eggs-9.3.19
* grub:  now we have a new default resolution ```set gfxmode=1024x768```, and bugfix for Ubuntu on the option CLI boot;
* added new distros: SysLinuxOS filadelfia, Netrunner Desktop 23;
* same changes on krill ```eggs install --unattended``` and ```eggs install config [your-unattended-configuration]``` in prevision to [sepia](https://github.com/pieroproietti/sepia) to get an OEM installation.

### eggs-9.3.18
* iso: boot in GUI or CLI
* krill: added new motd with explanations
* krill: bugfix keyboard, bugfix add/remove packages.
* doas: accepted bugfix from [rreyn331](https://github.com/rreyn331/penguins-eggs),


### eggs-9.3.16
* I added a new configuration file /etc/penguins-eggs.d/derivaties.yaml to allow easier addition of new compatible distributions . The Ubuntu makululu linux distribution was added on this occasion.

### eggs-9.3.15
* LinuxFX: adapt ```eggs tools skel``` to the particularity of LinuxFX plasma;
* LinuxFX: created a new linuxfx theme in penguins-addons.

### eggs-9.3.14
* calamares: bugfix in desktop icon;
* oclif: updated to [oclif-pnpm@3.4.3-1](https://www.npmjs.com/package/oclif-pnpm)


### eggs-9.3.13
* logname: workaround for limiting a curious problem with the logname command. In some circumstances-at least on xubuntu 22.04 and linuxmint 21.1 mate-the logname command returns an empty string instead of the correct user name. In the case where logname fails to return the user name correctly, the environment variable SUDO_USER is examined before to fail.

### eggs-9.3.12
* linuxmint: just added linuxmint vera;
* oclif: working to integrate pnpm package manager inside oclif.

### eggs-9.3.11
* oclif: passed to [oclif-pnpm](https://github.com/pieroproietti/oclif-pnpm)@[3.4.2](https://www.npmjs.com/package/oclif-pnpm), a mime - little modified version of [oclif](https://github.com/oclif/oclif)@[3.4.2](https://www.npmjs.com/package/oclif) - with the scope of use pnpm. I hope to remain aligned with original, but really I like [pnpm](https://pnpm.io/) and it's feathures, if someome have mine same need - use [oclif](https://oclif.io/) with [pnpm](https://pnpm.io/) - will be nice to collaborate.

### eggs-9.3.10
* changed ```liveMediumPath = '/run/archiso/copytoram/'``` and ```squashfs = '/airootfs.sfs'``` for archlinux, aligned to archiso;
* created configuration on ```naked/arch``` for archinstall for a [Arch naked](https://penguins-eggs.net/book/arch-naked.html) version;


### eggs-9.3.9
Working with [LinuxFX](https://www.linuxfx.org/), which impressed me with its ability to mimic the look of Windows 11:

* eggs: added compatibility to [doas](https://wiki.archlinux.org/title/Doas), thanks to Roy Reynolds:
* produce: now remove the last slash from the theme (passed as path) and checks the existence of the theme itself;
* calamares: changed line Exec in install-debian.desktop **Exec=install-debian**
* skel: added file .linuxfx if exist in home for linuxfx

### eggs-9.3.8

* theme: introduced possibility to define and use themes outside of eggs, You can pass a ```--theme ./path/to/theme``` to use them;

* theme: calamares modules ```locale```, ```partition``` and ```users``` can now be included in the theme. eg: EducaAndOS need a different configuration in calamares module ```users.conf```, this informations will come from ```/educancos/theme/calamares/modules/users.yml```.

Example: 
```
git clone https://github.com/pieroproietti/penguins-addons
sudo eggs produce --fast --theme ./penguins-addons/educaandos
```
Themes now can include more customizations, not only livecd and calamares brand, but user definition too and - with same time and experience - much more.

All the addictional themes are now removed from eggs and included in the [penguins-addons](https://github.com/pieroproietti/penguins-addons) repository. 

You can request [me](https://t.me/penguins_eggs) to be added as a collaborator to this repository and thus participate in the development. 

### eggs-9.3.7
Finally we get both Arch and Manjaro versions of eggs aligned with Debian/Devuan/Ubuntu. You can boot and install other computers via PXE booting from a live system! 

Just: ```sudo eggs cuckoo``` start to serve the inserted iso on your network. 

Remain to solve PXE boot on UEFI systems and find a working calamares pkgbuild for Arch.

### eggs-9.3.6
- cuckoo: arch and manjaro are correcty booting on PXE, at moment only on BIOS systems;
* calamares: differents mountpoints of the iso (from DVD vs PXE) create a problem in calamares/krill module unpack.conf (cannot find airootfs.sfs / livefs.sfs). You must edit ```/etc/calamares/modules/unpack.conf``` and adapt the path, before to run calamares/krill in case of PXE boot.

### eggs-9.3.5
Released eggs-9.3.5 version to manjaro and arch, it is working except PXE boot (cannot load http://${pxeserver}/filesystem.squashfs, I hope someone have suggestions)

### eggs-9.3.4-1
calamares: just a bugfix on module /etc/calamares/modules/packages.conf

### eggs-9.3.4
* added to dependencies sshfs, I'm now using it to export isos and debs, I previously used the commands: ssh and scp which involved entering two passwords;
* various adjustments in export paths with new defaults in tools.yaml
* removal of the ``eggs export docs`` command and removal of the generation of source documentation, in the end it was useless;
* updating the **mom-cli.sh** script used by the command ``eggs mom`` aligning it with the current edition
* Cleanup and path change for **adapt** and **resy** scripts (re-install eggs saving yolk) previously located in ``/usr/local/bin`` and moved to ``/usr/bin``

### eggs-9.3.3
* various bug fixes and README revision from [Sunu Aziz](https://github.com/sunuazizrahayu)

### eggs-9.3.2
* calamares/krill: readded module dpkg-unsafe-io, dpkg-unsafe-io-undo; changed modules sources-yolk, sources-yolk-undo
* calamares/krill: changed packages.ts to build module packages.conf

### eggs-9.3.1
* tools: added command ```sudo eggs tools ppa``` to add or remove penguins-eggs-ppa to the trusted repositories of the system;
* bugfix: xdg.ts, lightdm configuration, line 107

### eggs-9.3.0
bugfix: in version 9.2.9 I had forgotten to add the pxelinux package to the dependencies, to be added if not already present in the distro.

### eggs-9.2.9
I have completely or nearly completely rewritten the pxe.ts library for the cuckoo command, replacing the dnsmasq package with a node library, so as not to add any additional dependencies. in addition, using iPXE I was also able to remove the problem of needing a real dhcp server for UEFI machine installation. In the boot screen via PXE I also added the ability to boot through the netbootxyz server. this is really a great addition to eggs and will allow you to boot networked computers through a live system launched on any machine on the network itself.

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

### eggs-8.17.17-1 (i386)
* tested against devuan beowulf/chimaera, debian buster/bullseye/bookworm, neon developer (ubuntu focal). This is the last version for i386 architecture.

### Older versions 
You can find older versions on the [penguins-eggs repo](https://github.com/pieroproietti/penguins-eggs) under in **changelog-old.md** under **documents**

# Help
Don't esitate to ask me for suggestions and help. I hope to receive [feedback](https://github.com/pieroproietti/penguins-eggs/issues).

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

# More informations
* site: [penguins-eggs.net](https://penguins-eggs.net)
* meeting: [jitsi meet](https://meet.jit.si/PenguinsEggsMeeting)
* gitter: [penguin's eggs chat](https://gitter.im/penguins-eggs-1/community?source=orgpage)
* issues: [github](https://github.com/pieroproietti/penguins-eggs/issues).
* facebook:  
   * [penguin's eggs Group](https://www.facebook.com/groups/128861437762355/)
   * [penguin's eggs Page](https://www.facebook.com/penguinseggs)
   * mail: piero.proietti@gmail.com

# Copyright and licenses
Copyright (c) 2017, 2021 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
