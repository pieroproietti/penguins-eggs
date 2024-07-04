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

## penguins-eggs-10.0.x installation
`penguins-eggs-10.0.x` depend on `nodejs >18`, not directly available in all the distros. We can rely on [nodesource](https://github.com/nodesource/distributions?tab=readme-ov-file#debian-and-ubuntu-based-distributions) adding them.

### using get-eggs
It's the most pratical way and is valid for Arch, Debian, Devuan and Ubuntu. get-eggs configure automatically `nodesource` when need. Copy and paste:
```
git clone https://github.com/piero-proietti/get-eggs
cd get-eggs
sudo ./get-eggs.sh
```
### manual installation

#### Arch, Manjaro, Debian 12 bookworm, Ubuntu 24.04
Just download and install penguins-eggs-10.0.x.

#### Debian 10 buster, Debian 11 bullseye, Ubuntu 20.04, Ubuntu 22.04
Before to install `penguins-eggs-10.x` add the repos from `nodesource`, follow this [indications](https://github.com/pieroproietti/penguins-eggs/issues/368) to get `nodejs>18` available.

#### Debian 9 stretch, Ubuntu 18.04 bionic
Use the package `penguins-eggs-10.x.x-bionic-x` - compilated against node16 - and follow this [indications](https://github.com/pieroproietti/penguins-eggs/issues/368#issuecomment-2169961955) to get `nodejs>16` available.

# Architectures
Since version `9.6.x` Penguins' eggs is released - as Debian package - for: `amd64`, `i386` and `arm64` architectures, supporting the majority of PCs, old ones and single board systems like Raspberry Pi. Read more on the article [Triple somersault!](https://penguins-eggs.net/blog/triple-somersault).

# Changelog
Versions are listed on reverse order, the first is the last one. Old versions are moved to [versions](https://sourceforge.net/projects/penguins-eggs/files/DEBS/versions/). 

## penguins-eggs-10.0.14
* eggs: added/revised support to `linuxmint wilma`, `ubuntu noble`, `ubuntu devel` (rhino).
* Installing with TUI installer krill works: `sudo eggs install`
* Installing with GUI installer calamares, there is still same problem, neither Ubuntu noble nor Linuxmint wilma seems to enable the formatting of the installation disk, this result in a failure. Selecting manual installation or crypted installations seem to work regular, but the installed system don't boot.


## penguins-eggs-10.0.13
* `dad`: bugfix on flag --file;
* `exclude.list.d`: usr.list is now completely - intentionally - empty;
* `produce`: removed flag --sidecar, not necessary.

## penguins-eggs-10.0.12
`produce`: added the `--sidecar` flag, allows the inclusion of an arbitrary directory within the generated ISO. Uses can be disparate, I leave it to you.

## penguins-eggs-10.0.11-2
The `/usr/bin/penguins-links-add.sh` script called by `/etc/xdg/autostart/penguins-links-add.desktop` now waits for the Desktop folder to be present before copying the links to the desktop, with the result that all links are shown correctly.

## penguins-eggs-10.0.11-1
* `produce --excludes`, now accept `static`, `homes` and `home`,

Use:

* `sudo eggs --excludes static` you can use a static exclude.list;
* `sudo eggs --excludes homes` you want to clean all users' homes;
* `sudo eggs --excludes home` don't save my home dir.


## penguins-eggs-10.0.10-1
* dad: added a new flag `--file` to have own configuration defaults.

Configuration defaults are passed with own YAML file, eg: `custom.yaml`

```
# custom.yaml
---
root_passwd: secret
snapshot_basename: columbus
snapshot_prefix: '' # none
user_opt_passwd: secret
user_opt: user 
```
Usage: `sudo eggs dad --file ./custom.yaml`

## penguins-eggs-10.0.9-1
krill: fixed a noising problem, when use resolvectl krill was not able to create to link `/etc/resolv.conf` to `/run/systemd/resolve/resolv.conf`, now I fixed this. I'm using krill `sudo eggs install` more than calamares due it's much fast and can be used with flags like `--unattended`, `--nointeractive`, etc.

## penguins-eggs-10.0.8-2
* just a new pratical way to add/remove local repository yolk, during installation.

Yolk was created mostly to let installation without internet connection during the system installation. Before, I decided to remove all repos during installation with calamares/krill and use just `/etc/apt/sources.list.d/yolk.list`, now I changed this strategy: I just add `/etc/apt/sources.list.d/yolk.list` during installation process without remove the others repos. The result is a light slow initializations - when we are not on the net - but the possibility to add every packages during installation when we are connected.

## penguins-eggs-10.0.8-1
* removed the code that allowed `genisoimage` to be used instead of `xorriso` to generate the ISO;
* restored the operation of `eggs produce --script` for both: Debian and Ubuntu derivatives (for the moment it has been tested only on Debian bookworm and Linuxmint 21.3 Virginia;
* using `eggs produce --script` actually generated a link in `/home/eggs` to the ISO in `.mnt`;
* warning: I checked `eggs produce --script` on ArchLinux too, but actually don't work.

I did my best, I hope you find errors but not too many, that's enough for today!

## penguins-eggs-10.0.7-1
For the joy of all respin producer who don't like to have my eggs on the desktop, I changed a flag in `sudo eggs produce`.

I already add flag `--noicons`, equivalent to not create icons at all on the desktop: not eggs, not calamares, and so on, I think too much. So I update it to: `sudo eggs produce --noicon` in singular form, and remove just my eggs symbol and my blog link. For someone this can be important.

For others, don't take cure, always is better to have eggs on the fridge!

## penguins-eggs-10.0.6-3
Generate debian packages for all Debian/Devuan/Ubuntu distros plus a specific for Ubuntu bionic, from the same codebase. Thanks to mods in [perrisbrewery](https://github.com/pieroproietti/perrisbrewery). 

Of course Arch and Manjaro are generated aside, thanks his [PKGBUILD](https://github.com/pieroproietti/eggs-pkgbuilds).

### Note about bionic version
To have bionic, and armonize with all the others version, I did:

* package.json: ```"engines": { "node": ">=16.0.0" }, ```

Now we have two template for control file:

* perrisbrewery/template/dependencies.yaml;
* perrisbrewery/template/dependencies-bionic.yaml I removed line: ```live-config-systemd | live-config-sysinitv```, added live `-- live-boot`, and put `nodejs (>= 16);
* live-boot package: on bionic - for same reason - when the system is installed, directory `/lib/live/boot` is erased. The system work, eggs work and can produce, but the resulting ISO will not boot! To solve this problem, before generate the ISO, give: `sudo apt install live-boot --reinstall`. This will restore `/lib/live/boot` and it's full contents.

## penguins-eggs-10.0.6-1
I received from Glenn Chugg same informations about fixes on README and on `eggs skel` command. 

* README: added link to the important issue [#368](https://github.com/pieroproietti/penguins-eggs/issues/368) regarding nodejs 18, fixes on the text;
* skel: cinnamon desktop. not more copy`./conf/cinnamon` in `/etc/skel`.

## penguins-eggs-10.0.5-2
* produce: default compression is now `zstd 1M Xcompression-level 3`, fast the same and better in decompression;
* produce: added flag --pendrive, using `zstd 1M Xcompression-level 15` optimized to use with pendrives.

## penguins-eggs-10.0.4
* calamares: calamares now receive branding's configuration parameters homeUrl, supportUrl and bugReportUrl from /etc/os-release;
* node-proxy-dhcpd: I am trying to restore the operation of `eggs cuckoo`. I have not succeeded yet, you can refer to the related [issue](https://github.com/pieroproietti/penguins-eggs/issues/367).

## penguins-eggs-10.0.3
* krill installaler: `sudo eggs install` now have a new option to chroot on the installed system before reboot. This let you di add/remove last time packages, before your system is rebooted;
* again in krill: krill now respect the calamares module: `packages.conf` or it's own, packages are added/removed after it's configuration. This born becouse of Devuan daedalus amd64 version, I noted it go in kernel panic after installation, if penguins-eggs and it's dependecies are not removed. The problem arise - probably - from the package `live-config-sysvinit`. I solved using the option `--release` in command `produce`, to configurate calamares/krill to remove penguins-eggs, calamares and it's dependencies before to finish the installation process;
* Other little fixes on wardrobe.

## penguins-eggs-10.0.2
A whole series of tweaks to make the Debian package more standard, a pity not to have been able to generate a single package `-any` for all architectures. 

## penguins-eggs-10.0.0
There would be many ways to change the version number and emphasize an important fact in the code. I don't pretend to be right, but having spent a full morning reintroducing new headers on the sources and, a few days switching from `commonjs` modules to a more modern `node16` to support both CommonJS and ECMAScript modules, I decided this way. Don't hold it against me... :-)

In this version all dependencies have finally been updated. from [oclif](https://oclif.io/), [ink](https://github.com/vadimdemedes/ink), etc.

Another new feature, for those who want to try their hand at penguins-eggs development: you can create your penguins-eggs deb packages with these simple commands, of course after installing nodejs and pnpm.

To make your life easier and save yourself from installation of nodejs and pnpm, you can use any recent version of my live [colibri ISO](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bookworm/amd64/).

- `git clone https://github.com/pieroproietti/penguins-eggs`
- `cd penguins-eggs`
- `pnpm i`
- `pnpm deb`

In short, what I am about to tell you is that it is a good time to get on board!

## penguins-eggs-9.8.3
I consider the cleanup and adjustments resulting from the switch to oclif4 and Debian package name change to be over. I put the new version in the PPA and you can install it with the command: `sudo apt install penguins-eggs`.

## penguins-eggs-9.8.2
Removed a lot of unusefull code, when eggs started I thought to use npm packages to distribuite it, so inside there was the code to install necessary packages. From long time now, we produce deb packages and arch packages so there was no need ot that code. I tested it working on i386 Debian Bookworm, amd64 Debian Bookworm, Arch.

## penguins-eggs-9.8.1
Released for i386, arm64 and amd64. Checked on i386 Debian Bookworm, amd64 Debian Bookworm, Arch.

## penguins-eggs-9.8.0
It had been a long time since I was forced to use an outdated version of [oclif](https://oclif.io/) because I had modified it to be able to use [pnpm](https://pnpm.io/it/) instead of [npm]().
Recently, I think in March, with version 4 of oclif it is possible to use oclif with pnpm and I could then try to upgrade the package.
The next step was to put the pieces back together. I do in fact use - in addition to oclif - another mine Debian package building tool called [perrisbrewery](https://github.com/pieroproietti/perrisbrewery) and, of course, I had to update/modify that as well.

Basically this version is different, although on the surface it does not seem too distant to the previous one.

For that reason I decided to highlight the change by changing in addition to the release also the name of the package itself, no longer `eggs` but `penguins-eggs`. Commands and logic remain the same.

I made a little update penGUI too to 0.7.9 to reflect the different package name.

This package I place in testing at the moment, it definitely needs same break-in, but it assures us to stay well anchored in the present.

# changelog.d
Old changelogs are located on[changelog.d](https://github.com/pieroproietti/penguins-eggs/tree/master/changelog.d).

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
Copyright (c) 2017, 2024 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.