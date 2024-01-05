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

# eggs-9.6.25
* Not really a new version, I just added a "press key to continue" to the commands `eggs status`, `eggs wardrobe list`, `eggs wardrobe show`.

# eggs-9.6.24
Just a small revision of eggs.yaml with removal of some variables no longer used. With the occasion I set by default `ssh_pass: false` previously it was true.

# eggs-9.6.23
Again on the `exclude.list`. 

I received this [issue 325](https://github.com/pieroproietti/penguins-eggs/discussions/325) so I decided to update again the exclude.list, creating a separate `exclude.list.usr` with he actual exclusions for usr.

If you want to continua to filter /usr, just add `--filters usr ` to command `eggs produce`. The default will not filter on /usr more.

With the occasion I removed the conflict with resolvconf as requested on [issue 324](https://github.com/pieroproietti/penguins-eggs/issues/324)


# eggs-9.6.22
To meet the needs of those who use eggs to clone their systems, I varied the exclude.list configuration. With the occasion I have also varied the path of it: the `exclude.list` now  is created in the canonical path `/etc/penguins-eggs.d`. In addition, since the mksquash command allows only one file for the exclude list, I thought of generating it dynamically from a template and others specific exclusions.

So we also have in `/etc/penguins-eggs.d` an `exclude.list.d` directory in which there are currently just three files: `exclude.list.template`, `exclude.list.custom` and `exclude.list.homes`. 

When we launch `sudo eggs produce` the real `exclude.list` file will be generated on `/etc/penguins-eggs.d`from the templates depending on the filters chosen: `custom`, `dev` and `homes`.

So, in this way, by doing a clone, we can decide whether or not to filter user's `homes`, use your own `custom` list, or - as in my case during development - exclude completely the current user's home using `dev`.

Another addition has been made to the [README](https://github.com/pieroproietti/penguins-eggs?tab=readme-ov-file#commands) of penguins-eggs: as you scroll through the various commands, a link to the code for the command itself appears below them. This can be very useful for those who want to try their hand at modifying or integrating penguins-eggs itself or simply have a curiosity to know how it works.

# eggs-9.6.21
* produce: we have a new default with a new **strictly** exclude.list, but you can use the new flag `--unsecure`, to bypass it.
* produce: new string for max compression `xz -Xbcj x86 -b 1M -no-duplicates -no-recovery -always-use-fragments`

Thanks to Hosein Seilany author of [Predator-OS](https://predator-os.ir/) and [Emperor-OS](https://emperor-os.ir/) for the great collaboration.


# eggs-9.6.20
[antiX](https://antixlinux.com/) is a wonderful Linux distribution and shares with [MX Linux](https://mxlinux.org/) everything needed for remastering: `antix-remaster` and `antix-Installer`. I have always envied them the wonderful installer, which is lightweight, graphical and easy to use. 

For those who want to use eggs for their remastering, I have tried to improve compatibility.

So, I added, a better distro recognition - previously both antix and MX linux were recognized as MX - and added a command that makes it possible to use their `minstall` for installation: `sudo /lib/live/mount/medium/antix-mx-installer`

You can of course use again krill for installation: `sudo eggs install` as calamares - strange to discover - work fine on MX Linux but not on antiX.

Note: I was able to remaster `antiX-23_x64-full.iso`, but not the `antiX-23_x64-base.iso` version. Again, to improve compatibility use `demo` as name for the live user and share your ideas/experiences on [penguins-eggs](https://t.me/penguins_eggs).

# eggs-9.6.19
* themes: we now have the ability to customize grub and isolinux themes, not only for graphics but also for menus. Take a look on theme predator on [wardrobe](https://github.com/pieroproietti/penguins-wardrobe). Thanks to Hosein Sellany of [PredatorOS](https://predator-os.ir/). 

# eggs-9.6.18
Again working on `eggs install` aka krill:

* fixed bootloader problems on Arch, Debian, Devuan and Ubuntu.

# eggs-9.6.17
A lot of little adjustments on `eggs install` aka krill:

* added krill alias to command `eggs install`;
* user/password and root/password fixes;
* hostname, domain fixes;
* others.

The only solution to put krill in order it to use it, I always use it with option --unattended to save time, sorry if I forgot some bugs again.

# eggs-9.6.16
I make a bit of refactoring on the nest (`/home/eggs`) - under the hood virtually all remain unchanged - but we get more clear vision:
```
- iso -> .mnt/iso
- livefs -> .mnt/filesystem.squashfs
- ovarium
- README.md
- egg-of_image.iso
- egg-of_image.md5
- egg-of_image.sha256
```
In addiction, there are two hidden dirs too: `./mnt`, `./overlay`, where happen the magic.

* kill: added --isos to force erase of ISOs on remote share;
* dad: changed text in accord;
* info: restored info text file on `.disk` of the ISO created.
 
# eggs-9.6.15
* ovary: added creation checksums .md5 and sha256;
* export iso: added checksums export.

# eggs-9.6.14
* ovary: enable/disable root and users password ssh connnections;
* grub/isolinux: added `ipv6.enable=0` excluded ipv6;
* yolk: typos and fixes;
* exclude.list: again a rewrite of exclude.list. including twallace51@gmail.com updates.

# eggs-9.6.13
* v9.6.12 deprecated: due a bug introduced on the previous version v9.6.12 is unable to produce on i386 and arm64 architectures;
* eggs dad -a: now don't clear more eventually errors from the screen;
* love: an one shot script to get live child systems;
* exclude.list: we get a new, more functional exclude.list, thanks to twallace51@gmail.com.

# eggs-9.6.12
* yolk: removed check and build for local yolk repository on `arm64` and `i386`;
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