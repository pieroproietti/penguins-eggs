9.enguins-eggs
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

# Marius

## 2 Jun, 11:51  last version eggs-9.1.29-a,deb

I just backup and reinstalled your kiosk without any issues.

I solve the problem with lightdm, I don't had that in desktop versions before, but in all the ways it depend on the fact I was used to removed lightdm home, and, probably the line we add for user live.

Again, trying to solve I make a little modification in ```/etc/lightdm/lightdm.conf```  SeatDefailt became [Seat.*]

```
[Seat.*]
autologin-guest=false
autologin-user=user
autologin-user-timeout=0
autologin-session=lightdm-autologin
```







This is eggs-9.1.29 tested against your machine. 

To install just download it, and install with **dpkg -i eggs_9.1.29_amd64.deb++.


# Jon

waydroid init it's a long question here... about 700 KB download, there is a way to specific a path to download the lineageimage?

I added waydroid init at the end of install, and at last I decided to cut many stuffs, becouse here we are always on a new system

I'm waiting the init finish before to leava.

The present version is eggs-9-0-39-2_and64 and contain inside waydroid costume, I think to remove waydroid from wardrobe 
to not add too much weight to eggs: icons, backgrounds and so on can easily add KB to eggs.  

For the future, I think will be better to have differents wardrobes:  a small, simple internal
wardrobe and one or meore externals.


# Aravind

I don't think it will work, but probably will partition the disk. As told you I don't have a NVMe hw, nor the possibility to emulate it in a VM on Proxmox VE.

In all the ways, this are the changements:


* partitions module on krill must to correctly display for: SCSI, IDE, SATA, VirtIO block and NVMe
* when the partitions are made, append a number N to device: for example: /dev/sda first partition will be /dev/sda1, but in case of NVMe devicese, they will be added in the follow way: /dev/nvme0n1 first partition /dev/nvme0n1p1, second partition /dev/nvme0n1p2 and so on
* krill: added support to NVMe and paravirtualizated  disk; /dev/vda, /dev/nvme0n

 


