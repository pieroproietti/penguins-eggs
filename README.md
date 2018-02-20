## penguin's eggs

![penguins-eggs](https://github.com/pieroproietti/penguins-eggs/blob/master/src/assets/penguins-eggs.png?raw=true)

[![NPM Package](https://img.shields.io/npm/v/penguins-eggs.svg?style=flat)](https://npmjs.org/package/penguins-eggs "View this project on npm")
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)


penguins-eggs is a console utility, in active development, who let you to
remaster your system and redistribuite it as iso images or from the lan via PXE
remote boot.

The scope of this project is to implement the process of remastering your
version of Linux, generate it as ISO images, burn it on a DVD/install or a usb
key to boot your system or, alternately, remote boot it on your entire lan.

It can create your iso image of your system, but also include all the necessary 
services dhcp, dhcp-proxy, tftp and http to realize a fast and powerfull PXE 
server who can work alone or inside a preesistent LAN architecture.

it is written in nodejs, so ideally can be used with differents Linux distros.
At the moment it is tested with Debian 9 Stretch, Debian 8 Jessie, Ubuntu and
derivates as Linux Mint. For others distros we need to find collaboration.

penguins-eggs, at the moment 2017 december 7 is in a joung state, and can have
same troubles for people not in confidence with Linux system administration, but
can be already extremely usefull: imagine to install it on an lan and start to
manage the computers with it. You can easily install clonezilla on it, or clamav
and you have a tool to backup/restore/sanityze your entire infrastructure.

You can, also easily create your organization/school distro and deploy it on the
lan, give it to your friend as usb key or publish in the internet!

I build and test penguins-eggs on a customized version of
[Proxmox VE](https://pve.proxmox.com/wiki/Main_Page) who let me to  
create/destroy a lot of virtual PCs with different configurations: one or more
net cards, processor, memory and so on. This version of Proxmox VE, called
Incubator (previous name was Fabrica) who consist in PVE plus Cinnamon Desktop
and all the necessary to develop is build with eggs.

You can test now penguins-eggs, it is a console utility - no GUI - but don't be
scared, penguins-eggs is a console command - really very simple usage - if you 
are able to open a terminal, you can use it.

## Commands
* spawn
* kill
* hatch
* cuckoo

### spawn
The function of spawn is to generate the egg. Your system is copied and packaged
as an iso file. This is a live system version of your real system, and you can
masterize it or put in a USB key and use, and install your version of linux on
everyone computer. The command spawn accept the parameter ```-d``` or
```--distroname``` who, as the name implies is the name and, also, the hostname
of your live system.

Example:
```sudo eggs spawn -d mydistroname```

### kill
As the name say is the operation of break and kill the egg created. You will
free your system from the egg.

Example: ```sudo eggs kill```

### hatch
An egg to became penguin need to be hatched! In our case we simply need to give
to the egg the informations for installation and - in few minuts - (far
  before the fatitical 21 days) we will have a new penguin.

Example:
```sudo eggs spawn```

### cuckoo
Yes, there is another action possible on the egg, we can start our egg from the
net by PXE, in this case, in the system we need to give the action:

Example:
```sudo eggs cuckoo```

And boot via PXE a remote computer in the same net. The PC will be booted with
our egg and we will hatch it on the new pc. In same way, it's like the behaviour
of the cuckoo, who leave is egg in a nest of the another bird. From this the name of
the action.

## Options
* -d --distroname <distroname>

If you dont use this option, the computer hostname will used as distroname.
The image iso generated, will be called distroname-YYYY-MM-DD_HHMM-ZZ
Where YYYY-MM-DD-HHMM is year, MM mount, DD day. HHMM is your local time and
ZZ the difference betwen your local time and the greenwich one.

eg: host ``penguin`` will produce an iso called ``penguin-2017-10-22_2047_02.iso``

## Install penguins-eggs
Well, it is time to try it!

### Install prerequisites
Of course penguins-eggs need [nodejs](https://nodejs.org/en/download/package-manager/) installed.

penguins-eggs depend on this packages (lvm2 parted squashfs-tools xorriso live-boot syslinux syslinux-common isolinux pxelinux).
Let's go to install them, before to start to use it. Copy and paste the following two lines:

```sudo apt-get update```

```sudo apt-get install lvm2 parted squashfs-tools xorriso live-boot syslinux syslinux-common isolinux pxelinux```

### Install from the source
To try it, you need a functional installation of Linux Debian version 8 or 9, Ubuntu or derivates.
You can download last version on github.com. Copy and past the following lines:

``` bash
 git clone https://github.com/pieroproietti/penguins-eggs
 cd penguins-eggs
 npm i
```
To launch egg, in developer mode:
 ```sudo npm  start spawn```
 
or, to build and link it, before to use:

```npm run build```

```sudo npm link```

```sudo eggs spawn```

## Installation via npm
You can install it with npm (node package manager). Copy and past the following lines:

```sudo npm i penguins-egg -g```

```sudo eggs```

Attention: Due a problem in a node package, can be necessary to break the installation [Ctrl-C] and restart it.

## Packages
You can download the package in format .deb. (Not ready yet)

# It's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, the live is inside! :-D

## More informations
For other informations, look at http://pieroproietti.github.com or write me. The author

(Mail) author: piero.proietti@gmail.com
(Facebook group):  [Pinguino Eggs](https://www.facebook.com/groups/128861437762355/)
(gitter) [gitter](https://gitter.im/penguins-eggs/Lobby)
