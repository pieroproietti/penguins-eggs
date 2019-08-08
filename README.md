
![penguins-eggs](https://github.com/pieroproietti/penguins-eggs/blob/master/assets/penguins-eggs.png?raw=true)
# penguin's eggs

[![NPM Package](https://img.shields.io/npm/v/penguins-eggs.svg?style=flat)](https://npmjs.org/package/penguins-eggs "View this project on npm")
[![Build Status](https://travis-ci.org/pieroproietti/penguins-eggs.svg?branch=master)](https://travis-ci.org/pieroproietti/penguins-eggs)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![Join the chat at https://gitter.im/penguins-eggs/Lobby](https://badges.gitter.im/pieroproietti/penguins-eggs.svg)](https://gitter.im/penguins-eggs/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
&nbsp;[gitbook](https://penguin-s-eggs.gitbook.io/project/) &nbsp;[Leggimi](./README.it_IT.md)&nbsp;[trends](https://www.npmtrends.com/penguins-eggs) 


## Presentation
penguins-eggs is a console utility, in active development, who let you to
remaster your system and redistribuite it as iso images or from the lan via PXE
remote boot.

The scope of this project is to implement the process of remastering your
version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb
key to boot your system. You can also boot your egg - via remote boot - on your
LAN.

It can create your ISO image of your system, but also include all the necessary
services dhcp, dhcp-proxy, tftp and http to realize a fast and powerfull PXE
server who can work alone or inside a preesistent LAN architecture.

All it is written in pure nodejs, so ideally can be used with differents Linux
distros. At the moment it is tested with Debian 9 Stretch, Debian 8 Jessie,
Ubuntu and derivates as Linux Mint. For others distros we need to find
collaboration.

penguins-eggs, at the moment 2018 february 20 is in a joung state, and can have
same troubles for people not in confidence with Linux system administration, but
can be already extremely usefull: imagine to install it on an lan and start to
manage the computers with it. You can easily install clonezilla on it, or clamav
and you have a tool to backup/restore/sanityze your entire infrastructure.

You can, also easily create your organization/school distro and deploy it on your
LAN, give it to your friends as usb key or publish eggs in the internet!

You can try now penguins-eggs, it is a console utility - no GUI - but don't be
scared, penguins-eggs is a console command - really very simple usage - if you
are able to open a terminal, you can use it.

## Install penguins-eggs
Well, it is time to try it!

### Prerequisites
penguins-eggs need nodejs installed, use the version on the nodesource [repository](https://github.com/nodesource/distributions/blob/master/README.md#deb). You can install version 12 for AMD64, or the version 8 for i386 (i386 is not available for Node.js 10 and later) according your computer architecture.

If not already installed, You need also to install the ``build-essential`` package too.

```apt-get install build-essential```

penguins-eggs depend on various packages too, you must install them using once the option prerequisites.

### Installation penguins-eggs via npm

After You have installed nodejs, you can install penguins-eggs with the utility npm (node package manager). 
Simply copy and past the following lines:

```sudo npm config set unsafe-perm true```

```sudo npm i penguins-eggs -g```

### Installation penguins-eggs from source

You need a functional installation of Linux Debian version 8 or 9, LinuxMint, LMDE, 
Ubuntu or derivates, all the prerequisites plus the ``build-essential`` package.

```apt-get install build-essential```

At this point You can download last version on github.com. Copy and past the
following lines:

```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
npm i
```

You can launch egg, in developer mode, in this way:

```cd penguins-eggs```

```sudo npm run ts-start spawn```

or, in short: 

```./eggs spawn```

Of course, you can build it or link it.



## Commands
On the eggs you can do same actions:
* produce
* info
* hatch
* prerequisites
* calamares
* update
* kill

### produce (preparazione dell'uovo/creazione ISO)
The function of spawn is to generate the egg. Your system is copied and packaged
as an iso file. This is a live system version of your real system, and you can
masterize it or put in a USB key and use, and install your version of linux on
everyone computer. The command spawn accept the parameter ```-d``` or
```--distroname``` who, as the name implies is the name and, also, the hostname
of your live system.

```sudo eggs produce -d mydistroname```

### info
You will get the main information about your system. This information will be used in the process of spawn and configure the installer.

```sudo eggs info```

### hatch (cova dell'uovo/installazione)
An egg to became penguin need to be hatched! In our case we simply need to give
to the egg the informations for installation and - in few minuts - (far
  before the fatitical 21 days) we will have a new penguin.

```sudo eggs hatch```

You will be prompted to various parameters like: username, password, hostname,
domain, networking, installation device and type. Usually, you can accept the
defaults.

If is installed the package calamares, you can use it to install the system. 
Calamares is a GUI installer, pretty good and pratical. 

**Attention**: Don't be scared, but be attent to that you are doing here,
the operation of hatch is destructive and irreversible, and will format your
disk and destroy your data to prepare the machine for the installation of your
new penguin. **Be sure to have backup of your data before**.

### prerequisites (installa i prerequisiti)
You must use it once before to use eggs, it will install various Debian packages needing for the process of building iso.

```sudo eggs prerequisites```

The following packages will be installed: ```lvm2 parted squashfs-tools xorriso live-boot syslinux syslinux-common isolinux pxelinux`calamares qml-module-qtquick2 qml-module-qtquick-controls```


### calamares (crea la configurazione di calamares)
This command is usefull during develepment, it generate the calamares configuration on fly.

```sudo eggs calamares```

### update (aggionamento di penguin's eggs)
```sudo eggs update```


### kill (libera lo spazio occupato)
As the name say is the operation of break and kill the egg created. You will
free your system from the egg.

```sudo eggs kill```


## Options
* -d --distroname <distroname>

If you dont use this option, the computer hostname will used as distroname.
The image iso generated, will be called distroname-YYYY-MM-DD_HHMM-ZZ
Where YYYY-MM-DD-HHMM is year, MM mount, DD day. HHMM is your local time and
ZZ the difference betwen your local time and the greenwich one.

eg: host ``penguin`` will produce an iso called ``penguin-2017-10-22_2047_02.iso``


## Development
I build and test penguins-eggs on a customized version of
[Proxmox VE](https://pve.proxmox.com/wiki/Main_Page) who let me to  create/destroy
a lot of virtual PCs with different configurations: one or more net cards,
processor, memory and so on. It is easy to have, install Debian Stretch
with your preferedd GUI, I use cinnamon, and follow this
[howto](https://pve.proxmox.com/wiki/Install_Proxmox_VE_on_Debian_Stretch) in their site.

# Distributions supported
At the moment penguins-eggs is working on:
* Debian
* Ubuntu
* Linux Mint
* LMDE
* LMDE + Proxmox VE

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as
in the real, the live is inside! :-D

## More informations
For other informations, look at [Piero Proietti's blog](http://pieroproietti.github.com),
contact me, or open an [issue](https://github.com/pieroproietti/penguins-eggs/issues) on github.

* facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/)
* twitter: [@pieroproietti](https://twitter.com/pieroproietti)
* google+: [PieroProietti](https://plus.google.com/+PieroProietti)
* mail: piero.proietti@gmail.com

**sarcazzo**

## Copyright and licenses
Copyright (c) 2017, 2019 [Piero Proietti](http://pieroproietti.github.com), dual licensed under the MIT or GPL Version 2 licenses.
