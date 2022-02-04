penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-blue)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-blue)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-blue)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-orange)](https://sourceforge.net/projects/penguins-eggs/files/packages-deb)
[![iso](https://img.shields.io/badge/iso-images-orange)](https://sourceforge.net/projects/penguins-eggs/files/iso)

# Penguin's eggs Debian package

Usually the last version is the right one. Detailed instrunctions for usage are published on the [penguin's eggs book](https://penguins-eggs.net/book). 
You can follow the project also consulting the [commit history](https://github.com/pieroproietti/penguins-eggs/commits/master). 

## Changelog
Versions are listed on reverse order, the first is the last one.

### eggs-9.0.16
We have two new commands: ```eggs syncfrom``` (restore) and ```eggs syncto``` (backup).
* ```eggs produce``` just remove users accounts and home. This let to have working servers examples;
* ```eggs produce --backup``` remove servers and users data from live, and put them on a LUKS volume.

A working installation, can easily sync users and servers data from a luks-eggs-backup:
* ```eggs syncto -f /tmp/luks-eggs-backup``` (backup users and servers data to LUKS volume /tmp/luks-eggs-backup)

A new installation, can easyly get users and servers data from a luks-eggs-backup:
* ```eggs syncfrom from -f /tmp/luks-eggs-backup``` (restore users and servers data from the LUKS volume /tmp/luks-eggs-backup)

**NOTE:** 
* ```sudo eggs install --cli``` (krill) will restore users and servers data automatically;
* installing with calamares, when installation it finished, you need to mount the rootdir of your installed system and, give the following command: ```sudo eggs syncfrom -f /path/to/luks-eggs-backup -r /path/to/rootdir```
* it's possbile now to change the nest directory, editing configuration file ```/etc/penguins-eggs.d/eggs.yaml```. Example: ```set snapshot_dir: '/opt/eggs/'```, but you can't use the following: /etc, /boot, /usr and /var.

**DISCLAIM:** using this new feathures can be dangerous for your data:
* ```syncfrom``` replace all users homes and all servers homes with data from the luck-eggs-backup, insert this data in not appropriate system can easily end in a long disaster recovery;
* I want stress you again on the fact we are working with a livefs binded to the REAL filesystem, this mean who removing a directory under /nest/ovarium/filesystem.squashfs mean remove it from the REAL filesystem.

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

If you wand follow penguin's eggs evolution, You can follow [Discussion](https://github.com/pieroproietti/penguins-eggs/discussions).

I wish You Merry Christmas and Happy New Year

### eggs-8.17-16
* tested against devuan beowulf, chiamaera, debian buster, bullseye, bookstorm, neon developer (ubuntu focal)

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

### Older versions 
You can find older versions on the [penguins-eggs repo](https://github.com/pieroproietti/penguins-eggs) under in **changelog-old.md** under **documents**

# Node8.17.0
I'm using actually node-8.17.0 version to build against all architectures (amd64, i386, arm64 and armel). Yes, there are same limits - compared with later versions of node - but it is the only way to release eggs for i386.

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
