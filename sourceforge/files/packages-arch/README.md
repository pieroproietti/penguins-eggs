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
* penguins-eggs discussion on [manjaro-forum](https://forum.manjaro.org/t/penguins-eggs-help-needed-for-manjaro-compatibility/96799)
* penguins-eggs PKGBUILD on [community](https://gitlab.manjaro.org/packages/community/penguins-eggs)
* penguins-eggs PKGBUILD [my way](https://github.com/pieroproietti/penguins-eggs-manjaro) (*)
* penguins-eggs [sources](https://github.com/pieroproietti/penguins-eggs)
* penguins-eggs [book](https://penguins-eggs.net/book/)
* penguins-eggs [blog](https://penguins-eggs.net)

(*) Here we refere always to that, but I hope with same help to solve the problems and have it in community again.


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