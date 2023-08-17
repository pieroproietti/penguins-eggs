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

# eggs-9.5.17
* calamares: added module welcome.conf, this allows calamares to work properly on disks with multiple partitions and systems.

# eggs-9.5.16
* manjaro: added codename Uranos;
* arch: we now download and install [calamares-eggs](https://github.com/pieroproietti/eggs-pkgbuilds/tree/master/aur/calamares-eggs) from [sourceforge](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD/). This solve the problems of calamares on AUR and is a temporary workaround.

# eggs-9.5.15
* skel: added `await rsyncIfExist(`/home/${user}/.config/lxqt`, '/etc/skel', verbose)` to lxqt;
* ovary: cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} getent group autologin || chroot ${this.settings.work_dir.merged} groupadd autologin`, this.verbose))

## eggs-9.5.14
* skel:`rm -f /etc/skel/.config/user-dirs.*`, `rm -f /etc/skel/.config/bookmarks` as suggested Emer Chen;
* pacman: removed echo on `commandIsInstalled()`;
* changed the way to test cinnamon DE, from `cinnamon-core` to `cinnamon-common`;
* added `Debian 13 trixie` to support Sparky 8 rolling.

## eggs-9.5.13
Added Sparky linux, and solved issued with derivatives installation on UEFI and BIOS;
* UEFI: Linuxmint LMDE, Sparky and others Debian based distros, need to have the field `efiBootloaderId: "Debian"` to can boot correctly on UEFI;
* BIOS: added `chroot $CHROOT dpkg --configure -a` before install bootloader;

**NOTE:** Sparky linux came in two version: stable and semi-rolling. On same version field `VERSION_CODENAME` on `/etc/os-release` is not configurated, this lead eggs to assume the version is `rolling` but this is wrong. Add on `/etc/os-release` the line `VERSION_CODENAME=bookworm` to can remaster it with penguins-eggs;

## eggs-9.5.12
After having problems with calamares in Arch, you can read more [here](https://penguins-eggs.net/blog/arch-calamares-icu) I had to provide a new version of calamares for Arch, also there were many fixes also to get krill working in the new mode. 

Really a lot of effort, which should be rewarded by being able to start distributing Arch ISOs and derivatives installable with calamares again.

## eggs-9.5.11
**krill**: since it is possible for both krill and calamares to use themes not only for aesthetic purposes but also for special configurations, I modified krill to accept themes even in the absence of calamares. This also comes in handy for another reason: I am interested in jade-gui, the crystal-linux and blendOS installer. In time, I would like to make jade-gui available in eggs, somewhat as is the case with calamares.

I have already made a few attempts using blendos and the jade-gui version of it and it seems to work perfectly even on live images created with penguins-eggs.

## eggs-9.5.10
* debian: grub-efi-amd64-bin now is included in dependencies, so it's automatically addded and is always possible to produce system for BIOS and EFI;

## eggs-9.5.9
* krill now respect autologin on Arch;
* no more need to create symbolic link on the root for `/boot/vmlinuz-linux` or `/boot/vmlinuz-linux-zen` on blendOS;
* system installation (krill or calamares) remove entirely `/etc/calamares` using option `--release` in produce.

### eggs-9.5.8
* remove `user-dirs.dir` in `/etc/skel/.config/` to not lock building of canonical directory;
* introduced flag `noicons` in `eggs produce` to remove penguins-eggs icons from desktop and skip calamares control for systems live only;
* fixed bugs introduced by deprecated `v9.5.6` and `v9.6.7`, sometimes adding small features can be less easy than you think.

### eggs-9.5.5
* added Garuda Raptor to the compatibility list, see [README.md](https://sourceforge.net/projects/penguins-eggs/files/ISOS/garuda/) for limits.


### eggs-9.5.4
* added `eggs sudo tools ppa` on Arch, here we set repository `chaotic-aur`;
* removed `rolling-` on the default prefix for Arch amd derivated, die all Arch versions are rolling;
* passed to calamares 3.3 for Arch and derivates, created rolling/calamares-3.2 for manjaro.

### eggs-9.5.3
* solved issues [Krill installer fails on actual hardware #245](https://github.com/pieroproietti/penguins-eggs/issues/245);

### eggs-9.5.2
I switched to Debian bookworm as a development station, using node v18.16.0 and pnpm v8.6.2

* added the new Manjaro UltimaThule;
* live boot menu on UEFI architecture - previously invisible - has been fixed;

### eggs-9.5.1
Just little bugfix to let eggs to work again on CLI systems, solved a configuration on krill for Arch.

# changelog.d
[Old changelogs](https://github.com/pieroproietti/penguins-eggs/tree/master/changelog.d).

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