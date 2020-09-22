penguins-eggs
=============

### Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-blue)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-blue)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.sourceforge.io/)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-blue)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-orange)](https://sourceforge.net/projects/penguins-eggs/files/packages-deb)
[![iso](https://img.shields.io/badge/iso-images-orange)](https://sourceforge.net/projects/penguins-eggs/files/iso)


# Index
<!-- toc -->
* [Index](#index)
* [Presentation](#presentation)
* [Addons](#addons)
* [What distributions can I use?](#what-distributions-can-i-use)
* [Install penguins-eggs](#install-penguins-eggs)
* [Usage](#usage)
* [Commands](#commands)
* [That's all Folks!](#thats-all-folks)
<!-- tocstop -->

# Presentation
penguins-eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso images or from the lan via PXE
remote boot.

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb
key to boot your system. You can also boot your egg - via remote boot - on your LAN.

All it is written in pure typescript, so ideally can be used with differents Linux distros. Yes, there are big differences about package manager used, but not so much in the way to work of bash and various programs used to build the iso.

penguins-eggs, at the moment 2020 september 13 is a mature tool, yes can have again same troubles for people not in confidence with Linux system 
administration, but can be already extremely usefull, You can easily create your organization/school version of Linux and deploy it on your LAN, give it to 
your friends as usb key or publish eggs in the internet!

You can try now penguins-eggs, it is a console utility - no GUI - but don't be scared, penguins-eggs is a console command - really very simple - if you
are able to open a terminal, you can use it.

# Addons
Starting with version 7.6.x, an addons architecture has been added  to eggs, that allows third parties to develop extensions. Note that we currently have an extension for the theme that includes both calamares branding and installer link and icon. In addition, also as addon has been developed others addons, to chosen hoosing between GUI or CLI installation, adapd video resolution, etc.

# What distributions can I use?
Eggs was born on Debian, but you can use it on Devuan, Ubuntu and derivatives. I usually try it on Debian buster, Devuan beowulf and Ubuntu 20.04 focal before releases. It is known that it can also work with Debian stretch, Ubuntu bionic, Ubuntu xenial and derivatives like LinuxMint and Deepin. If you try a further distribution successfully, you can warn me to add it to the list. 


Some iso images remastered with eggs are in the [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/iso/). 

## Note about deb packages

You can use the same package for all distributions using deb, naturally choosing the appropriate architecture (i386/amd64).


# Install penguins-eggs

## Debian package
Actually eggs is released both in deb package for i386 as amd64 architectures.

This simplest way to installe eggs is to download the [package eggs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) from [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/) and install it

```
sudo dpkg -i eggs_7.5.122-1_amd64.deb
```

or, on a i386 system:
```
sudo dpkg -i eggs_7.5.122-1_i386.deb
```

_Note about deb packages_ You can use the same package for all distributions using deb, naturally choosing the appropriate architecture (i386/amd64).

_Notes on nodejs versions and i386 architecture_ . You can read more about at [i386-nodejs](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/i386-nodejs.md).

## NPM package (require nodejs)

If you have already nodejs installed, you can install penguins-eggs with the utility npm (node package manager).

Simply copy and past the following lines:

```sudo npm config set unsafe-perm true```

```sudo npm i penguins-eggs -g```

# Usage
<!-- usage -->
```sh-session
$ npm install -g penguins-eggs
$ eggs COMMAND
running command...
$ eggs (-v|--version|version)
penguins-eggs/7.6.40 linux-x64 node-v14.10.1
$ eggs --help [COMMAND]
USAGE
  $ eggs COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`eggs adapt`](#eggs-adapt)
* [`eggs calamares`](#eggs-calamares)
* [`eggs clean`](#eggs-clean)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs howto:configuration`](#eggs-howtoconfiguration)
* [`eggs howto:grub`](#eggs-howtogrub)
* [`eggs howto:initrd`](#eggs-howtoinitrd)
* [`eggs info`](#eggs-info)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs locales`](#eggs-locales)
* [`eggs prerequisites`](#eggs-prerequisites)
* [`eggs produce`](#eggs-produce)
* [`eggs skel`](#eggs-skel)
* [`eggs sterilize`](#eggs-sterilize)
* [`eggs update`](#eggs-update)

## `eggs adapt`

auto adapt monitor resolution

```
USAGE
  $ eggs adapt

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ eggs adjust
```

_See code: [src/commands/adapt.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/adapt.ts)_

## `eggs calamares`

configure calamares or install and configure it

```
USAGE
  $ eggs calamares

OPTIONS
  -c, --configuration  creation of configuration files only
  -h, --help           show CLI help
  -v, --verbose
  --sterilize          sterilize: remove eggs prerequisites, calamares and all it's dependencies
  --theme=theme        theme/branding for eggs and calamares

EXAMPLES
  ~$ sudo eggs calamares 
  install calamares and create configuration

  ~$ sudo eggs calamares -c 
  create/renew calamares configuration files
```

_See code: [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/calamares.ts)_

## `eggs clean`

clean system log, apt, etc

```
USAGE
  $ eggs clean

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose
```

_See code: [src/commands/clean.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/clean.ts)_

## `eggs help [COMMAND]`

display help for eggs

```
USAGE
  $ eggs help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `eggs howto:configuration`

configure eggs

```
USAGE
  $ eggs howto:configuration

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/howto/configuration.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/howto/configuration.ts)_

## `eggs howto:grub`

boot from grub rescue

```
USAGE
  $ eggs howto:grub
```

_See code: [src/commands/howto/grub.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/howto/grub.ts)_

## `eggs howto:initrd`

Test initrd

```
USAGE
  $ eggs howto:initrd

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
  --check=check  check if necessary to clean initrd.img
  --clean=clean  clean the initrd.img
```

_See code: [src/commands/howto/initrd.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/howto/initrd.ts)_

## `eggs info`

informations about system and eggs

```
USAGE
  $ eggs info

EXAMPLE
  $ eggs info
  You will find here informations about penguin's eggs!
```

_See code: [src/commands/info.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/info.ts)_

## `eggs install`

system installation (the eggs became penguin)

```
USAGE
  $ eggs install

OPTIONS
  -g, --gui        use gui installer
  -h, --info       show CLI help
  -l, --lvmremove  remove lvm /dev/pve
  -u, --umount     umount devices
  -v, --verbose    verbose

ALIASES
  $ eggs hatch

EXAMPLE
  $ eggs install
  penguin's eggs installation
```

_See code: [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/install.ts)_

## `eggs kill`

kill the eggs/free the nest

```
USAGE
  $ eggs kill

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose

EXAMPLE
  $ eggs kill
  kill the eggs/free the nest
```

_See code: [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/kill.ts)_

## `eggs locales`

install/clean locales

```
USAGE
  $ eggs locales

OPTIONS
  -h, --help       show CLI help
  -r, --reinstall  reinstall locales
  -v, --verbose    verbose
```

_See code: [src/commands/locales.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/locales.ts)_

## `eggs prerequisites`

install packages prerequisites to run eggs

```
USAGE
  $ eggs prerequisites

OPTIONS
  -c, --configuration_only  creation of configuration files only
  -h, --help                show CLI help
  -l, --links               creation of links
  -v, --verbose             verbose

EXAMPLES
  ~$ eggs prerequisites
  install prerequisites and create configuration files

  ~$ eggs prerequisites -c
  only create configuration files
```

_See code: [src/commands/prerequisites.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/prerequisites.ts)_

## `eggs produce`

livecd creation. The system produce an egg

```
USAGE
  $ eggs produce

OPTIONS
  -b, --basename=basename  basename egg
  -c, --compress           max compression
  -f, --fast               fast compression
  -h, --help               show CLI help
  -s, --script             script mode. Generate scripts to manage iso build
  -v, --verbose            verbose
  --adapt                  adapt video resolution in VM
  --ichoice                allows the user to choose the installation type cli/gui
  --pve                    administration of virtual machines (Proxmox-VE)
  --rsupport               remote support via dwagent
  --sterilize              sterilize: remove eggs prerequisites, calamares and all it's dependencies
  --theme=theme            theme/branding for eggs and calamares

ALIASES
  $ eggs spawn
  $ eggs lay

EXAMPLES
  $ sudo eggs produce 
  produce an ISO called [hostname]-[arch]-YYYY-MM-DD_HHMM.iso, compressed xz (standard compression).
  If hostname=ugo and arch=i386 ugo-x86-2020-08-25_1215.iso

  $ sudo eggs produce -v
  the same as the previuos, but with more explicative output

  $ sudo eggs produce -vf
  the same as the previuos, compression lz4 (fast compression, but about 30%
  less compressed compared xz standard)

  $ sudo eggs produce -vc
  the same as the previuos, compression xz -Xbcj x86 (max compression, about 10%
  more compressed compared xz standard)

  $ sudo eggs produce -vf --basename leo --theme debian --adapt 
  produce an ISO called leo-i386-2020-08-25_1215.iso compression lz4,
  using Debian theme and link to adapt

  $ sudo eggs produce -v --basename leo --theme debian --adapt 
  produce an ISO called leo-i386-2020-08-25_1215.iso compression xz,
  using Debian theme and link to adapt

  $ sudo eggs produce -v --basename leo --rsupport 
  produce an ISO called leo-i386-2020-08-25_1215.iso compression xz, using eggs
  theme and link to dwagent

  $ sudo eggs produce -vs --basename leo --rsupport 
  produce scripts to build an ISO as the previus example. Scripts can be found
  in /home/eggs/ovarium and you can customize all you need
```

_See code: [src/commands/produce.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/produce.ts)_

## `eggs skel`

update skel from home configuration

```
USAGE
  $ eggs skel

OPTIONS
  -h, --help       show CLI help
  -u, --user=user  user to be used
  -v, --verbose

EXAMPLE
  $ eggs skel --user mauro
  desktop configuration of user mauro will get used as default
```

_See code: [src/commands/skel.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/skel.ts)_

## `eggs sterilize`

remove all packages installed as prerequisites and calamares

```
USAGE
  $ eggs sterilize

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose
```

_See code: [src/commands/sterilize.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/sterilize.ts)_

## `eggs update`

update/upgrade the penguin's eggs tool.

```
USAGE
  $ eggs update

DESCRIPTION
  This way of update work only with npm installation, if you used the debian package version, please download the new 
  one and install it.

EXAMPLE
  $ eggs update
  update/upgrade the penguin's eggs tool
```

_See code: [src/commands/update.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.40/src/commands/update.ts)_
<!-- commandsstop -->

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations

You can find more informations at [Penguin's eggs blog](https://penguins-eggs.net).

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* mail: piero.proietti@gmail.com

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
