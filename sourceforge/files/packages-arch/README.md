# penguins-eggs Arch

## Build and install penguins-eggs

Copy and paste follow instructions
```
git clone https://github.com/pieroproietti/penguins-eggs-archlinux
cd penguins-eggs-archlinux
makepkg -srcCi
```

## Configure eggs
* '''sudo eggs dad -d```

## Create your first iso: CLI installer krill
* ```sudo eggs produce --fast```

## Create your first desktop iso: CLI installer krill
* ```sudo eggs produce --fast```

## Copy your iso image and boot the son of your system
You can use simple USB or USB with ventoy, iso file with proxmox ve, virtualbox, vmware etc.


# Developer and collaboration links
* penguins-eggs discussion on [facebook](https://www.facebook.com/groups/128861437762355) [telegram](https://web.telegram.org/z/#-1447280458)
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