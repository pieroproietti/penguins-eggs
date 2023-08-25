Penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguins' eggs Debian TESTING packages


Please, don't use this package for installations, they have just the pourpouse to be TESTED and can be extremally BUGGED!!!

# Testing btrfs
This version `eggs_9.5.20_amd64.deb` configure calamares to format with btrfs if package `btrfs-progs` is present.

I have not experience on btrfs, so don't wait all is working.

On Debian calamares will istall the system on btrfs, but give problems: some subvol are mounted Read Only. On Debian selecting ext4 will install without problems.

On Arch calamares will install btrfs too, but it freeze during the boot. On Arch to be complete freeze also installing on ext4.

On Arch it's possible to install on ext4 using krill: `sudo eggs install -un`, be sure to do it on a clean machine without datas.

We need to overpass this errors.

## ISOs with btrfs support
To facilitate debugging work, I created two different ISOs with btrfs support: [btrfs-on-debian-bookwork](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bookworm/) and [btrfs-on-arch](https://sourceforge.net/projects/penguins-eggs/files/ISOS/arch/). You can find them under their respective directories.


# installing
Download the right package for your distro, Debian/Devuan/ubuntu uses .deb, Arch and derivates uses: .zsd.

## Debian/Devuan/Ubuntu
`sudo dpkg -i eggs_9.5.20_amd64.deb`

## Arch and derivatives
`sudo pacman -U ./penguins-eggs-9.5.20-1-any.pkg.tar.zst`

# Testing


# Future plans

## Krill
An OEM installation is divided into two phases, the first to be carried out in the company is the pre-installation which installs the operating system by configuring it with a live user, the second is the final configuration phase which takes place after delivery to the user.

The first phase can be performed very well by krill that I have cleaned and prepared for the purpose and takes place in CLI, unattend and configurable mode. On this side I'm already at a good point. 

We will have: ```sudo eggs install --oem```

## Sepia: first access system configurator
For the second phase I'm writing a dedicated program using nodejs, typescript, react, electron.io and material-ui.

Since krill is already - albeit with a CLI interface - it was written with react, I already have a clear idea of what needs to be done and I progress quite quickly, but of course I run into the lack of experience in the GUI world.

At the moment I'm looked to find a way to read/write local configuration files and how to add i10n to the program. Yes, here I'm absolutely beginner, but like and have great ideas in this platform.

So I was asking you if you have knowledge of this matter in order to collaborate in the construction of the application.

* repo: [sepia](https://github.com/pieroproietti/sepia)
* more info: [OEM installation](https://penguins-eggs.net/2023/01/15/oem-installation/)
* contact: piero.proiett@gmail.com

## Our mascote

Chasing [calamares](https://calamares.io/), I have already chosen as a mascot for my CLI installer the name of [krill](https://penguins-eggs), continuing in the line here is [sepia](https://github.com/pieroproietti/sepia)

[Sepia oficinalis](https://en.wikipedia.org/wiki/Common_cuttlefish)

![sepia](https://raw.githubusercontent.com/pieroproietti/sepia/main/assets/sepia.jpg)

## License

MIT © 2023 [Piero Proietti](https://github.com/pieroproietti/LICENZE)
