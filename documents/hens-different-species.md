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

In the host system I have virt-viewer installed and on the virtual machine I install always spice-vdagent to 
can adapt the monitor of the VM to the window, cut and past and so on.

The entire process of prepare an egg take about 1/2 minutes using --fast option, and the resultig image is about 
1.2 GB on Debian with --max compression.


# Prepare a Debian hen
We try to install a light version of Debian
* install [Debian](https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-11.2.0-amd64-netinst.iso), we need just a nel-install, don't install GUI at this point.
* install light GUI xfce: ```apt install xfce4 xfce4-terminal firefox-esr lightdm```

## Adding developing tools
* install code: [download](https://code.visualstudio.com/download#) and install with ```sudo dpkg -i code_1.63.2-1639562499_amd64.deb```
* install build-essential: ```apt install build-essential```
* install nodejs: as root
```curl -fsSL https://deb.nodesource.com/setup_16.x | bash -```
```apt-get install -y nodejs```
* install git: ```apt install git```
* install spice-vdagent: ```apt install spice-vdagent```
* continue with [downloading eggs form repo](#downloading-eggs-from-repo)


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
