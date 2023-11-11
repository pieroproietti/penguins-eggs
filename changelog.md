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

# Architectures
Since version `9.6.x` Penguins' eggs is released - as Debian package - for: `amd64`, `i386` and `arm64` architectures, supporting the majority of PCs, old ones and single board systems like Raspberry Pi. Read more on the article [Triple somersault!](https://penguins-eggs.net/blog/triple-somersault).

## Changelog
Versions are listed on reverse order, the first is the last one. Old versions are moved to [versions](https://sourceforge.net/projects/penguins-eggs/files/DEBS/versions/). 

# eggs-9.6.12
* yolk: removed check and build for local yolk repository on armd64 and i386;
* manjaro: added `vulcan` version.

# eggs-9.6.11
* krill: changed the way to visualize errors on function `rexec()` during installation, without clear and stop the execution;
* krill: hide desktop link to krill on installed systems;
* krill: always set zone/region to local using geoip.

# eggs-9.6.10
* krill: sort of keyboard layouts and fix layout selection in Devuan;
* krill: module network-cfg, removed /etc/resolv.conf build

# eggs-9.6.9
* eggs: a lot of little bugfixes due various tests on arch, arcolinux, bhodi, blendos, debian, deepin, devuan, educaandos, elementary, endeavourOS, garuda, kali, lds, lilidog, linuxfx, linuxlite, linuxmint, luberri, manjaro, mx-linux, neon,  neptune, netrunner, parrotos, plastilinux, pop-os, rebornos, rhino, siduction, sparkylinux, spirallinux, syslinuxos, ubuntu and waydroid;
 
# eggs-9.6.8
* krill: a lot of work on krill to reestablish its functionality, especially the detection and selection of languages, keyboards, etc. that had skipped in recent versions;
* calamares: given the work to introduce plasma 6 on Arch linux, some packages were renamed and involved calamares. The affected packages are: kdbusaddons5, kconfig5, kcoreaddons5, kiconthemes5, ki18n5, kio5, solid5 and plasma-framework5. It was necessary, therefore to update calamares.

# eggs-9.6.7
A lot of work on compatibility with [Proxmox-VE](https://www.proxmox.com/en/proxmox-virtual-environment/overview), we now have two different ISOs for amd64 and arm64. The new [eagles](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bookworm/) come with xfce4, virt-viewer and proxmox-ve installed; they can be tested either live or installed. The version for arm64, is build with [Proxmox-Port](https://github.com/jiangcuo/Proxmox-Port) repository by [jiangcuo](https://github.com/jiangcuo), a great work!

# eggs-9.6.6
* patch for humans: users tend to set `user_opt` as real username, this is NOT NECESSARY AT ALL and in cases of `--clone` will create problems. To prevent that, eggs reset `user_opt` to standard when a `-clone` is request;
* added distrobution Ubuntu mantic.

# eggs-9.6.5
* changed ln node from /bin/node to /usr/bin/node to solve problem in Devuan i386;
* added grub-efi-arm64-bin to dependencies for arm64.

# eggs-9.6.4
* introduced yolk for arm64 architecture;
* using  `-processor 2` and `-mem 1024M` limit on mksquashfs on arm64 for Raspberry;
* naming changed to: egg-of_distro-codename-name_arch_data-time;
* need confirm for installation, remastering and production on RPi 4.

# eggs-9.6.3
* calamares: just a fix on a bug in calamares configuration introduced with version 9.6.2.

# eggs-9.6.2
This is the first version, working and producing installable ISOs for the system on: amd64, i386 and arm64 architecture.

To test on arm64 - just on Debian bookworm - I used a simple VM not real hardware, I'm not too expert of such architecture, but I hope can work on real hardware too, if it is compatible UEFI and grub.

# eggs-9.6.1
Nicelly working on amd64 and i386 with the same - aligned - version. 

No more differences for installation and usage beetwhen the two versions.

arm version is installable too and can run, but will not produce a regular ISO. If you are interested in support arm I need your help.

# changelog.d
[Old changelogs](https://github.com/pieroproietti/penguins-eggs/tree/master/changelog.d).

# Help
Don't esitate to ask me for suggestions and help. I hope to receive [feedback](https://github.com/pieroproietti/penguins-eggs/issues).

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