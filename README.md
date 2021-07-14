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
* [Packages](#packages)
* [Usage](#usage)
* [Commands](#commands)
* [Terminal samples](#terminal-samples)
* [That's all Folks!](#thats-all-folks)
<!-- tocstop -->

# Presentation
penguins-eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso images or from the lan via PXE remote boot.

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb key to boot your system. You can also boot your egg - via remote boot - on your LAN. You can easily install your live system with gui calamares installer or eggs cli installer.

All it is written in pure typescript, so ideally can be used with differents Linux distros. Yes, there are big differences about package manager used, but not so much in the way to work of bash and in the various programs used to build the iso.

penguins-eggs, at the moment 2021 may is a mature tool and is extremely usefull, You can easily create your personal customized iso or your organization/school version of Linux and deploy it on your LAN, give it to your friends as usb key or publish yours eggs in the internet!

Try penguins-eggs yes, it is a console utility - no GUI - but don't be scared, penguins-eggs is a console command - really very simple - if you are able to open a terminal, you can use it and yours final users will enjoy of full gui and pratical installer to install your livecd.

### addons
Starting with version 7.6.x, an addons architecture was added to eggs, allowing third parties to develop extensions. Note that currently we have an extension for the theme that includes both branding calamares, link and installer icon. In addition, also as an addon has been developed choose between GUI or CLI installation, adjust the video resolution, remote support, etc.

### backup
From version 8.0.10 You can use the backup mode by simply adding --backup in the produce command. This way eggs will save your users data and accounts and will not add a live user, you will have to log in with the main user of your system with the his password. **Note:** since eggs always configures autologin, you may have a security risk with valuable data. Use this option only for your personal stuff and do not share the iso on the network.

### krill
Starting with eggs 8.0.0 I included a new CLI installer named krill. krill let you to install your system in a nice CLI interface using the same, configuration created by eggs for [calamares](calamares.io). This lead to have "about the same" experience installing, from old distros to new one and for GUI and CLI. To force using krill in place of calamares in a GUI system just: **sudo eggs install --cli**

### mom and dad
I've added two lightweight assistants integrated with eggs: mom and dad. While mom is a bash script with whiptail - and guides the user to the various commands and documentation, dad started as a short way to create isos. All you have to do is type **sudo eggs dad** and follow simple instructions. You can also shortcut the way to reset the configuration **sudo dad -c** or - even faster - reset the configuration, load defaults, kill created isos. Simply type **sudo eggs dad -d** and you will immediately be able to produce the egg in the default /home/eggs nest.

I suggest to leave the default values unchanged during the development of your remaster. You will be more fast in producing eggs, enjoy of dad after reinstalling eggs. If you need more space, simply mount your big device in /home/eggs.

### yolk 
yolk so called - staying on the subject of eggs - is a local repository included in the livecd that contains a minimum of indispensable packages during installation. Thanks to yolk, you can safely install your system without the need of an active internet connection.

## What distributions can I use?
eggs was born on Debian strecth/buster, but actually full support Debian from jessie to sid (bullseye), Devuan beowulf, Ubuntu focal, bionic and derivatives. I actually try it against Debian varius versions, before releases. I tried it successfully in LMDE 4 debbie, and deepin. eggs, generally must work with all the derivates from that distros.

Some examples of iso images remastered with eggs are in the [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/iso/). 

## What architecture can I use?
From eggs v. 8.0.4 I'm releasing eggs in 4 differents architectures: **i386**, **amd64**, **arm64** and **armel**. eggs - at the moment - produce in i386 and amd64, but can be installed already on arm64 and armel. This mean who it is possible to install it in [raspberrypi](https://www.raspberrypi.org/), but again not possible to produce a [Raspberry Pi OS](https://www.raspberrypi.org/software/) egg in armel or arm64. I'm just working now to complete this step. 

**Note:** Of course it is possible to produce iso for [Raspberry Pi Desktop](https://downloads.raspberrypi.org/rpd_x86/images/) amd64 based.

# Packages
eggs is released as deb package and npm package. Most users need just deb version, if you already use nodejs the npm package can be installed too, 

## deb packages
eggs is released deb packages for i386 and amd64 architectures. Due the characteristic of eggs, they can installed in Debian, Devuan or Ubuntu based distros, withouth worries about different versions, except for the architecture. Lately was added scripts for preinst, postinst, prerm and postrm not presents in the original.

### Install
This simplest way to install eggs is download the [package eggs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) from [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/) and install it

```
sudo dpkg -i eggs_8.0.0-1_amd64.deb
```

or, on a i386 system:
```
sudo dpkg -i eggs_8.0.0-1_i386.deb
```
### update
The fastest way to use sudo eggs update and choose basket. Eggs let you to select the last 4 versions on the [basket](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) and install it.

```sudo eggs update```

Of course, if your distro include eggs in the repository, you can use apt.


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
penguins-eggs/8.0.29 linux-x64 node-v8.17.0
$ eggs --help [COMMAND]
USAGE
  $ eggs COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`eggs adapt`](#eggs-adapt)
* [`eggs autocomplete [SHELL]`](#eggs-autocomplete-shell)
* [`eggs calamares`](#eggs-calamares)
* [`eggs config`](#eggs-config)
* [`eggs dad`](#eggs-dad)
* [`eggs export:deb`](#eggs-exportdeb)
* [`eggs export:docs`](#eggs-exportdocs)
* [`eggs export:iso`](#eggs-exportiso)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs info`](#eggs-info)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs mom`](#eggs-mom)
* [`eggs produce`](#eggs-produce)
* [`eggs remove`](#eggs-remove)
* [`eggs tools:clean`](#eggs-toolsclean)
* [`eggs tools:locales`](#eggs-toolslocales)
* [`eggs tools:skel`](#eggs-toolsskel)
* [`eggs tools:stat`](#eggs-toolsstat)
* [`eggs tools:yolk`](#eggs-toolsyolk)
* [`eggs update`](#eggs-update)

## `eggs adapt`

adapt monitor resolution for VM only

```
USAGE
  $ eggs adapt

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ eggs adjust
```

_See code: [src/commands/adapt.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/adapt.ts)_

## `eggs autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ eggs autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ eggs autocomplete
  $ eggs autocomplete bash
  $ eggs autocomplete zsh
  $ eggs autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.3.0/src/commands/autocomplete/index.ts)_

## `eggs calamares`

calamares or install or configure it

```
USAGE
  $ eggs calamares

OPTIONS
  -f, --final    final: remove calamares and all it's dependencies after the installation
  -h, --help     show CLI help
  -i, --install  install calamares and it's dependencies
  -r, --remove   remove calamares and it's dependencies
  -v, --verbose
  --theme=theme  theme/branding for eggs and calamares

EXAMPLES
  ~$ sudo eggs calamares 
  create/renew calamares configuration's files

  ~$ sudo eggs calamares -i 
  install calamares and create it's configuration's files
```

_See code: [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/calamares.ts)_

## `eggs config`

Configure and install prerequisites deb packages to run it

```
USAGE
  $ eggs config

OPTIONS
  -c, --clean          remove old configuration before to create new one
  -h, --help           show CLI help
  -n, --nointeractive  assume yes
  -v, --verbose        verbose

ALIASES
  $ eggs prerequisites

EXAMPLE
  ~$ sudo eggs config
  Configure and install prerequisites deb packages to run it
```

_See code: [src/commands/config.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/config.ts)_

## `eggs dad`

ask help from daddy - configuration helper

```
USAGE
  $ eggs dad

OPTIONS
  -c, --clean    remove old configuration before to create
  -d, --default  remove old configuration and force default
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [src/commands/dad.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/dad.ts)_

## `eggs export:deb`

export deb/docs/iso to the destination host

```
USAGE
  $ eggs export:deb

OPTIONS
  -a, --all    export all archs
  -c, --clean  remove old .deb before to copy
  -h, --help   show CLI help
  --amd64      export amd64 arch
  --arm64      export arm64 arch
  --armel      export armel arch
  --i386       export i386 arch
```

_See code: [src/commands/export/deb.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/export/deb.ts)_

## `eggs export:docs`

remove and export docType documentation of the sources in the destination host

```
USAGE
  $ eggs export:docs

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/export/docs.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/export/docs.ts)_

## `eggs export:iso`

export iso in the destination host

```
USAGE
  $ eggs export:iso

OPTIONS
  -b, --backup  export backup ISOs
  -c, --clean   delete old ISOs before to copy
  -h, --help    show CLI help
```

_See code: [src/commands/export/iso.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/export/iso.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `eggs info`

thinking a different approach to CLI...

```
USAGE
  $ eggs info

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [src/commands/info.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/info.ts)_

## `eggs install`

command-line system installer - the egg became a penguin!

```
USAGE
  $ eggs install

OPTIONS
  -c, --cli      force use CLI installer
  -h, --help     show CLI help
  -v, --verbose  verbose

ALIASES
  $ eggs hatch
  $ eggs krill

EXAMPLE
  $ eggs install
  Install the system using GUI or CLI installer
```

_See code: [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/install.ts)_

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

_See code: [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/kill.ts)_

## `eggs mom`

ask for mommy - gui helper

```
USAGE
  $ eggs mom

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/mom.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/mom.ts)_

## `eggs produce`

the system produce an egg: iso image of your system

```
USAGE
  $ eggs produce

OPTIONS
  -b, --backup         backup mode
  -f, --fast           fast compression
  -h, --help           show CLI help
  -m, --max            max compression
  -n, --normal         normal compression
  -p, --prefix=prefix  prefix
  -s, --script         script mode. Generate scripts to manage iso build
  -v, --verbose        verbose
  -y, --yolk           -y force yolk renew
  --addons=addons      addons to be used: adapt, ichoice, pve, rsupport
  --basename=basename  basename
  --release            release: configure GUI installer to remove eggs and calamares after installation
  --theme=theme        theme for livecd, calamares branding and partitions

ALIASES
  $ eggs spawn
  $ eggs lay

EXAMPLES
  $ sudo eggs produce 
  produce an ISO called [hostname]-[arch]-YYYY-MM-DD_HHMM.iso, compressed xz (standard compression).
  If hostname=ugo and arch=i386 ugo-x86-2020-08-25_1215.iso

  $ sudo eggs produce -v
  same as previuos, but with --verbose output

  $ sudo eggs produce -vf
  same as previuos, compression zstd, lz4 or gzip (depend from system capability)

  $ sudo eggs produce -vm
  same as previuos, compression xz -Xbcj x86 (max compression, about 10%
  more compressed)

  $ sudo eggs produce -vf --basename leo --theme debian --addons adapt 
  produce an ISO called leo-i386-2020-08-25_1215.iso compression fast,
  using Debian theme and link to adapt

  $ sudo eggs produce -v --basename leo --theme debian --addons rsupport 
  produce an ISO called leo-i386-2020-08-25_1215.iso compression xz,
  using Debian theme and link to dwagent

  $ sudo eggs produce -v --basename leo --rsupport 
  produce an ISO called leo-i386-2020-08-25_1215.iso compression xz, using eggs
  theme and link to dwagent

  $ sudo eggs produce -vs --basename leo --rsupport 
  produce scripts to build an ISO as the previus example. Scripts can be found
  in /home/eggs/ovarium and you can customize all you need
```

_See code: [src/commands/produce.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/produce.ts)_

## `eggs remove`

remove eggs and others stuff

```
USAGE
  $ eggs remove

OPTIONS
  -a, --autoremove  remove eggs packages dependencies
  -h, --help        show CLI help
  -p, --purge       remove eggs configurations files
  -v, --verbose     verbose

EXAMPLES
  $ sudo eggs remove 
  remove eggs

  $ sudo eggs remove --purge 
  remove eggs, eggs configurations, packages prerequisites
```

_See code: [src/commands/remove.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/remove.ts)_

## `eggs tools:clean`

clean system log, apt, etc

```
USAGE
  $ eggs tools:clean

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose

ALIASES
  $ eggs clean
```

_See code: [src/commands/tools/clean.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/tools/clean.ts)_

## `eggs tools:locales`

install/clean locales

```
USAGE
  $ eggs tools:locales

OPTIONS
  -h, --help       show CLI help
  -r, --reinstall  reinstall locales
  -v, --verbose    verbose
```

_See code: [src/commands/tools/locales.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/tools/locales.ts)_

## `eggs tools:skel`

update skel from home configuration

```
USAGE
  $ eggs tools:skel

OPTIONS
  -h, --help       show CLI help
  -u, --user=user  user to be used
  -v, --verbose

ALIASES
  $ eggs skel

EXAMPLE
  $ eggs skel --user mauro
  desktop configuration of user mauro will get used as default
```

_See code: [src/commands/tools/skel.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/tools/skel.ts)_

## `eggs tools:stat`

get statistics from sourceforge

```
USAGE
  $ eggs tools:stat

OPTIONS
  -h, --help   show CLI help
  -m, --month  current month
  -y, --year   current year

ALIASES
  $ eggs stat
```

_See code: [src/commands/tools/stat.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/tools/stat.ts)_

## `eggs tools:yolk`

configure eggs to install without internet

```
USAGE
  $ eggs tools:yolk

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

EXAMPLE
  $ eggs yolk -v
```

_See code: [src/commands/tools/yolk.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/tools/yolk.ts)_

## `eggs update`

update the penguin's eggs tool

```
USAGE
  $ eggs update

OPTIONS
  -a, --apt      if eggs package is .deb, update from distro repositories
  -b, --basket   if eggs package is .deb, update from eggs basket
  -h, --help     show CLI help
  -n, --npm      if eggs package is .npm, update from npmjs.com
  -v, --verbose  verbose

EXAMPLE
  $ eggs update
  update/upgrade the penguin's eggs tool
```

_See code: [src/commands/update.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.0.29/src/commands/update.ts)_
<!-- commandsstop -->

# Terminal samples

![terminal samples](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/terminal-lessons/eggs_help.gif?raw=true)

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations
There is [user's manual](https://penguins-eggs.net/book/) and same other documentation in [documents folder](./documents) of this repository.

* [penguin's eggs blog](https://penguins-eggs.net)    
* [facebook penguin's eggs group](https://www.facebook.com/groups/128861437762355/)
* [sources](https://github.com/pieroproietti/penguins-krill)

You can contact me at pieroproietti@gmail.com or [meet me](https://meet.jit.si/PenguinsEggsMeeting)

## Copyright and licenses
Copyright (c) 2017, 2021 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
