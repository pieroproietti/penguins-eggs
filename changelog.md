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
* adaptment to mx linux, machine-id, grub-efi-amd64-bin in place of grub-efi-amd64 in Utils.isUEFI(). Perhaps we must test also grub-efi-ia32-bin for i386?

### eggs-7.8.34
* added .disk folder in iso with info, mkiso, etc. added version in calamares, bugfix ia32, isGui, and others

### eggs-7.8.31
* bugfixes: check the presence of vmlinuz and initrd_img else stop, versionLike in rootTemplate of calamares (deprecated)

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
