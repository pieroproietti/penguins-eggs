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

# Penguin's eggs Debian TESTING package

Pleas don't use this package for installations, they have just the pourpouse to be TESTED and can be extremally BUGGED!!!

# Aravind

I don't think it will work, but probably will partition the disk. As told you I don't have a NVMe hw, nor the possibility to emulate it in a VM on Proxmox VE.

In all the ways, this are the changements:


* partitions module on krill must to correctly display for: SCSI, IDE, SATA, VirtIO block and NVMe
* when the partisions are made, append a number N to devise: for example: /dev/sda first partition will be /dev/sda1, but in case of NVMe devicese, they will be added in the follow way: /dev/nvme0n1 first partition /dev/nvme0n1p1, second partition /dev/nvme0n1p2 and so on
* probably I must make corrections on fstab and others things... not sure for now, I can't test that... I use variables, so perhaps can magically fit... but You will see



 


