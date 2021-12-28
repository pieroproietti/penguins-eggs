
An hen is a female penguin able to produce eggs. 

In our case it is a light workstation we build to develop and test penguins-eggs. 

We need a light system becouse, often our tests consist on the creation of a live version 
of the system itself and this became a long history with heavvy systems.

Generally i use to work a virtual machine, on a Proxmox VE installation, with minimum requisites:
* cores: 2
* memory: 4096
* name: Debian
* sockets: 2
* vga: qxl

In the host system I have virt-viewer installed and on the virtual machine I install always spice-vdagent to 
can adapt the monitor of the VM to the window, cut and past and so on.


# Prepare a Debian hen

* install [Debian](https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-11.2.0-amd64-netinst.iso)
* install light GUI xfce: ```apt install xfce4 xfce4-terminal firefox-esr lightdm```
* install code: [download](https://code.visualstudio.com/download#) and install with ```sudo dpkg -i code_1.63.2-1639562499_amd64.deb```
* install build-essential: ```apt install build-essential```
* install nodejs: as root
```curl -fsSL https://deb.nodesource.com/setup_16.x | bash -```
```apt-get install -y nodejs```
* install spice-vdagent: ```apt install spice-vdagent```

# Prepare a manjaro hen
We try to install a light version on manjaro
* install manjaro-xfce-21.1.6-minimal-211017-linux513.iso

## Addind developing tools
* install code: ```sudo pacman -S vscode```
* install base-devel: ```sudo pacman -S base-devel``` Something like Debian build-essential package
* install node: ```sudo pacman -S "nodejs=16.13.1"``` I choose version 16.13.1 just to be pair with Debian hen
* install npm: ```sudo pacman -S npm```
* install spice-vdgent: ```sudo pacman -S spice-vdagent```


# Downloading eggs from repo:
* get eggs: ```git clone https://pieroproietti/penguins-eggs```
* install node packages in eggs
    * ```cd penguins-eggs```
    * ```npm i```

# Configure eggs
eggs need differents packages to work, this packages are installed by the command: sudo config, 
the same command take cure to add in /etc/bash_completion.d eggs-bash.sh for autocompletion,
create an eggs.yml and a tools.yml in /etc/penguins-eggs.d.

* ```sudo ./eggs config --clean --verbose``` this will install prerequisites
* ```sudo ./eggs config --clean --verbose``` the second config will configure correctly eggs
* ```sudo ./eggs dad -d``` will config eggs to defaults (prefix, etx)

# Producing our first iso
* sudo ./eggs produce --fast --verbose


# Contacts
* [blog Penguin's eggs](https://penguins-eggs.net)    
* [facebook penguin's eggs group](https://www.facebook.com/groups/128861437762355/)
* [mail piero.proietti@gmail.com](mailto://pieroproietti@gmail.com)
* [sources](https://github.com/pieroproietti/penguins-krill)
* [telegram](telegram.me/PieroProietti)
* [twitter](https://twitter.com/pieroproietti)





