Penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguin's eggs Debian TESTING packages

Please, don't use this package for installations, they have just the pourpouse to be TESTED and can be extremally BUGGED!!!

# Discussion

You can partecipate to discussion joining on [telegram channel](https://t.me/penguins_eggs).

# eggs cuckoo

The cuckoo lays its eggs in the nests of other birds, and the eggs are hatched by the latter. Similarly eggs can start a self-configuring PXE service to allow you to boot and install your iso on third party networked computers. Command cuckoo can be used either to deploy a newly created iso on an installed system or by live booting the iso itself. 

This is the first implementation of cuckoo, based on dnsmasq. I would have liked to implement it interament in node, so far it has not been possible.

Given the need to install the dnsmaq and pxelinux packages cuckoo is currently only available for Debian/Devuan/Ubuntu. I plan to extend its compatibility to manjaro and Arch distributions soon.

cuckoo since version eggs-9.2.5 september 2022, is capable to boot BIOS and UEFI machines, however due to a bug in [slim](https://github.com/rhboot/shim/issues/165) package, using ```sudo eggs cuckoo``` in dhcp-proxy version will not get the machines to boot. Instead, use: sudo eggs cuckoo --real.

# TO DO

* add Arch and manjaro compatibility

