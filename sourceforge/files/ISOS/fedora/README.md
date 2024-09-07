penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguins' eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

# Fedora

Fedora doesn't need much introduction, Red Hat was the first Linux I managed to install back in 2000, then I switched to Debian.

I always liked it, sometimes hated it because of the need for a license amd rpm, still a great system.

I am trying to port penguins-eggs to Fedora, that is the state of the art. 

From today 7 september 2024 we are able to boot, it was a long histor... Now we need to adapt kril and calamares to install it.

The configurations for dracut are in the [dracut](https://github.com/pieroproietti/penguins-eggs/tree/master/dracut) folder.

Boot params for our ISO are created on ovary.ts, this is a sample:
```
initrd=/live/initramfs-6.10.7-200.fc40.x86_64.img root=live:CDLABEL=colibri rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs selinux=0 
```

