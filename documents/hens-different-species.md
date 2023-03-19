# Hens, different species
An hen is a female penguin able to produce eggs. 

In our case it is a light workstation we build to develop and test penguins-eggs. 

We need a light system becouse, often our tests consist on the creation of a live version 
of the system itself and this became a long history with heavy systems.

Generally i use to work a virtual machine, on a Proxmox VE installation, with minimum requisites:
* cores: 2
* memory: 4096
* name: Debian
* sockets: 2
* vga: qxl

In the host system I have virt-viewer installed and on the virtual machine I install always spice-vdagent to can adapt the monitor of the VM to the window, cut and past and so on.


# Prepare a Debian naked
We will install a CLI Debian:
* download and install net-install of Debian and install it, don't install GUI at this point.
* reboot and download and install eggs from [sourceforge](https://sourceforge.net/projects/penguins-eggs/files/DEBS/)

```sudo eggs tools ppa --add```
```sudo eggs dad -d```
```sudo eggs produce --max```

You will get a naked image of Debian you can install and customize.

You can also dress it using eggs wardrobe:

```eggs wardrobe get```
```sudo eggs wardrobe wear colibri```

colibri is my configuration for development of eggs, about 1.2 GB iso.


# Prepare an Arch/Manjaro hen
* Install a light version of Arch or Manjaro
* I use this, to clone and build penguins-eggs from AUR
```
git clone https://aur.archlinux.org/penguins-eggs.git
cd penguins-eggs
makepkg -srcCi
```
* Configure eggs
```
sudo eggs dad --default
```
* install calamares
```
sudo eggs calamares --install
```
* producing our first iso
```
sudo ./eggs produce
```



# More informations
There is a [Penguins' eggs official book](https://penguins-eggs.net/book/) and same other documentation - mostly for developers - on [penguins-eggs repo](https://github.com/pieroproietti/penguins-eggs) under **documents** and **i386**, in particular we have [hens, differents species](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/hens-different-species.md) who descrive how to use eggs in manjaro.

You can contact me by [mail](mailto://pieroproietti@gmail.com) or follow me on 
[blog](https://penguins-eggs.net), 
[facebook](https://www.facebook.com/groups/128861437762355/), 
[github](https://github.com/pieroproietti/penguins-krill), 
[jtsi](https://meet.jit.si/PenguinsEggsMeeting), 
[reddit](https://www.reddit.com/user/Artisan61), 
[telegram](https://t.me/penguins_eggs), 
[twitter](https://twitter.com/pieroproietti).

# Copyright and licenses
Copyright (c) 2017, 2023 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
