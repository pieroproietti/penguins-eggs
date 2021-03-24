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
* **mate** - as naked but dressed with mate. (i386 and amd64)

## Note on Debian 8 jessie
On Debian 8 jessie it is not possible, due the lack of overlayfs on the original kernel 3.16.0, to use eggs. This feature: overlayfs, is available only from the kernel 3.19.x. I managed, however, to produce the iso, after installing a backported kernel (4.9.0-0.bpo.12-amd64) who suppert overlayfs.

We need to update live-tools packages too to create an initrd.img capable to use overlayfs in place of the previus aufs, so I tested the live packages from stretch version, and it work.


### update kernel from ubuntu mainline
After same temptatives with kernel 4.x.x-bpo from the same repository of jessies, I decided to try another kernel more adapt. Both, aosucas499 from [guadalinex](https://distrowatch.com/table.php?distribution=guadalinex) and MUGIWARA LUFFY from OpenOS-Neon telegram group suggest me to look in [ubuntu mailine](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/).

I choose [linux-image-3.19.8-992-generic_3.19.8-992.201607122201_amd64.deb](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/linux-image-3.19.8-992-generic_3.19.8-992.201607122201_amd64.deb) and [linux-image-3.19.8-992-generic_3.19.8-992.201607122201_i386.deb](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/linux-image-3.19.8-992-generic_3.19.8-992.201607122201_i386.deb) according to the architecture.

This kernel brings good results in both amd64 and i386 architecture.

__Note: Anyway, I still left the original kernel too. In case of problems, you can always start with the original jessie kernel. Just remember that in this way the system becomes sterile, unable to reproduce.__


### install live-boot (from stretch repository)
After this was necessary to update live-boot with a versione who support the creation of initrd image with support of overlayfs.

I toke following packages from Debian stretch repository:

* live-boot_20170112_all.deb

* live-boot-initramfs-tools_20170112_all.deb

* live-tools_20151214+nmu1_all.deb (I didn't install it but we can try)

### that's all folks!
All the packages need to use eggs on Debian jessie are in [packages-jessie-backports](./packages-jessie-backports)

### Warning: 
* __upgrading eggs on jessie with a standard version will lead to an inability to install__.
* __as in stretch comp lz4 is not supported, so we can't have fast compression, use normal or max__.

# Disclaim
__Please note what this project is in no way connected to Debian in any official way, it’s just my personal experiment__.

