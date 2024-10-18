penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![www](https://img.shields.io/badge/www-blog-cyan)](https://penguins-eggs.net)
[![telegram](https://img.shields.io/badge/telegram-group-cyan)](https://t.me/penguins_eggs)
[![isos](https://img.shields.io/badge/images-ISO-blue)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)
[![pkg](https://img.shields.io/badge/packages-bin-blue)](https://sourceforge.net/projects/penguins-eggs/files/Packages)
[![ver](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)

# Penguins' eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

# Fedora

* **egg-of-fedora-naked** (CLI, minimal reproductive installation)
* **egg-of-fedora-colibri** (XFCE, devtools)
* **egg-of-fedora-albatros**  (KDE, office, multimedia, graphics))
* **egg-of-fedora-duck** (CINNAMON, office, multimedia, graphics)
* **egg-of-fedora-owl**  (XFCE, office, multimedia, graphics))

Fedora doesn't need much introduction, Redhat was the first Linux I managed to install back in 2000, then I switched to Debian.

I always liked it, sometimes hated it because of the need for a license - I'm speacking of Redhat - and rpm, still a great system.

## 

I am trying to port penguins-eggs to Fedora, that is the state of the art. 

From today 7 september 2024 we are able to boot, it was a long history... on 14 september 2024 the installation with krill our TUI installer in possible (`sudo eggs install`), we need at the moment to adapt calamares.

The configurations for dracut are in the [dracut](https://github.com/pieroproietti/penguins-eggs/tree/master/dracut) folder.

Boot params for our ISO are created on ovary.ts, this is a sample:
```
initrd=/live/initramfs-6.10.7-200.fc40.x86_64.img root=live:CDLABEL=colibri rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs selinux=0 
```
It's also possible to dress our naked system as colibri, just:
`eggs wardrobe get`, then `sudo eggs wardrobe wear` and I'm trying to prepare albatros, duck and owl too.

# Help need
I'm not too expert on fedora, and in all the ways we have the follow problems:

* again was not able to create an rpm package for penguins-eggs;
* until now I'm not able to configure calamares on fedora;
* fedora ISOs remastered with eggs can't boot on EFI.

You can mail me at piero.proietti@gmail.com, or on https://github.com/pieroproietti/penguins-eggs, https://social.treehouse.systems/@artisan.
