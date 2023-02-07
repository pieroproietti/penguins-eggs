penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)


# Penguin's eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

All ISOs include eggs, you can udate it with: ```sudo eggs update```.

# [Waydroid - Container-based Android for Linux](https://waydro.id/)

A container-based approach to boot a full Android system on a regular GNU/Linux system like Ubuntu.


# 
##  **wagtail**
A light wayland/gnome/waydroid for developers

##  **warbler**
A light wayland/kde/waydroid for developers

##  **whipbird**
An ultra light wayland/weston/waydroid for developers


* If you want the official waydroid version look at [Waydroid](https://waydro.id/#wdlinux). 

### NOTE

This waydroid customization are made mostly for developers. so we put inside just firmware for wifi to let you to be able to get what you need more.

I'm using an automatic method to build this iso: just install a minimal Debian bookworm version add eggs and - basically - give the following commands:

`eggs wardrobe get`

`sudo eggs wardrobe wear wagtail / warbler / whipbird`

After that reboot, You are ready!

If you want remaster your customized version, just:

`sudo eggs calamares --install`

`sudo eggs tools clean`

`sudo eggs produce --fast theme ./wardrobe/themes/waydroid`

* All the versions are configured with ``no-hardware-accelleration`` to be used, modified and remastered under a virtualizator: [proxmox-ve](https://www.proxmox.com/en/proxmox-ve), virtualbox or others.

**Support me and give feedback: https://t.me/penguins_eggs**


# Installing Linux Waydroid via PXE

One feature of ISO images made with eggs is the ability to be used for network installation . All you have to do is boot the ISO to be installed, open a terminal window and type the command: 

``sudo eggs cuckoo``.

Then all you have to do is boot from the network the machines to be installed and start the calamares or krill installer.

You can also perform an unattended installation with krill, see the [manual](https://penguins-eggs.net/book/) or, find assistance in the [telegram penguin's eggs](https://t.me/penguins_eggs) group.



## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [Waydroid - Container-based Android for Linux](https://waydro.id/).


Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
