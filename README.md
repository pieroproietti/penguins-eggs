# penguins-eggs

![penguins-eggs](https://github.com/pieroproietti/penguins-eggs/blob/master/src/assets/penguins-eggs.png?raw=true)

penguins-eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso images or from the lan with PXE remote boot.

It include all the necessary services dhcp, dhcp-proxy, tftp and http to realize a fast and powerfull PXE server who can work alone or inside a preesistent LAN architecture.

it is written in nodejs, so ideally can be used with different Linux distro. At the moment it work with Debian 8 Jessie and Debian 9 Stretch, soon will include Ubuntu and derivates. For others distros we need to find collaboration.

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO images, burn it on a DVD/install or a usb key or perform a remote boot on your entire lan.

penguins-eggs, at the moment 2017 october 22 is in a joung state, and can have same troubles for people not in confidence with Linux system administration, but can be already extremely usefull: imagine to install it on an lan and start to manage the computers with it. You can easily install clonezilla on it, or clamav and you have a tool to backup/restore/sanityze your entire infrastructure.

You can, also easily create your organization/school distro and deploy it on the lan, give it to your friend as usb key or publish in the internet!

I build and test it on a customized version of [Proxmox VE](https://pve.proxmox.com/wiki/Main_Page) who let me to  create/destroy a lot of virtual PCs with different configurations: one or more net cards, processor, memory and so on. This version of Proxmox VE, called Fabrica who consist in PVE plus Cinnamon Desktop and all the necessary to develop is build with eggs.

You can test now penguins-eggs, it is a console utility - no GUI yet - but don't be scared, all you need is to install [node](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)

penguins-eggs is a console command - really very simple usage - if you are able to open a terminal, you can use it.

## Commands
* create
* destroy
* serve
* hatch

### create
Will create an iso image of your system

### destroy
As the name say, will destroy (delete) all the infrastructure created.

### serve
Will start a PXE server, serving the eggs created (and others if You want)-

### hatch
Will install your system on the computer, or better will hatch the egg and it will became a penguin! Attetion: using penguins-eggs is safe and sure (as everyone other live distro), but the operation of hacthing (or installation) will erase all your previous system and datas. 

## Options
* -d --distroname <distroname>

If you dont use this option, the computer hostname will used as distroname.
The image iso generated, will be called distroname-YYYY-MM-DD_HHMM-ZZ
Where YYYY-MM-DD-HHMM is year, MM mount, DD day. HHMM is your local time and
ZZ the difference betwen your local time and the greenwich one.

eg: host ``penguin`` will produce an iso called ``penguin-2017-10-22_2047_02.iso``

## Testing penguins-eggs
Well, it is time to try it!
### Prerequisites
Penguins-eggs on Debian depend from this packages, you need to install them before to start to create.
``` bash
sudo apt-get update
sudo apt-get install squashfs-tools xorriso live-boot syslinux syslinux-common isolinux pxelinux
```

To test it, you need a functional installation of Linux Debian version 8 or 9:

``` bash
 git clone https://github.com/pieroproietti/penguins-eggs
 cd penguins-eggs
 npm i
```
To launch egg

``` bash
 sudo npm  start
```
or
``` bash
./eggs
```
## npm
Soon will be possible to install it by node package manager (npm). Eg:
``` bash
sudo npm i penguins-egg -g
sudo eggs
```
Of course, you need a working NodeJs 8.x or better installed.

## Packages
Later, I hope in december, to release a Debian/Ubuntu installation package.

# It's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, the live is inside! :-D

## informations
For other informations, write me. The author

(Mail) author: piero.proietti@gmail.com
(Facebook group):  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/)
