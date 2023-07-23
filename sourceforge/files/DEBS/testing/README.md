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

## eggs-9.5.13
* Sparky linux came in two version: stable and semi-rolling. On same version field `VERSION_CODENAME` on `/etc/os-release` is not configurated, this lead eggs to assume the version is `rolling` but this is wrong. Add on `/etc/os-release` the line `VERSION_CODENAME=bookworm` to can remaster it with penguins-eggs;
* Linuxmint LMDE, Sparky and others Debian based distros, need to have the field `efiBootloaderId: "Debian"` to can boot correctly on UEFI;
* persist a problem on BIOS for LMDE and Sparky who I can't understand. 

Calamares get this error 

```
Get:1 file:/var/local/yolk ./ InRelease
...
Ign:8 file:/var/local/yolk ./ Contents (deb)
Reading package lists...
Running bootloader-config...
 * install grub... (bios)
Reading package lists...
Building dependency tree...
Reading state information...
grub-pc is already the newest version (2.06-3~deb11u5).
cryptsetup is already the newest version (2:2.3.7-1+deb11u1).
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
1 not fully installed or removed.
After this operation, 0 B of additional disk space will be used.
Setting up grub-pc (2.06-3~deb11u5) ...
```

# OEM Installation
I'm trying to create an OEM installation for eggs, in order to allow configuring pre-installed computers where the user gets a simple configuration program on first boot.

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
