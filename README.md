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
* [Copyright and licenses](#copyright-and-licenses)
<!-- tocstop -->

# Presentation
penguins-eggs is an actively developing console utility that allows you to remaster your system and redistribute it as iso images or over LAN via PXE remote booting.

The purpose of this project is to facilitate the process of remastering your version of Linux, generating it as an ISO image to burn to a CD/DVD or copying it to a USB key to boot your system. You can also boot your live image - via remote boot - on your LAN. You can easily install your system using the calamares GUI installer or the krill CLI installer included with eggs.

eggs is written entirely in pure typescript and could, therefore, be adapted in the future to other Linux distributions by rewriting the package manager part. There are, in fact, many differences in the package manager used by the distro, but relatively less in the way bash and the various programs used to create the ISO work.

penguins-eggs is now a mature, sophisticated and extremely useful tool, allowing you to easily create your own ISO or create it for the needs of your organization/community/school, etc and deploy it. 

Don't be scared, yes eggs is a console utility - no GUI - but don't be afraid, eggs is really very simple, if you are able to open a terminal, you can use it and your end users will enjoy a full GUI, a handy installer to install your livecd. You will still have the pleasure of all the sophistication possible in a CLI tool such as command autocomplete, man pages, guides, etc.

### addons
eggs is also extensible via an addons architecture that can allow you to develop extensions, specifically to make your own original themes. For example, you can create a theme that includes branding, link and startup icon for the calamares GUI installer. Also, as an addon it has been developed adapt to adjust video resolution in VM, rsupport for remote support, installer choice, etc.

### backup
From version 8.0.30 you can use the backup mode by simply adding --backup to the produce command: **sudo eggs produce --backup**.This way eggs will save your users' data and accounts in an encrypted luks2 volume that is restored right after installation only if you are able to enter the passphrase decided by the owner.

### krill
eggs includes a CLI installer called krill. krill allows you to install your system in a nice CLI interface using the same configuration created by eggs for [calamares](https://calamares.io). This results in a similar installation experience between krill and calamares and can be used on all supported distributions. To force the use of krill instead of calamares in a GUI system, just **sudo eggs install --cli**.

### mom and dad
There are also two lightweight assistants built in with eggs: **mom** and **dad**. While **mom** is a bash script with whiptail - and guides the user to the various commands and documentation, **dad** started as a shortcut to creating an ISO. All you have to do is type **sudo eggs dad** and follow simple instructions. You can also shortcut it again by resetting the pre-existing configuration: **sudo dad -c**  or, even faster, reset the configuration, load the defaults and kill all the created ISOs. Just type **sudo eggs dad -d** and you will immediately be able to produce a new egg in the default nest: /home/eggs.

I suggest to leave the default values unchanged during the development of your remaster. You will be more fast in producing eggs, enjoy of dad after reinstalling eggs. If you need more space, simply mount your big device in /home/eggs.

### yolk 
yolk as it is called - to stay on the subject of eggs - is a small local repository that is included in the livecd filesystem. yolk contains the minimum number of packages that are essential to use during the installation. Thanks to yolk, you can safely install the system without the need for an active internet connection.

## What distributions can I use?
eggs was born on Debian strecth/buster - actually I work mostly in bullseye - and it fully supports Debian from jessie to bullseye, Devuan beowulf, Ubuntu bionic, focal, hirsute and derivatives. I normally test on multiple distributions before releasing it. It has been used successfully on many derivatives in particular Linux Mint uma, LMDE 4 debbie, deepin linux, KDE neon, MX Linux and many others.

eggs, generally, should work with all Debian, Devuan and Ubuntu derivatives.

Some examples of iso images remastered with eggs are in the [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/iso/). 

## What architecture can I use?
Until august 2021 - up to version 8.0.30 - I have released eggs for i386, amd64, arm64 and armel architectures. 

Since version 8.1.0 I was forced to drop the build for the i386 architecture because I experiment unsurmountable problems with node8.17.0 the last version of node supporting this architecture. 

eggs can currently be used successfully and produces bootable ISOs for i386 and amd64 architectures. Versions for arm64 and armel can also be installed and work, but - at the moment - the ISO produced is not bootable.

I am working on this and would need assistance and testers.

# Packages
eggs is released as **deb** package and **npm** package, most users need just **deb** version. 

## deb packages
eggs is released as deb package. eggs packages can be installed regardless of version on distributions based on Debian, Devuan or Ubuntu. Of course choosing the appropriate architecture for your system: i386, amd64, arm64 or armel.

### Installing

**Installig eggs via ppa**
Copy and past to add the **penguins-eggs-ppa** to your sources lists

```
curl -SsL https://pieroproietti.github.io/penguins-eggs-ppa/debian/KEY.gpg | sudo apt-key add -
sudo curl -s --compressed -o /etc/apt/sources.list.d/penguins-eggs-ppa.list "https://pieroproietti.github.io/penguins-eggs-ppa/debian/penguins-eggs-ppa.list"
```
Update your repositories and install eggs

```
sudo apt update
sudo apt install eggs
```

If you install **penguins-eggs-ppa**, you will get and update eggs with your usual tools: apt, synaptic or others packages manager. Example:
```sudo apt update```

**Installig eggs from the package .deb**
If you don't want to add **penguins-eggs-ppa** on your list, you can install eggs again downloading it from [package eggs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) from [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/) and installing it

```
sudo dpkg -i eggs_8.0.0-1_amd64.deb
```

or, on a i386 system:
```
sudo dpkg -i eggs_8.0.0-1_i386.deb
```

You can again easily update eggs with the command ```sudo eggs update``` and choose basket. Eggs let you to select the last 4 versions from the [basket](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) and install it.

```sudo eggs update```

_Note about deb packages_ You can use the same package for all distributions using deb, naturally choosing the appropriate architecture (i386/amd64).

## npm packages

If you have nodejs installed, you can install penguins-eggs with the utility npm.

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
penguins-eggs/8.1.4 linux-x64 node-v12.22.5
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

_See code: [src/commands/adapt.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/adapt.ts)_

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

_See code: [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/calamares.ts)_

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

_See code: [src/commands/config.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/config.ts)_

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

_See code: [src/commands/dad.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/dad.ts)_

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

_See code: [src/commands/export/deb.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/export/deb.ts)_

## `eggs export:docs`

remove and export docType documentation of the sources in the destination host

```
USAGE
  $ eggs export:docs

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/export/docs.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/export/docs.ts)_

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

_See code: [src/commands/export/iso.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/export/iso.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `eggs info`

thinking a different approach to CLI...

```
USAGE
  $ eggs info

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [src/commands/info.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/info.ts)_

## `eggs install`

command-line system installer - the egg became a penguin!

```
USAGE
  $ eggs install

OPTIONS
  -c, --cli      force use CLI installer
  -h, --help     show CLI help
  -m, --mx       to use mx-installer
  -v, --verbose  verbose

ALIASES
  $ eggs hatch
  $ eggs krill

EXAMPLE
  $ eggs install
  Install the system using GUI or CLI installer
```

_See code: [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/install.ts)_

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

_See code: [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/kill.ts)_

## `eggs mom`

ask for mommy - gui helper

```
USAGE
  $ eggs mom

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/mom.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/mom.ts)_

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

_See code: [src/commands/produce.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/produce.ts)_

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

_See code: [src/commands/remove.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/remove.ts)_

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

_See code: [src/commands/tools/clean.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/tools/clean.ts)_

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

_See code: [src/commands/tools/locales.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/tools/locales.ts)_

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

_See code: [src/commands/tools/skel.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/tools/skel.ts)_

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

_See code: [src/commands/tools/stat.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/tools/stat.ts)_

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

_See code: [src/commands/tools/yolk.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/tools/yolk.ts)_

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

_See code: [src/commands/update.ts](https://github.com/pieroproietti/penguins-eggs/blob/v8.1.4/src/commands/update.ts)_
<!-- commandsstop -->

## More informations
There is [user's manual](https://penguins-eggs.net/book/) and same other documentation in [documents folder](./documents) of this repository.

* [penguin's eggs blog](https://penguins-eggs.net)    
* [facebook penguin's eggs group](https://www.facebook.com/groups/128861437762355/)
* [sources](https://github.com/pieroproietti/penguins-krill)

You can mail me at pieroproietti@gmail.com or [meet me](https://meet.jit.si/PenguinsEggsMeeting) on jitsi meet.

## That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, life is inside! :-D

# Copyright and licenses
Copyright (c) 2017, 2021 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
