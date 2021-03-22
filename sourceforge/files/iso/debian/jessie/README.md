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
On Debian 8 jessie it is not possible to use eggs with the original kernel 3.16, due the lack of overlayfs. This feature is available only from the 3.19 version of the kernel. I managed, however, to produce the iso, after installing a backported kernel (4.9.0-0.bpo.12-amd64) who suppert overlayfs.

After was necessary to install the follow packages (from Debian stretch repository):
* live-boot_20170112_all.deb
* live-boot-initramfs-tools_20170112_all.deb

and we solved almost all the problems.

For same reasons - I don't know at the moment, eggs compiled on different version of Debian don't want to run correctly on the system and end with the error:

* Error: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `CXXABI_1.3.9' not found (required by /usr/lib/penguins-eggs/node_modules/drivelist/build/Release/drivelist.node)

I solved this simply recompiling eggs directly on Debian jessie.

# Warning: 
__upgrading eggs on jessie with a standard version will lead to an inability to install__.

# Disclaim
__Please note what this project is in no way connected to Debian in any official way, it’s just my personal experiment__.

