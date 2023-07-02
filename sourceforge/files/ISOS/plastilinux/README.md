penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Plastilinux
Plastilinux would like to become a meta-distribution for school and be based on different custom Linux distributions using the [wardrobe](https://github.com/pieroproietti/penguins-wardrobe/tree/main/DOCUMENTATION#penguins-wardrobe) of [eggs](https://github.com/pieroproietti/penguins-eggs).

![chicks](https://penguins-eggs.net/images/chicks.png)

## chicks
XFCE4, light customization office, code, nodejs and school programs.

![chicks](https://penguins-eggs.net/images/chicks-245x183.png)

Available as: 

* Arch Linux
* Debian bullseye
* Ubuntu jammy.


## Integration with epoptes.
I have included in eggs an integration function with [epoptes](https://epoptes.org/), thanks to which from an installed machine, creating an image with ``sudo eggs produce`` and starting ``sudo eggs cuckoo`` the machines started via PXE can be controlled with [epoptes](https://epoptes.org/).

* user/password
* ```live/evolution``
* ```root/evolution```

## Create your own image.

It is possible to create and customize these images from the original distributions and using eggs and wardrobe.

#### Arch chicks
* install a minimum configuration of Arch Linux or `eggs-of-arch-rolling-naked`
* install penguins-eggs using yay, if not already installed
* `eggs wardrobe get`
* `cd .wardrobe/costumes/chicks`
* `sudo ./arch_colibri.sh`

#### Debian bullseye chicks
* install a minimum configuration of Debian bullseye or `eggs-of-debian-bullseye-naked`
* download and install eggs, if not already installed
* `eggs wardrobe get`
* `sudo eggs wardrobe wear chicks`

#### Ubuntu jammy chicks.
* install minimum configuration of xubuntu 22.04 or `eggs-of-ubuntu-jammy-naked`
* download and install eggs
* `eggs wardrobe get`
* `cd .wardrobe/costumes/chicks`
* `sudo ./ubuntu-jammy_colibri.sh`


### NOTE
I'm refactoring wardrobe, including the main originals distros: Arch, Debian/Devuan and Ubuntu.

At the moment I'm using YAML configurations files for Debian/Devuan and simple Bash files for Arch and Ubuntu, this in future will change try to uniform all the distros. 

I'm think to use for every costume/accessory:

* `README.md` 
* `index.yaml`
* `distro-version_costume.sh`

And let to call them with: `sudo eggs wardrobe wear [costume]`, at the moment we are in transiction.


# Other images plastilinux
Trying to get the same remaster from 3 or 4 differents original distros: Arch Linux, Debian, Devuan and Ubuntu.


## **colibri**
A light xfce4 for developers you can easily start to improve eggs by installing colibri.

![colibri](https://a.fsdn.com/con/app/proj/penguins-eggs/screenshots/colibri.png/245/183)

## **duck**
cinnamon, office, multimedia and all that is needed for most users

![duck](https://a.fsdn.com/con/app/proj/penguins-eggs/screenshots/duck.png/245/183)
 
## **owl**
xfce4 for graphics designers, with 6.1.15-2-liquorix-amd64 kernel, based on the work of Clarlie Martinez 
 [quirinux](https://quirinux.org/).

![owl](https://a.fsdn.com/con/app/proj/penguins-eggs/screenshots/owl.png/245/183)

# Virtualization
I have discovered Proxmox VE since version 0.7 and have been using it for many, many years. Proxmox VE is based on Debian stable, and allows easy management of remotely manageable virtual machines through an excellent web interface.

Eagle is nothing more than a workstation based on Proxmox VE to which has been added an XFCE GUI, virtual-viewer and spice-vdagent, the result is a system that can be used both as a traditional workstation and as a virtualizer.

## **eagle**
xfce4 desktop plus [Proxmox VE](https://www.proxmox.com/en/proxmox-ve), install and configure it with static ip to enjoy KVM and containers virtualization.

**Note**: There are some new additions in this version:

* system automatically sets a line `hostname x.x.x.x` in `/etc/hosts`, this let proxmox-ve to start also from a live system;
* during installation command `sudo ssh-keygen -A` is used to reset keys;

it would be interesting if some Proxmox VE expert would take over this ISO, which could also be useful for maintenance operations on pre-existing servers, being a complete and functional Proxmox VE system even from live.

![eagle](https://a.fsdn.com/con/app/proj/penguins-eggs/screenshots/eagle.png/245/183)


## More informations
There is a [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide) and same other documentation - mostly for developers - on [penguins-eggs repo](https://github.com/pieroproietti/penguins-eggs) under **documents** and **i386**, in particular we have [hens, differents species](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/hens-different-species.md) who descrive how to use eggs in manjaro.

* [blog](https://penguins-eggs.net)    
* [facebook Penguins' eggs group](https://www.facebook.com/groups/128861437762355/)
* [telegram Penguins' eggs channel](https://t.me/penguins_eggs) 
* [twitter](https://twitter.com/pieroproietti)
* [sources](https://github.com/pieroproietti/penguins-krill)

You can contact me at pieroproietti@gmail.com or [meet me](https://meet.jit.si/PenguinsEggsMeeting)

## Copyright and licenses
Copyright (c) 2017, 2023 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.

* Disclaim
__Please note what this project is in no way connected to the original distro in any official way, it's just my personal experiment.__
