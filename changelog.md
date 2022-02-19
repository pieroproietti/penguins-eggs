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

# Penguin's eggs Debian package

Usually the last version is the right one. Detailed instrunctions for usage are published on the [penguin's eggs book](https://penguins-eggs.net/book). 
You can follow the project also consulting the [commit history](https://github.com/pieroproietti/penguins-eggs/commits/master). 

## Changelog
Versions are listed on reverse order, the first is the last one.

### eggs-9.0.24-1
* krill --pve flag: reintroducing lvm2 partition for Proxmox VE and testing PVE on the resulting live, with dhpc
* pve: created a PVE Workstation, adding XFCE, firefox, virtviwewer and sshfs to can mount host:/var/lib/vz on /mnt;
* pve: testing a PVE inside a PVE host, added storage on the live from the host as directory /mnt;
* pve: create new VM on that storage and successfulli started them from live;
* pve: **NOTE**: editing configurations files in ```/etc/pve/qemu-server``` of the live it is possible to use VM images from the host
* pve: **NOTE** remain to test that running the live from a usb key
* pve: all that mean who the resulting live, can be used both: as rescue tool for existing Proxmox VE installation or to get a workable PVE installed or work in a PVE live, using as storage a directory from the disk of the host.
**EXAMPLE**: I can create here a VM with id 300 on my PVE, share configuration files from /etc/pve/qemu-server/300.conf and the resulting disk: vm-300-disk-0.qcow2 and vm-300-disk-1.qcow2 and just with the iso, the VM can be used everythere. 
* **NOTE:** the part regarding PVE is - at the moment - more an experiment than a real feathure.

### eggs-9.0.23-1
* krill: bugfix removed annoying bug on unmount process and use a more rational "press a key to exit" if we get errors.

### eggs-9.0.22-1
* krill: await if catch an error, removed last grub modifications introduced with eggs-9.0.21-1 in ```/boot/grub/grub.cfg``` on the live and on the system.

### eggs-9.0.21-1
* krill: wrote all partitions modes: bios, bios crypted, efi, efi crypted. efi=256M, boot=512M, swap=8G, rest to root; created module machine-id; in Ubuntu focal and derivated - eggs produce insert now an ```rmmod tpm``` in ```/boot/grub/grub.cfg``` on the live.

### eggs-9.0.20-4
* bugfix: changed to UUID in /etc/crypttab for full-encrypted systems on Ubuntu focal, checked with netplan too

### eggs-9.0.20
* krill: cleaning and fixes! Krill are small crustaceans of the order Euphausiacea continuously adapted to evolution

### eggs-9.0.19
* krill: ```eggs install --cli --crypto``` added full-crypted systems installation.

### eggs-9.0.18
* renamed blissos theme to waydroid, moved egg-of-ubuntu-impish-waydroid and egg-of-debian-bookworm-waydroid together under the same place: [waydroid](https://sourceforge.net/projects/penguins-eggs/files/iso/waydroid/), due the strong affinity.

### eggs-9.0.16
* ```eggs produce``` just remove users accounts and home. This let to have working servers examples;
* ```eggs produce --backup``` remove servers and users data from live, and put them on a LUKS volume.

From version 9.0.16 we have two new commands: ```eggs syncfrom``` (alias restore) and ```eggs syncto``` (alias backup).

A working installation, can easily sync users and servers data to a luks-eggs-backup:
* ```eggs syncto -f /tmp/luks-eggs-backup``` backup users and servers data to LUKS volume /tmp/luks-eggs-backup:

A new installation, can easyly get users and servers data from a luks-eggs-backup:
* ```eggs syncfrom from -f /tmp/luks-eggs-backup``` restore users and servers data from the LUKS volume /tmp/luks-eggs-backup.

**NOTE:** 
* krill: ```sudo eggs install --cli``` will restore users and servers data automatically;
* installing with calamares: when installation is finished, you need to mount the rootdir of your installed system and, give the following command: ```sudo eggs syncfrom -f /path/to/luks-eggs-backup -r /path/to/rootdir```
* it's possbile actually to change the nest directory, editing configuration file ```/etc/penguins-eggs.d/eggs.yaml```. Example: ```set snapshot_dir: '/opt/eggs/'```, but you can't use the following: /etc, /boot, /usr and /var.

**DISCLAIM:** using this new feathures can be dangerous for your data:
* ```syncfrom``` replace all users homes and all servers homes with data from the luck-eggs-backup, Force this data in not appropriate system can easily end in a long disaster recovery;
* I want stress you again on the fact we are working with a **live filesystem** mounted binded to the **REAL filesystem**. This mean who removing a directory under the nest, usually ```/nest/ovarium/filesystem.squashfs```, mean remove it from the REAL filesystem. So, if something went wrong during the iso production and You remain with live filesystem again binded, the shortest way to solve the problem is simply reboot.

### eggs-9.0.15
--backup option: a new common command restore was added it will be be used inside krill (OK) or calamares (to do)

### eggs-9.0.14
--backup option: set minimun luks volume size to 128 MB; it's possible to move nest under /opt

### eggs-9.0.12
--backup option: save users and SERVERS datas in LUKS volume inside ISO, then can be restored by krill. 

### eggs-9.0.11
--backup option: users homes and configurations are saved in LUKS volume inside ISO, then restored by krill.

### eggs-9.0.10
From version 9.0.10, finally we can boot UEFI and standard BIOS.

### eggs-9.0.9
Great cleanup in the themes for isolinux and grub. The grub issue still remains to be solved. 

### eggs-9.0.8
Added LMDE5 elsie and a lot of work to solve UEFI problems. Not fixed yet, but you can boot setting root and prefix from grub rescue

### eggs-9.0.7
autologin and enabling desktop links on gnome

### eggs-9.0.6
Added Elemantary jolnir

### eggs-9.0.5
Added bash/zsh autocomplete, manpages and post_remove in manjaro, added zsh autocomplete in Debian families, updated oclif: removed sha, insert sudo

### eggs-9.0.3
Added linuxmint 20.3 una, added educaandos theme, bug fixex in gnome

### eggs-9.0.2
Just a little changement in splash boot and varius

### eggs-9.0.1
The first version of eggs fully functional on Debian, Devuan, Ubuntu and... Manjaro!!! And soon will come other distros of the Arch Linux family.

### eggs-9.0.0
* An Epiphany present! 

### eggs-9.0.0-BETA
* A Christmas present! 

A preview of eggs version 9.x! Even if the aspect remains substantially unchanged, internally a lot has changed: we have moved to node 16 and the new version of oclif. Everything has been done to create a way to manage even more distributions, not only Debian, Devuan, Ubuntu and derivatives, but also Fedora and Arch Linux. This version however does NOT yet include Fedora, nor Arch Linux, I have to solve the problems related to the use of dracut instead of initramfs-tools of Debian.

If you wand follow penguin's eggs evolution, You can follow [Discussion](https://github.com/pieroproietti/penguins-eggs/discussions).

I wish You Merry Christmas and Happy New Year

### eggs-8.17-17
* tested against devuan beowulf/chimaera, debian buster/bullseye/bookworm, neon developer (ubuntu focal). This is the last version for i386 architecture.

### Older versions 
You can find older versions on the [penguins-eggs repo](https://github.com/pieroproietti/penguins-eggs) under in **changelog-old.md** under **documents**

# Help
Don't esitate to ask me for suggestions and help. I hope to receive [feedback](https://github.com/pieroproietti/penguins-eggs/issues).

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

# More informations
* site: [penguins-eggs.net](https://penguins-eggs.net)
* meeting: [jitsi meet](https://meet.jit.si/PenguinsEggsMeeting)
* gitter: [penguin's eggs chat](https://gitter.im/penguins-eggs-1/community?source=orgpage)
* issues: [github](https://github.com/pieroproietti/penguins-eggs/issues).
* facebook:  
   * [penguin's eggs Group](https://www.facebook.com/groups/128861437762355/)
   * [penguin's eggs Page](https://www.facebook.com/penguinseggs)
   * mail: piero.proietti@gmail.com

# Copyright and licenses
Copyright (c) 2017, 2021 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
