penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/italiano)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)
[![telegram](https://img.shields.io/badge/telegram-group-red)](https://t.me/penguins_eggs)

# Debian remastered isos

All ISOs are based on Debian jessie

You can boot this live images burning them on USB key - using [Ventoy](https://www.ventoy.net/en/index.html) is a great opportunity - or via PXE, booting from LAN, just ```sudo eggs cuckoo``` or  ```sudo eggs cuckoo --real```

To install the system you have:

* GUI installer calamares
* TUI installer krill
* unattended



## user/password
* ```live/evolution```
* ```root/evolution```

# Debian jessie

* naked: just the juice, without GUI. You can start here to build your revolution!

You can use eggs wardrobe to dress it!

### update kernel from ubuntu mainline
After same temptatives with kernel 4.x.x-bpo from the same repository of jessie, I decided to try another kernel more adapt. Both, aosucas499 from [guadalinex](https://distrowatch.com/table.php?distribution=guadalinex) and Mugiwara Luffy from OpenOS-Neon telegram group suggest me to look in [ubuntu mailine](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/).

I choose [linux-image-3.19.8-992-generic_3.19.8-992.201607122201_amd64.deb](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/linux-image-3.19.8-992-generic_3.19.8-992.201607122201_amd64.deb) and [linux-image-3.19.8-992-generic_3.19.8-992.201607122201_i386.deb](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/linux-image-3.19.8-992-generic_3.19.8-992.201607122201_i386.deb) according to the architecture.

This kernel bring good results in both amd64 and i386 architecture.

__Note: Anyway, I still left the original kernel too. In case of problems, after the installation, you can always start with the original jessie kernel 3.16.x. Just remember that starting with original kernel lead to "sterilize" the system: you cannot produce eggs!__


### install live-boot (from stretch repository)
After this was necessary to update live-boot with a versione who support the creation of initrd image with support of overlayfs.

I toke following packages from Debian stretch repository:

* live-boot_20170112_all.deb

* live-boot-initramfs-tools_20170112_all.deb

* live-tools_20151214+nmu1_all.deb

All the packages you need to use eggs on Debian jessie are in [packages-jessie-backports](./packages-jessie-backports/)

### Warning: 
* __as in stretch comp lz4 is not supported, so we can't have fast compression, use normal or max__.

### that's all folks!

## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [Debian](https://debian.org/).

# Disclaim
__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__

