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

# Debian remastered ISOs

All ISOs are based on Debian jessie

# user/password
* ```live/evolution```
* ```root/evolution```

# Debian jessie

* **naked** - just the juice, without GUI. You can start here to build your revolution! (i386 and amd64)

## Nota su Debian 8 jessie
Su Debian 8 jessie non è possibile utilizzare eggs per la mancanza di overlayfs nel kernel 3.16.x tale caratteristica è resente solo dalla versione 3.19 del kernel. Sono riuscito, comunque a produrre la iso, dopo aver installato un kernel bpo (backported) credo il 4.9.x che supporta unionfs.

A questo punto è stato necessario installare i pacchetti:
* live-boot_20170112_all.deb
* live-boot-initramfs-tools_20170112_all.deb
di provenienza Debian stretch

e ricompilare eggs direttamente sulla macchina jessie.

Attenzione: aggiornare eggs su jessie con una versione standard porta alla impossibilità di installazione. 

# Disclaim
__Please note what this project is in no way connected to Debian in any official way, it’s just my personal experiment__.

