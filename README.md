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
* [Yolk](#yolk)
* [What distributions can I use?](#what-distributions-can-i-use)
* [Packages](#packages)
* [Usage](#usage)
* [Commands](#commands)
* [Terminal samples](#terminal-samples)
* [That's all Folks!](#thats-all-folks)
<!-- tocstop -->

# Presentation
penguins-eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso images or from the lan via PXE remote boot.

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb key to boot your system. You can also boot your egg - via remote boot - on your LAN. You can easily install your live system with gui calamares installer or eggs cli installer.

All it is written in pure typescript, so ideally can be used with differents Linux distros. Yes, there are big differences about package manager used, but not so much in the way to work of bash and various programs used to build the iso.

penguins-eggs, at the moment 2020 november 2 is a mature tool and is extremely usefull, You can easily create your organization/school version of Linux and deploy it on your LAN, give it to your friends as usb key or publish yours eggs in the internet!

Try penguins-eggs yes, it is a console utility - no GUI - but don't be scared, penguins-eggs is a console command - really very simple - if you are able to open a terminal, you can use it and yours final users will enjoy of full gui and pratical installer to install your livecd.

# Addons
Starting with version 7.6.x, an addons architecture has been added  to eggs, that allows third parties to develop extensions. Note that we currently have an extension for the theme that includes both calamares branding and installer link and icon. In addition, also as addon has been developed others addons, to chosen hoosing between GUI or CLI installation, adapd video resolution, etc.

# Yolk 
yolk so called - staying on the subject of eggs - is a local repository included in the livecd that contains a minimum of indispensable packages during installation. Thanks to yolk, you can safely install your system without the need for an internet connection.

# What distributions can I use?
Eggs is born on Debian strecth/buster, full support Debian bullseys, Devuan beowulf, Ubuntu focal, bionic and derivatives. I usually try it against Debian buster, Devuan beowulf, Linux Mint 19.3 tricia (bionic derivated) and Linux Mint 20 ulyana (focal derivated) before releases. I tried it successfully in LMDE 4 debbie, and deepin. Eggs, generally must work with all the derivates from that distros.

Some iso images remastered with eggs are in the [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/iso/). 

## Note about deb packages

You can use the same package for all distributions using deb, naturally choosing the appropriate architecture (i386/amd64).

# Packages
eggs is released as deb package and npm package. If you use nodejs npm version can be indicated, most of users need just deb version.

## deb packages
eggs is released deb packages for i386 and amd64 architectures.

### Install
This simplest way to installe eggs is download the [package eggs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) from [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/) and install it

```
sudo dpkg -i eggs_7.6.65-1_amd64.deb
```

or, on a i386 system:
```
sudo dpkg -i eggs_7.6.65-1_i386.deb
```
### update
The fastest way to update is to use the flag -i in update. Eggs let you to select the version to install and install it.

```sudo eggs update -i```

Of course, if your distro include eggs in the repositury, you can use apt too.


_Note about deb packages_ You can use the same package for all distributions using deb, naturally choosing the appropriate architecture (i386/amd64).

## npm packages

If you have nodejs installed, you can install penguins-eggs with the utility npm (node package manager).

Simply copy and past the following lines:

```sudo npm config set unsafe-perm true```

```sudo npm i penguins-eggs@latest -g```

### update

```sudo eggs update```

# Usage
<!-- usage -->
```sh-session
$ npm install -g penguins-eggs
$ eggs COMMAND
running command...
$ eggs (-v|--version|version)
penguins-eggs/7.6.86 linux-x64 node-v14.15.3
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
* [`eggs export:deb`](#eggs-exportdeb)
* [`eggs export:docs`](#eggs-exportdocs)
* [`eggs export:iso`](#eggs-exportiso)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs info`](#eggs-info)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs prerequisites`](#eggs-prerequisites)
* [`eggs produce`](#eggs-produce)
* [`eggs remove`](#eggs-remove)
* [`eggs tools:clean`](#eggs-toolsclean)
* [`eggs tools:initrd`](#eggs-toolsinitrd)
* [`eggs tools:locales`](#eggs-toolslocales)
* [`eggs tools:pve`](#eggs-toolspve)
* [`eggs tools:sanitize`](#eggs-toolssanitize)
* [`eggs tools:skel`](#eggs-toolsskel)
* [`eggs tools:yolk`](#eggs-toolsyolk)
* [`eggs update`](#eggs-update)

## `eggs adapt`

adapt monitor resolution for VM only

```
adapt monitor resolution for VM only

USAGE
  $ eggs adapt

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ eggs adjust
```

_See code: [src/commands/adapt.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/adapt.ts)_

## `eggs calamares`

calamares or install or configure it

```
calamares or install or configure it

USAGE
  $ eggs calamares

OPTIONS
  -f, --final    final: remove eggs prerequisites, calamares and all it's dependencies
  -h, --help     show CLI help
  -i, --install  install calamares and it's dependencies
  -v, --verbose
  --theme=theme  theme/branding for eggs and calamares

EXAMPLES
  ~$ sudo eggs calamares 
  create/renew calamares configuration's files

  ~$ sudo eggs calamares -i 
  install calamares and create it's configuration's files
```

_See code: [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/calamares.ts)_

## `eggs export:deb`

export package eggs-v7-6-x-1.deb in the destination host

```
export package eggs-v7-6-x-1.deb in the destination host

USAGE
  $ eggs export:deb

OPTIONS
  -a, --armel  remove old .deb before to copy
  -c, --clean  remove old .deb before to copy
  -h, --help   show CLI help
```

_See code: [src/commands/export/deb.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/export/deb.ts)_

## `eggs export:docs`

remove and export docType documentation of the sources in the destination host

```
remove and export docType documentation of the sources in the destination host

USAGE
  $ eggs export:docs

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/export/docs.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/export/docs.ts)_

## `eggs export:iso`

export iso in the destination host

```
export iso in the destination host

USAGE
  $ eggs export:iso

OPTIONS
  -c, --clean  delete old ISOs before to copy
  -h, --help   show CLI help
```

_See code: [src/commands/export/iso.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/export/iso.ts)_

## `eggs help [COMMAND]`

display help for eggs

```
display help for <%= config.bin %>

USAGE
  $ eggs help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `eggs info`

informations about system and eggs

```
informations about system and eggs

USAGE
  $ eggs info

EXAMPLE
  $ eggs info
  You will find here informations about penguin's eggs!
```

_See code: [src/commands/info.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/info.ts)_

## `eggs install`

eggs installer - (the egg became penguin)

```
eggs installer - (the egg became penguin)

USAGE
  $ eggs install

OPTIONS
  -c, --cli        try to use antiX installer (cli)
  -g, --gui        use Calamares installer (gui)
  -h, --info       show CLI help
  -l, --lvmremove  remove lvm /dev/pve
  -m, --mx         try to use MX installer (gui)
  -u, --umount     umount devices
  -v, --verbose    verbose

ALIASES
  $ eggs hatch

EXAMPLE
  $ eggs install
  Install the system with eggs cli installer(default)
```

_See code: [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/install.ts)_

## `eggs kill`

kill the eggs/free the nest

```
kill the eggs/free the nest

USAGE
  $ eggs kill

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose

EXAMPLE
  $ eggs kill
  kill the eggs/free the nest
```

_See code: [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/kill.ts)_

## `eggs prerequisites`

install packages prerequisites to run eggs

```
install packages prerequisites to run eggs

USAGE
  $ eggs prerequisites

OPTIONS
  -c, --configuration  create configuration's files
  -h, --help           show CLI help
  -v, --verbose        verbose

EXAMPLES
  ~$ eggs prerequisites
  install prerequisites and create configuration files

  sudo eggs prerequisites -c
    create configuration's file
```

_See code: [src/commands/prerequisites.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/prerequisites.ts)_

## `eggs produce`

the system produce an egg: livecd creation.

```
the system produce an egg: livecd creation.

USAGE
  $ eggs produce

OPTIONS
  -b, --basename=basename  basename egg
  -c, --compress           max compression
  -f, --fast               fast compression
  -h, --help               show CLI help
  -s, --script             script mode. Generate scripts to manage iso build
  -v, --verbose            verbose
  -y, --yolk               -y force the renew of the local repository yolk
  --adapt                  adapt video resolution in VM
  --final                  final: remove eggs prerequisites, calamares and all it's dependencies
  --ichoice                allows the user to choose the installation type cli/gui
  --pve                    administration of virtual machines (Proxmox-VE)
  --rsupport               remote support via dwagent
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

_See code: [src/commands/produce.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/produce.ts)_

## `eggs remove`

remove eggs, eggs configurations, prerequisites, calamares, calamares configurations

```
remove eggs, eggs configurations, prerequisites, calamares, calamares configurations

USAGE
  $ eggs remove

OPTIONS
  -a, --all            remove all
  -h, --help           show CLI help
  -p, --prerequisites  remove eggs packages prerequisites
  -v, --verbose        verbose
  --purge              remove eggs, eggs configuration

ALIASES
  $ eggs sterilize

EXAMPLES
  $ sudo eggs remove 
  remove eggs

  $ sudo eggs remove --purge 
  remove eggs, eggs configurations

  $ sudo eggs remove --prerequisites 
  remove packages prerequisites, calamares, calamares configurations

  $ sudo eggs remove --all
  remove eggs, eggs configurations, prerequisites, calamares, calamares configurations
```

_See code: [src/commands/remove.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/remove.ts)_

## `eggs tools:clean`

clean system log, apt, etc

```
clean system log, apt, etc

USAGE
  $ eggs tools:clean

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose
```

_See code: [src/commands/tools/clean.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/tools/clean.ts)_

## `eggs tools:initrd`

Test initrd

```
Test initrd

USAGE
  $ eggs tools:initrd

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
  --check=check  check if necessary to clean initrd.img
  --clean=clean  clean the initrd.img
```

_See code: [src/commands/tools/initrd.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/tools/initrd.ts)_

## `eggs tools:locales`

install/clean locales

```
install/clean locales

USAGE
  $ eggs tools:locales

OPTIONS
  -h, --help       show CLI help
  -r, --reinstall  reinstall locales
  -v, --verbose    verbose
```

_See code: [src/commands/tools/locales.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/tools/locales.ts)_

## `eggs tools:pve`

enable/start/stop pve-live

```
enable/start/stop pve-live

USAGE
  $ eggs tools:pve

OPTIONS
  -d, --disable  disable
  -e, --enable   enable
  -h, --help     show CLI help
  -v, --verbose  stop service
  --start        start
  --stop         stop service
```

_See code: [src/commands/tools/pve.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/tools/pve.ts)_

## `eggs tools:sanitize`

sanitize

```
sanitize

USAGE
  $ eggs tools:sanitize

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/tools/sanitize.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/tools/sanitize.ts)_

## `eggs tools:skel`

update skel from home configuration

```
update skel from home configuration

USAGE
  $ eggs tools:skel

OPTIONS
  -h, --help       show CLI help
  -u, --user=user  user to be used
  -v, --verbose

EXAMPLE
  $ eggs skel --user mauro
  desktop configuration of user mauro will get used as default
```

_See code: [src/commands/tools/skel.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/tools/skel.ts)_

## `eggs tools:yolk`

configure eggs to install without internet

```
configure eggs to install without internet

USAGE
  $ eggs tools:yolk

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

EXAMPLE
  $ eggs yolk -v
```

_See code: [src/commands/tools/yolk.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/tools/yolk.ts)_

## `eggs update`

update the penguin's eggs tool.

```
update the penguin's eggs tool.
This method always works, both with npm and deb packages.

USAGE
  $ eggs update

OPTIONS
  -a, --apt      if eggs package is .deb, update from distro repositories
  -b, --basket   if eggs package is .deb, update from eggs basket
  -h, --help     show CLI help
  -n, --npm      if eggs package is .npm, update from npmjs.com
  -v, --verbose  verbose

DESCRIPTION
  This method always works, both with npm and deb packages.

EXAMPLE
  $ eggs update
  update/upgrade the penguin's eggs tool
```

_See code: [src/commands/update.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.86/src/commands/update.ts)_
<!-- commandsstop -->

# Terminal samples

![terminal samples](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/terminal-lessons/eggs_help.gif?raw=true)

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations
There is [user's manual](https://penguins-eggs.net/book/) and same other documentation in [documents folder](./documents) of this repository.

Contact me via [gitter](https://gitter.im/penguins-eggs-1/community), or open an [issue](https://github.com/pieroproietti/penguins-eggs/issues) on github.

* penguin's eggs site: [penguin's eggs](https://penguins-eggs.net)
* facebook personal: [Piero Proietti](https://www.facebook.com/thewind61)
* facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/)
* facebook page:  [Penguin's Eggs](https://www.facebook.com/penguinseggs)
* mail: piero.proietti@gmail.com


## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
