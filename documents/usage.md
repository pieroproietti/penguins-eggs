
![penguins-eggs](https://github.com/pieroproietti/penguins-eggs/blob/master/assets/penguins-eggs.png?raw=true)
# penguin's eggs

[![NPM Package](https://img.shields.io/npm/v/penguins-eggs.svg?style=flat)](https://npmjs.org/package/penguins-eggs "View this project on npm")
[![Build Status](https://travis-ci.org/pieroproietti/penguins-eggs.svg?branch=master)](https://travis-ci.org/pieroproietti/penguins-eggs)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![Join the chat at https://gitter.im/penguins-eggs/Lobby](https://badges.gitter.im/pieroproietti/penguins-eggs.svg)](https://gitter.im/penguins-eggs/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
&nbsp;[gitbook](https://penguin-s-eggs.gitbook.io/project/) &nbsp;[leggimi](./README.it_IT.md)&nbsp;[trends](https://www.npmtrends.com/penguins-eggs) &nbsp;[sourceforge](https://sourceforge.net/projects/penguins-eggs/)  &nbsp;[notes](https://github.com/pieroproietti/penguins-eggs/blob/master/developer.md)

# Usage

## Commands
On the eggs you can do same actions:
* eggs produce`](#eggs-produce)
* eggs info
* eggs install
* eggs prerequisites
* eggs calamares
* eggs update
* eggs kill
* eggs sterilize
* eggs help

### produce ALIASES spawn, lay
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

### install ALIASES hatch
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

### prerequisites
You must use it once before to use eggs, it will install various Debian packages needing for the process of building iso.

### calamares
On Debian Buster and other distros where the package calamares exist,this option install calamares and configure it. 

### update (aggiornamento di penguin's eggs)
You can update your version of penguins-eggs with the last version published.

```sudo eggs update```

### sterilize (remove live packages)
When you decide your system is ok, you can remove the live packages and sterilize your penguin. 

### kill (remove ISO images and free spaces)
As the name say is the operation of break and kill the egg created. You will
free your system from the egg.

```sudo eggs kill```


## Options
* -d --distroname <distroname>
* -b --branding <branding>

If you dont use this option, the computer hostname will used as distroname.
The image iso generated, will be called distroname-lv-ARC_YYYY-MM-DD_HHMM-ZZ
Where ARC='i386 or x64, YYYY-MM-DD-HHMM is year, MM mount, DD day. HHMM is your 
local time and ZZ the difference betwen your local time and the greenwich one.

eg: host ``penguin`` will produce an iso called ``penguin-i386_2017-10-22_2047_02.iso``


## Development
I build and test penguins-eggs on a customized version of
[Proxmox VE](https://pve.proxmox.com/wiki/Main_Page) who let me to  create/destroy
a lot of virtual PCs with different configurations: one or more net cards,
processor, memory and so on. It is easy to have, install Debian Stretch
with your preferedd GUI, I use cinnamon, and follow this
[howto](https://pve.proxmox.com/wiki/Install_Proxmox_VE_on_Debian_Stretch) in their site.

# Distributions supported
At the moment penguins-eggs is working on:
* Debian 10, 9, 8 and sid
* Ubuntu 19.04
* Linux Mint 19.2, LMDE 3
* Busenlabs helium (all versions)
This was tested on decembre 2019, due the continuus evolving of distros need to be confirmed.

