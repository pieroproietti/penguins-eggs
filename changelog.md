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

#### This is major version, why? 
In short: I removed the old CLI installer with the new krill installer with all it's armamentary and experiences: react components for visualization (only for eggs install and eggs info) and same configuration for GUI and CLI installer. 

I'm using actually node-8.17.0 to can build for all the architectures (i386, amd64, armel).

I hope to receive [feedback](https://github.com/pieroproietti/penguins-eggs/issues).


# Older [deprecated] versions 
Here, You can find [older versions](/documents/changelog-old.md).

# Help
Don't esitate to ask me for suggestions and help.

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations

You can find more informations at [Penguin's eggs blog](https://penguins-eggs.net).

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* mail: piero.proietti@gmail.com

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
