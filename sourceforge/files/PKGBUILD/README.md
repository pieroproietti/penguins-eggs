penguins-eggs PKGBUILD
======================

### Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-cyan)](https://penguins-eggs.sourceforge.io/)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Arch

## Development repository
Copy and paste follow instructions
```
git clone https://github.com/pieroproietti/penguins-eggs-arch
cd penguins-eggs-arch
makepkg -srcCi
```

## AUR repository
Copy and paste follow instructions
```
git clone https://aur.archlinux.org/packages/penguins-eggs
cd penguins-eggs
makepkg -srcCi
```

You can vote for penguins-eggs in the AUR repository, and suggest my a way to bring it in chaotic-aur, thanks.

# Manjaro

## Development repository

Copy and paste follow instructions
```
git clone https://github.com/pieroproietti/penguins-eggs-manjaro
cd penguins-eggs-manjaro
makepkg -srcCi
```
s
## Configure eggs
* '''sudo eggs dad -d```

## Create your first iso: CLI installer krill
* ```sudo eggs produce --fast```

## Create your first desktop iso: CLI installer krill
* ```sudo eggs produce --fast```

## Copy your iso image and boot the son of your system
You can use simple USB or USB with ventoy, iso file with proxmox ve, virtualbox, vmware etc.


# Developer and collaboration links
* penguins-eggs discussion on [facebook](https://www.facebook.com/groups/128861437762355) 
* [telegram](https://t.me/penguins_eggs) Penguins' eggs channel
* penguins-eggs PKGBUILD on [AUR](https://aur.archlinux.org/packages/eggs) (not aligned for now)
* penguins-eggs PKGBUILD on [github](https://github.com/pieroproietti/penguins-eggs-arch)
* penguins-eggs [sources](https://github.com/pieroproietti/penguins-eggs)
* penguins-eggs [book](https://penguins-eggs.net/book/)
* penguins-eggs [blog](https://penguins-eggs.net)


Added packages

## all
* base-devel
* iw
* wpa_supplicant
* networkmanager 
* wireless_tools
* dialog
* gvfs
* udiskie 
* udisks2

* added in /etc/polkit-1/rules.d
  * 10-udisks2.rules
  * 49-nopasswd_global.rules
  * 99-custom.rules
  * 10-udisks.rules
  * 50-udisks.rules

## colibri

* network-manager-applet 
* polkit-gnome