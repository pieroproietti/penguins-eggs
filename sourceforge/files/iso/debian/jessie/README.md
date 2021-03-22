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

## Note on Debian 8 jessie
On Debian 8 jessie it is not possible, due the lack of overlayfs, to use eggs with the original kernel 3.16.0-11-amd64. This feature: overlayfs, is available only from the 3.19 version of the kernel. I managed, however, to produce the iso, after installing a backported kernel (4.9.0-0.bpo.12-amd64) who suppert overlayfs.

We need to update live-tools too to create an initrd.img capable to use overlayfs in place of the previus aufs, I tested the live package on stretch version, and work.

Last we need to compile eggs and modules, with gcc version 4.9.2 to solve a problem with an npm package used from eggs (drivelist)

* Error: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `CXXABI_1.3.9' not found (required by /usr/lib/penguins-eggs/node_modules/drivelist/build/Release/drivelist.node)

I made eggs compiled for jessie for both i386 and amd64 architecture and put them in [packages-jessie-backports](./packages-jessie-backports).


### update kernel from bpo

apt-cache search linux-image to see that kernel was possible to install

apt-get install linux-image-4.9.0-0.bpo.12-amd64

### update kernel from ubuntu
After varius temptatives I found the kernel linux-image-4.9.0-0.bpo.12-amd64 had problems with jessie, the system frozen sametime and I decided to found another kernel more adapt. Yesterday MUGIWARA LUFFY from OpenOS-Neon group suggest me mainline and I found [ubuntu mailine](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/)

I choose [linux-image-3.19.8-992-generic_3.19.8-992.201607122201_amd64.deb](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/linux-image-3.19.8-992-generic_3.19.8-992.201607122201_amd64.deb) and [linux-image-3.19.8-992-generic_3.19.8-992.201607122201_i386.deb](https://kernel.ubuntu.com/~kernel-ppa/mainline/linux-3.19.y.z-review/current/linux-image-3.19.8-992-generic_3.19.8-992.201607122201_i386.deb) according to the architecture.

install this kernel request module-init-tools too.

But we end with good results on amd64.


### install live-boot (from stretch repository)
After this was necessary to update live-boot with a versione who support the creation of initrd image with support of overlayfs.
I take follow packages (from Debian stretch repository):

* live-boot_20170112_all.deb

* live-boot-initramfs-tools_20170112_all.deb

* live-tools_20151214+nmu1_all.deb (I didn't install it but we can try)

### recompile eggs on jessie or use the package eggs from [packages-jessie-backports](./packages-jessie-backports).

For same reasons - I don't know at the moment -  eggs compiled on different version of Debian don't want to run correctly on the system and end with the error:

* **Error: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `CXXABI_1.3.9' not found (required by /usr/lib/penguins-eggs/node_modules/drivelist/build/Release/drivelist.node)**

strings /usr/lib/x86_64-linux-gnu/libstdc++.so.6 | grep CXXABI

Perhaps the best will be to change npm package drivelist and use something else, to get the driver's list.

For now solved this recompiling eggs (modules) on Debian jessie with gcc version 4.9.2.

### that's all folks!
All the packages need to use eggs on Debian jessie are in [packages-jessie-backports](./packages-jessie-backports)

### Warning: 
* __upgrading eggs on jessie with a standard version will lead to an inability to install__.
* __as in stretch comp lz4 is not supported, so we can't have fast compression, use normal or max__.

# Disclaim
__Please note what this project is in no way connected to Debian in any official way, it’s just my personal experiment__.

