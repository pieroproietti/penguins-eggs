penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguins' eggs releases

Detailed instructions for usage are published on the [Penguins' eggs guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide). You can follow the project also consulting the [commit history](https://github.com/pieroproietti/penguins-eggs/commits/master) and asking for support on [telegram channel](https://t.me/penguins_eggs). 

## Changelog
Versions are listed on reverse order, the first is the last one. Old versions are moved to [versions](https://sourceforge.net/projects/penguins-eggs/files/DEBS/versions/). 

**Note:** test packages with the final letter: -a, -b, -c etcetera are uploaded to the DEBS/testing folder of sourceforge.

### eggs-9.4.15
* egg of [blendOS](https://blendos.co/) now install and reproduce! Until now I used version [23.04-1](https://sourceforge.net/projects/blendos/files/23.04-1/). You can find samples on [sample](https://sourceforge.net/projects/penguins-eggs/files/ISOS/blendos/).

### eggs-9.4.14
* first egg of [blendOS](https://blendos.co/) produced! You can find samples on [sample](https://sourceforge.net/projects/penguins-eggs/files/ISOS/blendos/).

### eggs-9.4.13
* created unique kernelParameters function used for both grub.cfg and isolinux.cfg for live for Arch derived distributions;
* rethought and modified the creation of initramfs-linux.img for Arch derived distributions.

### eggs-9.4.12
* Introduced Ubuntu/devel compatibility for rhino, this solve the problems with calamares installer in rhino;

### eggs-9.4.11
* rewrote Utils.initrdImg() and Utils.vmlinuz() to try to integrate Arch, BlendOS, Crystal, EndeavourOS, RebornOS;
* adjustments in /addons/template/grub.template;
* added Ubuntu devel (Rhino Linux) to derivaties;
* added rhino theme in penguins-wardrobe.

### eggs-9.4.10
* Solved issue [Exclude.list not working #231](https://github.com/pieroproietti/penguins-eggs/issues/231);
* fixed: install-system.desktop icon.

### eggs-9.4.9
* `install-debian` - after so long time - became finally `install-system`;
* investigate about the lacks of calamares show and progress bar on Ubuntu jammy gnome;
* moved naked/arch configuration to penguis-wardrobe and aligned themes to the changes in eggs.

### eggs-9.4.8
Arch derivatives: compatibility with [EndeavourOS](https://endeavouros.com/) distribution added;

### eggs-9.4.6

I worked mainly on wardrobe, the changes in egg were a consequence.

After an attempt to switch to bash for defining customs, I decided to use for all four managed distributions the yaml language.

Managing Debian/Devuan, Ubuntu, and Arch with the same code is accomplished through yaml files that allow you to define the operations to be performed and what is needed,

The effort made was considerable, I hope it was worth it, but that will depend on who wants to adopt the methodology.

Report problems and bugs, suggestions, etc., after all, being able to handle more than 50% of Linux distributions in the same way could come in handy.

### eggs-9.4.5
* btrfs: ```eggs produce``` now works fine on btrfs. Note: calamares and krill configuration for btrfs is not enabled by default;
* bugfix: eggs copy branding from themes including subdirs;
* bugfix: check theme if exists and remove final / if we pass a theme;
* bugfix: link penguins-eggs and others stuffs README.md connected to the new site;
* live boot: removed CLI boot option and added safe option, GRUB is now hidden with a 2 seconds timeout, same for isolinux.

### eggs-9.4.4
* site: we switched to using docusauros to manage the [penguins-eggs.net](https://penguins-eggs.net) site;
- mom: better integration with the new site;
* typos: thanks to @JUST1CEjohnson, several grammatical and typing corrections have been made on the READMEs and commands;
* using [pnpm@8.1.0](https://pnpm.io/).

### eggs-9.4.3
* Manjaro: penguins-eggs was included in the [Manjaro community repo](https://gitlab.manjaro.org/packages/community/penguins-eggs);
* Arch: penguins-eggs is currently in [AUR](https://aur.archlinux.org/packages/penguins-eggs) repository;
* Debian/Devuan/Ubuntu: penguins-eggs for that distros and derivaties is included on [penguins-eggs-ppa](https://github.com/pieroproietti/penguins-eggs-ppa);
* bugfix: various bugfix and typos.

### eggs-9.4.2
* package: fixed the error that occurred when upgrading the package;
* until now I have tried [UEI - Unattended Eggs Installation](https://github.com/pieroproietti/penguins-eggs/blob/master/eui/README.md) extensively on XFCE, starting from this version cinnammon is working too as UEI;
* UEI scripts for gnome, kde and other desktop environments still remain to be created/fixed, I hope someone can give me some suggestions or help, thanks in advance.

### eggs-9.4.1
Working on EUI (Eggs Unattended Installation):

* solved the problem of network configuration on computers booted with PXE resetting the network connection with ```nmcli networking off``` and ```nmcli networking on``` during boot;
* to prevent further installation when the machine is configured with the PXE option as the first boot device, I added ```eggs install --flag halt```, so the system will be halted after the installation;
* fixed poweroff on Devuan;
* producing an EUI iso result in a iso filename with postfix _EUI.

### eggs-9.4.0
Ad un certo punto occorre eseguire il salto di versione - i numeri lunghi si ricordano male - ed è più semplice ricordare 9.4.0 invece di 9.3.31. In questo caso, per sottolineare il cambiamento ho fatto soprattutto una revisione dei testi in inglese che, non è la mia madrelingua. Spero - con l'aiuto di [deepl Translator](https://www.deepl.com/) - di esserci riuscito e che qualcuno voglia dare una mano.

### eggs-9.3.30
* ```sudo produce --clone```: now calamares - when configured for clone - no longer asks for user configuration and previous users are used. You can also install with krill; the advantage is that it will be faster and will respect the autologin configuration, which is reset by calamares to the default.

### eggs-9.3.29
* fix: ```sudo produce --clone``` unmount all binded mounts;
* fix: in case of errors, now ```sudo eggs produce``` shows the error and pauses before to end.

### eggs-9.3.28
* fix: penguins-eggs.desktop will be removed on installed system if you use: ```sudo eggs produce --release```;

### eggs-9.3.27
This package does exactly the same as the previous one, but I changed the way I use dhcpd-proxy for cuckoo - this has no impact on the usage of eggs - is more a refactoring of eggs itself.

When I implemented cuckoo, the PXE service included in eggs, I used a small package from the FOGProject [node-dhcproxy](https://github.com/FOGProject/node-dhcproxy)  and simply adapted it to my usage. The problem is that the last commit of that package was on September 21, 2019, and since then many things have changed, and we need to have some control over it.

So I decided to rewrite it, convert it to typescript and create another package called [etrick](https://github.com/pieroproietti/etrick), without just having the code inside the eggs as it was before. In the future I will also move it to the code for tftp and https, to have all the PXE services together, for now it's okay, we are just starting.

I was undecided whether to publish this version or not - there are no interesting new features, no big changes for users, all the changes are just hidden - but in the end I thought I would publish it almost to stabilize it, have a working master branch - for those who want to collaborate - and create a new development branch.

### eggs-9.3.26
* kill: added --nointeractive flag;
* various commands: uniformed --nointeractive flag for all commands;
* mom: little adjustments;
* eggs unattended install: see [eui](/documents/eui.md) or [here](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/eui.md).

### eggs-9.3.25
* Just discovered a nice companion of eggs: [epoptes](https://epoptes.org/). If you need to build classrooms, just install epoptes, run ```sudo eggs produce --fast``` and in minutes you will have classroom ready;
* produce: changed flag --backup to --cryptoclone;
* produce: changed default compression to fast if not specified
* moved inside /etc/penguins-eggs.d files is_clone and is_crypted clone to solve the problem with PXE they was not visible during installation;
* ovary/krill: generally speacking producing a clone or installing a clone, we don't touch more: locale, keyboard, localecfg, delLiveUser, adduser and autologin. Remain to save and restore autologin for cryptedclone;
* iso denomination changed from ```egg-of-distro-codebase-host-arch``` to ```egg-of-distro-codebase-host-arch_type_arch``` where type can be: ``, `clone` or `crypted`;
* it seem working reinstalling from ISO, PXE, clone and cryptedclone.

### eggs-9.3.24
* krill: bugfix on locale and locales configuration;
* mom: expanded the menu to Documentation

### eggs-9.3.23
* mom: a revamped mom to be used interactively as a help viewer of eggs commands;
* usage, description and examples renewed or added for all eggs commands;
* please NOTE that the USAGE section found in the README, the command: ```man eggs``` and the command ```eggs mom``` share always the same UPDATED informations.

### eggs-9.3.22
* due a bug - I forgot to remove "," in the new derivatives.yaml - I release this new version with Linuxmind victoria added.

### eggs-9.3.21
* bugfix on ```/etc/penguins-eggs.d/derivaties.yaml```
* added elementary OS 7 Horus;

### eggs-9.3.20
* krill: added confirm button or abort before to erase disk for --unattended and new option --nointeractive for scripts;
* produce: if not present sddm.conf and package sddm is installed eggs will create it in production for autologin with ```Session=plasma-wayland``` or ```Session=plasma``` and ```User=live```;
* tools skel: added copy waydroid-package-manager to skel if present.
* wardrobe: removed command ironing and tons of add/remove/fixes on penguins-wardrobe;
* wardrobe: we have now 3 new birds: wagtail, warbler and whispbird. You can build them from a naked iso installing and running: ```eggs wardrobe get```, ```sudo eggs wardrove wear wagtail```, etc,

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
* oclif: passed to [oclif-pnpm](https://github.com/pieroproietti/oclif-pnpm)@[3.4.2](https://www.npmjs.com/package/oclif-pnpm), a mime - little modified version of [oclif](https://github.com/oclif/oclif)@[3.4.2](https://www.npmjs.com/package/oclif) - with the scope of use pnpm. I hope to remain aligned with original, but really I like [pnpm](https://pnpm.io/) and its features, if someome have mine same need - use [oclif](https://oclif.io/) with [pnpm](https://pnpm.io/) - will be nice to collaborate.

### eggs-9.3.10
* changed ```liveMediumPath = '/run/archiso/copytoram/'``` and ```squashfs = '/airootfs.sfs'``` for archlinux, aligned to archiso;
* created configuration on ```naked/arch``` for archinstall for a [Arch naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html) version;


### eggs-9.3.9
Working with [LinuxFX](https://www.linuxfx.org/), which impressed me with its ability to mimic the look of Windows 11:

* eggs: added compatibility to [doas](https://wiki.archlinux.org/title/Doas), thanks to Roy Reynolds:
* produce: now remove the last slash from the theme (passed as path) and checks the existence of the theme itself;
* calamares: changed line Exec in install-system.desktop **Exec=install-system.sh**
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
I have completely or nearly completely rewritten the pxe.ts library for the cuckoo command, replacing the dnsmasq package with a node library so that there are no additional dependencies. Also-using iPXE-I was able to eliminate the need for configuring a real dhcp server by relying on the proxydhcpd included in eggs itself. I also added in the PXE boot screen, the ability to boot through the netbootxyz server. This is really a great new feature of eggs and allows you to boot all computers on the network using only one live system as the PXE server.

### Older versions 
You can find older versions on the [penguins-eggs repo](https://github.com/pieroproietti/penguins-eggs) under in **changelog-old.md** under **documents**

# Help
Don't esitate to ask me for suggestions and help. I hope to receive [feedback](https://github.com/pieroproietti/penguins-eggs/issues).

## Packages armel/arm64
eggs is compiled for armel and could also be released for arm64, however actually it is not tested.

I am releasing it to look for someone who has the skills and the will to collaborate for testing support and suggestions.

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

# More informations
There is a [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide) and same other documentation - mostly for developers - on the repository [penguins-eggs](https://github.com/pieroproietti/penguins-eggs) under [documents](https://github.com/pieroproietti/penguins-eggs/tree/master/documents). I want to point out [hens, differents species](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/hens-different-species.md) a brief how to use eggs in Debian. Arch and Manjaro, and the post [Arch-naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html) on the blog which describes how to create an Arch naked live, install it, then dress the resulting system with a graphics development station.

You can contact me by [mail](mailto://pieroproietti@gmail.com) or follow me on 
[blog](https://penguins-eggs.net), 
[facebook](https://www.facebook.com/groups/128861437762355/), 
[github](https://github.com/pieroproietti/penguins-krill), 
[jtsi](https://meet.jit.si/PenguinsEggsMeeting), 
[reddit](https://www.reddit.com/user/Artisan61), 
[telegram](https://t.me/penguins_eggs), 
[twitter](https://twitter.com/pieroproietti).

# Copyright and licenses
Copyright (c) 2017, 2023 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.