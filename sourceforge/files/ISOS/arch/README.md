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

# Arch

[Arch](https://archlinux.org/) a simple, lightweight distribution.

* **egg-of-arch-naked** Just the juice, without GUI. You can start here to build your revolution!
* **egg-of-arch-colibri** A light xfce4 for developers you can easily start to improve eggs installing colibri.
* **egg-of-arch-albatros** A light kde for developers you can easily start to improve eggs installing albatros.
* **egg-of-arch-fringuello** using distrobox, fringuello is capable to produce eggs for Arch and Debian, more informations: [Alice in Wonderland
](https://penguins-eggs.net/blog/alice-in-wonderland).

# USE

**naked** can be usefull to start everything: just add that you want, **colibri** is more a tool to hack with eggs than a real customization and perhaps can be used to test calamares too, **fringuello** is like colibri, with distrobox.

NOTE: it is still possible to "dress" a naked configuration as colibri/albatros by running the following commands:

* ```eggs wardrobe get```
* ```sudo eggs wardrobe wear colibri```

# Create a naked Arch starting with archiso
Install a minimal configuration using the [traditional way](https://wiki.archlinux.org/title/installation_guide) or [archinstall](https://wiki.archlinux.org/title/archinstall) - personally I prefere archinstall - add packages: `git`, `lsb-release`, then reboot. 

After booted, do:

* `git clone https://github.com/pieroproietti/get-eggs`
* `cd get-eggs`
* `sudo get-eggs.sh`

get-eggs will automatically add aur repository and penguins-eggs. 

# Installing Arch Linux via PXE

One feature of ISO images made with eggs is the ability to be used for network installation . All you have to do is boot the ISO to be installed, open a terminal window and type the command: 

```sudo eggs cuckoo```.

Then all you have to do is boot from the network the machines to be installed and start the calamares or krill installer.

You can also perform an unattended installation with krill, see the [manual](https://penguins-eggs.net/docs/Tutorial/english) or, find assistance in the [telegram Penguins' eggs](https://t.me/penguins_eggs) group.

## Note
In Arch - at the moment - I was able to boot via PXE just on BIOS system not UEFI. I hope someone can suggest a way to fix it to can boot via PXE on UEFI machines too.

# Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
