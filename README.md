[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://vshymanskyy.github.io/StandWithUkraine)

penguins-eggs
=============

### Penguins&#39; eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Index
<!-- toc -->
* [Index](#index)
* [Presentation](#presentation)
* [Technology](#technology)
* [Features](#features)
* [Packages](#packages)
* [Usage](#usage)
* [Commands](#commands)
* [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
* [That's all Folks!](#thats-all-folks)
<!-- tocstop -->

# Presentation
**penguins-eggs** is a console tool, under continuous development, that allows you to remaster your system and redistribute it as live images on usb sticks or via PXE.

The default behavior is total removal of the system's data and users, but it is also possible to remaster the system including the data and accounts of present users, use flag **--clone**. It is also possible to keep the users and files present under an encrypted LUKS file within the same resulting iso file, flag **--cryptedclone**.

You can easily install the resulting live system with the calamares installer or the internal TUI krill installer. 

It is possible to have also unattended installation using **--unattended** flag.

Thanks to the wardrobe, you can create or use scripts to switch from a "naked" version - with only a CLI interface - and "wear" it with a full GUI or server configurations. 

See [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe), fork it and adapt it to yours needs.

# Technology

eggs is written mostly in typescript and ideally can be used with different Linux distributions. Yes, there are big differences in terms of package manager used, path, etc, but basically the various programs used to build the live are the same. 

Currently eggs supports: [Debian](https://www.debian.org/), [Devuan](https://www.devuan.org/), [Ubuntu](https://ubuntu.com/), [Arch](https://archlinux.org/), [Manjaro](https://manjaro.org/) and [derivaties](./conf/derivatives.yaml).

You can read more on the [blog](https://penguins-eggs.net/blog/distros-that-can-be-remastered-with-eggs), some examples of iso images remastered with eggs are in the [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/ISOS/). 

# Features

## wardrobe, themes and addons

wardrobe was added to eggs on april 2022. It is a way to guide and consolidate the process of creating a custom version of Linux, starting from a CLI system. All my personal editions are passed to use wardrobe for their convenience, in that way I can organize, consolidate and manage better my work. I used birds names for my customizations, we have: colibri, duck, eagle, owl, wagtail, warbier and chicks mostly under [plastilinux](https://sourceforge.net/projects/penguins-eggs/files/ISOS/plastilinux/), [waydroid](https://sourceforge.net/projects/penguins-eggs/files/ISOS/waydroid/) or [bullseye](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bullseye/) on eggs' sourceforge page.

I hope peoples will be interested in wardrobe and you will end to fork the main repository and add your customizations: together will be possibile to make great steps impossible for a single developer. You can read more in wardrobe on [Penguins' eggs blog](https://penguins-eggs.net/blog/wardrobe-colibri-duck-eagle-and-owl/).

Addons and themes have been grouped under the penguins-wardrobe, use wardrobe for all your customizations. 

Consult [wardrobe users' guide](https://penguins-eggs.net/docs/Tutorial/wardrobe-users-guide).

## clone/cryptedclone
You can create your live to distribute it - the default mode - or with datas using clone and clonecrypted:

```eggs produce``` 

Completely removes user data from live, this is the preset mode

```eggs produce --clone``` 

Saves our users and our data directly in the generated iso. The data will be visible directly from the live and accessible to anyone who gets a copy.

```eggs produce --cryptedclone``` 

Saves our data within the generated iso using a LUKS volume. Our data will NOT be visible in the live system but can be reinstalled automatically with krill installer. Even having the generated image available, our data will be protected by the LUKS passphrase.

* ```eggs produce``` this is the default: all private data are removed on the live.
* ```eggs produce --clone``` include all users data UNCRYPTED directly on the live.
* ```eggs produce --cryptedclone``` include all users data CRYPTED on a LUKS volume inside the iso.

Using krill: ```sudo eggs install --cli``` will automaticaly restore your CRYPTED data during the installation.

## calamares and krill
eggs was developed to use [calamares](https://calamares.io) as the system installer and allows its customization with themes. It also includes its own installer, called krill, which allows you to produce and install CLI systems such as servers. krill uses a CLI interface that mimics calamares and uses the same configuration files created by eggs for calamares. This provides a "roughly similar" installation experience for both desktop and server installations. With krill it is also possible to have unattended installations, simply by adding the ``--unattended`` flag, the configuration values can be changed in ``/etc/penguins-eggs.d/krill.yaml`` and will then be used for automatic installation.

## cuckoo
The cuckoo lays its eggs in the nests of other birds, and the eggs are hatched by the latter. Similarly eggs can start a self-configuring PXE service to allow you to boot and install your iso on third party networked computers. Command cuckoo can be used either to deploy a newly created iso on an installed system or by live booting the iso itself. 

## mom and dad
I added two built-in assistants with eggs: mom and dad. While mom is a script based on [easybashgui](https://github.com/BashGui/easybashgui) that explains the various commands and documentation, dad started as a shortcut to properly configure eggs: just type ```sudo eggs dad``` and follow simple instructions. Even faster, using ```sudo eggs dad -d``` you will resets the configuration, loads defaults, deletes created isos. At this point, with eggs configured, just type ```sudo produce``` to generate your live.

## yolk 
yolk - so called staying on the subject of eggs - is a local repository included in the livecd that contains a minimum of indispensable packages during installation. Thanks to yolk, you can safely install your system without the need of an active internet connection.

# Packages
Supporting various distributions, we need to have different packages. Debian, Devuan and Ubuntu share the .deb packages of eggs, while for Arch Linux and ManjaroLinux they use their PKGBUILDs.

## Debian families
eggs is released as a deb package for amd64, armel and arm64 architectures. Because of eggs' features, they can be installed in Debian, Devuan, or Ubuntu-based distros without worrying about version (buster, bullseye, bookworm, etc.) except for architecture. It includes standard scripts for preinst, postinst, prerm and postrm and man pages. 

### Install eggs
There are more than a way to install eggs as .deb package, the most practical is to add and use penguins-eggs-ppa.

#### Download the package and install with dpkg

The simplest way to install eggs is download the [package eggs](https://sourceforge.net/projects/penguins-eggs/files/DEBS/) from [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/) and install it

```
sudo dpkg -i eggs_9.4.9_amd64.deb
```

or, on a i386 system:
```
sudo dpkg -i eggs_8.17.17-1_i386.deb
```

Once eggs is installed you can add the [penguins-eggs-ppa](https://pieroproietti.github.io/penguins-eggs-ppa) repository with the command: ```sudo eggs tools ppa --install```

#### Using penguins-eggs-ppa (stable version)

eggs have its repository ppa, You can use it, copy and paste in a terminal window the following two lines:

```
curl -fsSL https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/penguins-eggs.gpg
echo "deb [arch=$(dpkg --print-architecture)] https://pieroproietti.github.io/penguins-eggs-ppa ./" | sudo tee /etc/apt/sources.list.d/penguins-eggs.list > /dev/null
```

Update your repositories and install eggs:

```
sudo apt update && sudo apt install eggs
```

### Upgrade eggs
If you are using penguins-eggs-ppa You can ugrade eggs as others packages just: **sudo apt upgrade**, else simply download new versions of eggs from [sourgeforge page](https://sourceforge.net/projects/penguins-eggs/files/DEBS/) and install it with the standard command **sudo dpkg -i eggs_9.4.9_amd64.deb**.


## Arch families
eggs has been present in AUR for a long time, even without my knowledge thanks the support of Arch peoples. I am currently directly maintaining the AUR version of [penguins-eggs](https://aur.archlinux.org/packages/penguins-eggs) and I'm participating in the [Manjaro Community Repository](https://gitlab.manjaro.org/packages/community/penguins-eggs).

The development versions of penguins eggs and other PKGBUILDs are instead in my [penguins-eggs-pkgbuilds](https://github.com/pieroproietti/penguins-eggs-pkgbuilds) repository.

### Arch
To install penguins-eggs on Arch, simply:
 ```
 yay penguins-eggs
 ```
Or, in more traditional way:

```
git clone https://aur.archlinux.org/packages/penguins-eggs
cd penguins-eggs
makepkg -srcCi
```
### Manjaro
From penguins-eggs v9.4.3 the package is part of the [Manjaro community](https://gitlab.manjaro.org/packages/community/penguins-eggs) repo and can be installed with [pamac](https://wiki.manjaro.org/index.php/Pamac), alternatively you can install it with:
```
git clone https://gitlab.manjaro.org/packages/community/penguins-eggs/
cd penguins-eggs
makepkg -srcCi
```

# Usage

Once the package has been installed, you can have the new ```eggs``` command. Typing ```eggs``` will get the list of commands, typing ```eggs produce --help``` will get the eggs produce command help screen. You can also use the command autocomplete with the TABS key, you will get the possible choices for each command. In addition, there is a man page, so by typing ```man eggs``` you will get that help as well. You can also use the ```eggs mom``` command that interactively allows you to consult the help for all commands and online documentation.

## Examples

* Create a live system without user data:

```sudo eggs produce ```

* Create a live system with user data uncrypted.

```sudo eggs produce --clone```

* Create a live system with the encrypted user data.

```sudo eggs produce --cryptedclone```

At the moment eggs uses the default fast compression, which provides a faster compression speed, for the final compression it is worth using the ```--max``` flag to get more compressed ISOs.

In addition to the description of the commands in this README, you can consult the [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide).

# Commands
<!-- commands -->
* [`eggs adapt`](#eggs-adapt)
* [`eggs analyze`](#eggs-analyze)
* [`eggs autocomplete [SHELL]`](#eggs-autocomplete-shell)
* [`eggs calamares`](#eggs-calamares)
* [`eggs config`](#eggs-config)
* [`eggs cuckoo`](#eggs-cuckoo)
* [`eggs dad`](#eggs-dad)
* [`eggs export deb`](#eggs-export-deb)
* [`eggs export iso`](#eggs-export-iso)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs mom`](#eggs-mom)
* [`eggs produce`](#eggs-produce)
* [`eggs status`](#eggs-status)
* [`eggs syncfrom`](#eggs-syncfrom)
* [`eggs syncto`](#eggs-syncto)
* [`eggs tools clean`](#eggs-tools-clean)
* [`eggs tools ppa`](#eggs-tools-ppa)
* [`eggs tools skel`](#eggs-tools-skel)
* [`eggs tools stat`](#eggs-tools-stat)
* [`eggs tools yolk`](#eggs-tools-yolk)
* [`eggs update`](#eggs-update)
* [`eggs version`](#eggs-version)
* [`eggs wardrobe get [REPO]`](#eggs-wardrobe-get-repo)
* [`eggs wardrobe list [WARDROBE]`](#eggs-wardrobe-list-wardrobe)
* [`eggs wardrobe show [COSTUME]`](#eggs-wardrobe-show-costume)
* [`eggs wardrobe wear [COSTUME]`](#eggs-wardrobe-wear-costume)

## `eggs adapt`

adapt monitor resolution for VM only

```
USAGE
  $ eggs adapt [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  adapt monitor resolution for VM only

EXAMPLES
  $ eggs adapt
```

_See code: [dist/commands/adapt.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/adapt.js)_

## `eggs analyze`

analyze for syncto

```
USAGE
  $ eggs analyze [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  analyze for syncto

EXAMPLES
  sudo eggs analyze
```

_See code: [dist/commands/analyze.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/analyze.js)_

## `eggs autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ eggs autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ eggs autocomplete

  $ eggs autocomplete bash

  $ eggs autocomplete zsh

  $ eggs autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.3.8/src/commands/autocomplete/index.ts)_

## `eggs calamares`

configure calamares or install or configure it

```
USAGE
  $ eggs calamares [-h] [-i] [-n] [-r] [--remove] [--theme <value>] [-v]

FLAGS
  -h, --help           Show CLI help.
  -i, --install        install calamares and its dependencies
  -n, --nointeractive  no user interaction
  -r, --release        release: remove calamares and all its dependencies after the installation
  -v, --verbose
  --remove             remove calamares and its dependencies
  --theme=<value>      theme/branding for eggs and calamares

DESCRIPTION
  configure calamares or install or configure it

EXAMPLES
  sudo eggs calamares

  sudo eggs calamares --install

  sudo eggs calamares --install --theme=/path/to/theme

  sudo eggs calamares --remove
```

_See code: [dist/commands/calamares.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/calamares.js)_

## `eggs config`

Configure and install prerequisites deb packages to run it

```
USAGE
  $ eggs config [-c] [-h] [-n] [-v]

FLAGS
  -c, --clean          remove old configuration before to create new one
  -h, --help           Show CLI help.
  -n, --nointeractive  no user interaction
  -v, --verbose        verbose

DESCRIPTION
  Configure and install prerequisites deb packages to run it

EXAMPLES
  sudo eggs config

  sudo eggs config --clean

  sudo eggs config --clean --nointeractive
```

_See code: [dist/commands/config.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/config.js)_

## `eggs cuckoo`

PXE start with proxy-dhcp

```
USAGE
  $ eggs cuckoo [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  PXE start with proxy-dhcp

EXAMPLES
  sudo eggs cuckoo
```

_See code: [dist/commands/cuckoo.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/cuckoo.js)_

## `eggs dad`

ask help from daddy - TUI configuration helper

```
USAGE
  $ eggs dad [-c] [-d] [-h] [-v]

FLAGS
  -c, --clean    remove old configuration before to create
  -d, --default  remove old configuration and force default
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  ask help from daddy - TUI configuration helper

EXAMPLES
  sudo dad

  sudo dad --clean

  sudo dad --default
```

_See code: [dist/commands/dad.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/dad.js)_

## `eggs export deb`

export deb/docs/iso to the destination host

```
USAGE
  $ eggs export deb [-a] [-c] [-h] [-v]

FLAGS
  -a, --all      export all archs
  -c, --clean    remove old .deb before to copy
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  export deb/docs/iso to the destination host

EXAMPLES
  $ eggs export deb

  $ eggs export deb --clean

  $ eggs export deb --all
```

## `eggs export iso`

export iso in the destination host

```
USAGE
  $ eggs export iso [-c] [-h] [-v]

FLAGS
  -c, --clean    delete old ISOs before to copy
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  export iso in the destination host

EXAMPLES
  $ eggs export iso

  $ eggs export iso --clean
```

## `eggs help [COMMAND]`

Display help for eggs.

```
USAGE
  $ eggs help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for eggs.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.23/src/commands/help.ts)_

## `eggs install`

krill: the CLI system installer - the egg became a penguin!

```
USAGE
  $ eggs install [-k] [-c <value>] [-d <value>] [-H] [-h] [-i] [-n] [-N] [-p] [-r] [-s] [-S] [-u] [-v]

FLAGS
  -H, --halt            Halt the system after installation
  -N, --none            Swap none: 256M
  -S, --suspend         Swap suspend: RAM x 2
  -c, --custom=<value>  custom unattended configuration
  -d, --domain=<value>  Domain name, defult: .local
  -h, --help            Show CLI help.
  -i, --ip              hostname as ip, eg: ip-192-168-1-33
  -k, --crypted         Crypted CLI installation
  -n, --nointeractive   no user interaction
  -p, --pve             Proxmox VE install
  -r, --random          Add random to hostname, eg: colibri-ay412dt
  -s, --small           Swap small: RAM
  -u, --unattended      Unattended installation
  -v, --verbose         Verbose

DESCRIPTION
  krill: the CLI system installer - the egg became a penguin!

EXAMPLES
  sudo eggs install

  sudo eggs install --unattended

  sudo eggs install --custom it
```

_See code: [dist/commands/install.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/install.js)_

## `eggs kill`

kill the eggs/free the nest

```
USAGE
  $ eggs kill [-h] [-n] [-v]

FLAGS
  -h, --help           Show CLI help.
  -n, --nointeractive  no user interaction
  -v, --verbose        verbose

DESCRIPTION
  kill the eggs/free the nest

EXAMPLES
  sudo eggs kill
```

_See code: [dist/commands/kill.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/kill.js)_

## `eggs mom`

ask help from mommy - TUI helper

```
USAGE
  $ eggs mom [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  ask help from mommy - TUI helper

EXAMPLES
  $ eggs mom
```

_See code: [dist/commands/mom.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/mom.js)_

## `eggs produce`

produce a live image from your system whithout your data

```
USAGE
  $ eggs produce [--addons <value>] [--basename <value>] [-c] [-C] [-h] [-m] [-n] [-p <value>] [--release]
    [-s] [-f] [--theme <value>] [-v] [-y]

FLAGS
  -C, --cryptedclone    crypted clone
  -c, --clone           clone
  -f, --standard        standard compression
  -h, --help            Show CLI help.
  -m, --max             max compression
  -n, --nointeractive   no user interaction
  -p, --prefix=<value>  prefix
  -s, --script          script mode. Generate scripts to manage iso build
  -v, --verbose         verbose
  -y, --yolk            -y force yolk renew
  --addons=<value>...   addons to be used: adapt, ichoice, pve, rsupport
  --basename=<value>    basename
  --release             release: max compression, remove penguins-eggs and calamares after installation
  --theme=<value>       theme for livecd, calamares branding and partitions

DESCRIPTION
  produce a live image from your system whithout your data

EXAMPLES
  sudo eggs produce

  sudo eggs produce --standard

  sudo eggs produce --max

  sudo eggs produce --max --basename=colibri

  sudo eggs produce --cryptedclone

  sudo eggs produce --clone

  sudo eggs produce --basename=colibri

  sudo eggs produce --basename=colibri --theme /path/to/theme --addons adapt
```

_See code: [dist/commands/produce.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/produce.js)_

## `eggs status`

informations about eggs status

```
USAGE
  $ eggs status [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  informations about eggs status

EXAMPLES
  $ eggs status
```

_See code: [dist/commands/status.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/status.js)_

## `eggs syncfrom`

restore users and user data from a LUKS volumes

```
USAGE
  $ eggs syncfrom [--delete <value>] [-f <value>] [-h] [-r <value>] [-v]

FLAGS
  -f, --file=<value>     file LUKS volume encrypted
  -h, --help             Show CLI help.
  -r, --rootdir=<value>  rootdir of the installed system, when used from live
  -v, --verbose          verbose
  --delete=<value>       rsync --delete delete extraneous files from dest dirs

DESCRIPTION
  restore users and user data from a LUKS volumes

EXAMPLES
  sudo eggs syncfrom

  sudo eggs syncfrom --file /path/to/fileLUKS
```

_See code: [dist/commands/syncfrom.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/syncfrom.js)_

## `eggs syncto`

saves users and user data in a LUKS volume inside the iso

```
USAGE
  $ eggs syncto [--delete <value>] [-f <value>] [-h] [-v]

FLAGS
  -f, --file=<value>  file LUKS volume encrypted
  -h, --help          Show CLI help.
  -v, --verbose       verbose
  --delete=<value>    rsync --delete delete extraneous files from dest dirs

DESCRIPTION
  saves users and user data in a LUKS volume inside the iso

EXAMPLES
  sudo eggs syncto

  sudo eggs syncto --file /path/to/fileLUKS
```

_See code: [dist/commands/syncto.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/syncto.js)_

## `eggs tools clean`

clean system log, apt, etc

```
USAGE
  $ eggs tools clean [-h] [-n] [-v]

FLAGS
  -h, --help           Show CLI help.
  -n, --nointeractive  no user interaction
  -v, --verbose        verbose

DESCRIPTION
  clean system log, apt, etc

EXAMPLES
  sudo eggs tools clean
```

## `eggs tools ppa`

add/remove PPA repositories (Debian family)

```
USAGE
  $ eggs tools ppa [-a] [-h] [-n] [-r] [-v]

FLAGS
  -a, --add            add penguins-eggs PPA repository
  -h, --help           Show CLI help.
  -n, --nointeractive  no user interaction
  -r, --remove         remove penguins-eggs PPA repository
  -v, --verbose        verbose

DESCRIPTION
  add/remove PPA repositories (Debian family)

EXAMPLES
  sudo eggs tools ppa --add

  sudo eggs tools ppa --remove
```

## `eggs tools skel`

update skel from home configuration

```
USAGE
  $ eggs tools skel [-h] [-u <value>] [-v]

FLAGS
  -h, --help          Show CLI help.
  -u, --user=<value>  user to be used
  -v, --verbose

DESCRIPTION
  update skel from home configuration

EXAMPLES
  sudo eggs tools skel

  sudo eggs tools skel --user user-to-be-copied
```

## `eggs tools stat`

get statistics from sourceforge

```
USAGE
  $ eggs tools stat [-h] [-m] [-y]

FLAGS
  -h, --help   Show CLI help.
  -m, --month  current month
  -y, --year   current year

DESCRIPTION
  get statistics from sourceforge

EXAMPLES
  $ eggs tools stat

  $ eggs tools stat --month

  $ eggs tools stat --year
```

## `eggs tools yolk`

configure eggs to install without internet

```
USAGE
  $ eggs tools yolk [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  configure eggs to install without internet

EXAMPLES
  sudo eggs tools yolk
```

## `eggs update`

update the Penguins' eggs tool

```
USAGE
  $ eggs update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  update the Penguins' eggs tool

EXAMPLES
  $ eggs update
```

_See code: [dist/commands/update.js](https://github.com/pieroproietti/penguins-eggs/blob/v9.4.0/dist/commands/update.js)_

## `eggs version`

```
USAGE
  $ eggs version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v1.1.4/src/commands/version.ts)_

## `eggs wardrobe get [REPO]`

get warorobe

```
USAGE
  $ eggs wardrobe get [REPO] [-h] [-v]

ARGUMENTS
  REPO  repository to get

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  get warorobe

EXAMPLES
  $ eggs wardrobe get

  $ eggs wardrobe get your-wardrobe
```

## `eggs wardrobe list [WARDROBE]`

list costumes and accessoires in wardrobe

```
USAGE
  $ eggs wardrobe list [WARDROBE] [-h] [-v]

ARGUMENTS
  WARDROBE  wardrobe

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  list costumes and accessoires in wardrobe

EXAMPLES
  $ eggs wardrobe list

  $ eggs wardrobe list your-wardrobe
```

## `eggs wardrobe show [COSTUME]`

show costumes/accessories in wardrobe

```
USAGE
  $ eggs wardrobe show [COSTUME] [-h] [-j] [-v] [-w <value>]

ARGUMENTS
  COSTUME  costume

FLAGS
  -h, --help              Show CLI help.
  -j, --json              output JSON
  -v, --verbose
  -w, --wardrobe=<value>  wardrobe

DESCRIPTION
  show costumes/accessories in wardrobe

EXAMPLES
  $ eggs wardrobe show colibri

  $ eggs wardrobe show accessories/firmwares

  $ eggs wardrobe show accessories/
```

## `eggs wardrobe wear [COSTUME]`

wear costume/accessories from wardrobe

```
USAGE
  $ eggs wardrobe wear [COSTUME] [-h] [-a] [-f] [-s] [-v] [-w <value>]

ARGUMENTS
  COSTUME  costume

FLAGS
  -a, --no_accessories    not install accessories
  -f, --no_firmwares      not install firmwares
  -h, --help              Show CLI help.
  -s, --silent
  -v, --verbose
  -w, --wardrobe=<value>  wardrobe

DESCRIPTION
  wear costume/accessories from wardrobe

EXAMPLES
  sudo eggs wardrobe wear duck

  sudo eggs wardrobe wear accessories/firmwares

  sudo eggs wardrobe wear wagtail/waydroid
```
<!-- commandsstop -->

# Penguins' eggs official guide
The original edition of the eggs manual is released in Italian, of course other languages can be accessed using machine translation:

[Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/users-guide)

A nice thing to do to help users could be to make terminal samples, I did this some time ago, but they should be updated.

![terminal samples](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/terminal-lessons/eggs_help.gif?raw=true)

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

# More informations
There is a [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/users-guide) and same other documentation - mostly for developers - on the repository [penguins-eggs](https://github.com/pieroproietti/penguins-eggs) under [documents](https://github.com/pieroproietti/penguins-eggs/tree/master/documents). I want to point out [hens, differents species](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/hens-different-species.md) a brief how to use eggs in Debian. Arch and Manjaro, and the post [Arch-naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html) on the blog which describes how to create an Arch naked live, install it, then dress the resulting system with a graphics development station.

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