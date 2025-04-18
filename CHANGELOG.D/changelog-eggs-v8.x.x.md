penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![Packages](https://img.shields.io/badge/packages-binary-blue)
](https://sourceforge.net/projects/penguins-eggs/files/Packages)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguins' eggs Debian package

Usually the last version is the right one. Detailed instrunctions for usage are published on the [Penguins' eggs book](https://penguins-eggs.net/book). 
You can follow the project also consulting the [commit history](https://github.com/pieroproietti/penguins-eggs/commits/master). 

## Changelog [deprecated] versions 
Versions are listed on reverse order, the first is the last one.

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

I worked in pacman.links4Debs trying to reorder the code. Inserted in eggs config the display of the type of eggs package in use, corrected the isPackage(), isNpmPackage() functions in pacman. live-config is not taken because it's part of the version dependencies (bionic doesn't want it - but I should check)

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
* added eggsArch and uefiArch to respect rasberry-desktop-i386 but with kernel amd64

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
