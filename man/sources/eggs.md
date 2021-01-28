eggs(1) -- A reproductive system for penguins
=============================================

## SYNOPSIS

eggs command [--flags]

popolo!examples:

<!-- usage -->

<!-- usagestop -->



  sudo eggs prerequisites --verbose

  sudo eggs produce --verbose --fast

  sudo eggs kill


## DESCRIPTION

eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso image.

eggs as CLI tool have his man page but not only - yith his two GUIs: eggs mom and eggs dad - you can help yourself and easily learn eggs commands or get documentations.

## COMMANDS
<!-- commands -->
* [`eggs adapt`](#eggs-adapt)
* [`eggs autocomplete [SHELL]`](#eggs-autocomplete-shell)
* [`eggs calamares`](#eggs-calamares)
* [`eggs dad [FILE]`](#eggs-dad-file)
* [`eggs export:deb`](#eggs-exportdeb)
* [`eggs export:docs`](#eggs-exportdocs)
* [`eggs export:iso`](#eggs-exportiso)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs info`](#eggs-info)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs mom`](#eggs-mom)
* [`eggs prerequisites`](#eggs-prerequisites)
* [`eggs produce`](#eggs-produce)
* [`eggs remove`](#eggs-remove)
* [`eggs tools:clean`](#eggs-toolsclean)
* [`eggs tools:initrd`](#eggs-toolsinitrd)
* [`eggs tools:locales`](#eggs-toolslocales)
* [`eggs tools:man`](#eggs-toolsman)
* [`eggs tools:pve`](#eggs-toolspve)
* [`eggs tools:sanitize`](#eggs-toolssanitize)
* [`eggs tools:skel`](#eggs-toolsskel)
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

_See code: [src/commands/adapt.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/adapt.ts)_

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

_See code: [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/calamares.ts)_

## `eggs dad [FILE]`

ask help from daddy (gui interface)!

```
USAGE
  $ eggs dad [FILE]

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [src/commands/dad.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/dad.ts)_

## `eggs export:deb`

export package eggs-v7-x-x-1.deb in the destination host

```
USAGE
  $ eggs export:deb

OPTIONS
  -c, --clean  remove old .deb before to copy
  -h, --help   show CLI help
  --all        export all arch
  --amd64      export amd64 arch
  --armel      export armel arch
  --i386       export i386 arch
```

_See code: [src/commands/export/deb.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/export/deb.ts)_

## `eggs export:docs`

remove and export docType documentation of the sources in the destination host

```
USAGE
  $ eggs export:docs

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/export/docs.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/export/docs.ts)_

## `eggs export:iso`

export iso in the destination host

```
USAGE
  $ eggs export:iso

OPTIONS
  -c, --clean  delete old ISOs before to copy
  -h, --help   show CLI help
```

_See code: [src/commands/export/iso.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/export/iso.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.1/src/commands/help.ts)_

## `eggs info`

informations about system and eggs

```
USAGE
  $ eggs info

EXAMPLE
  $ eggs info
  You will find here informations about penguin's eggs!
```

_See code: [src/commands/info.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/info.ts)_

## `eggs install`

eggs installer - (the egg became penguin)

```
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

_See code: [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/install.ts)_

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

_See code: [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/kill.ts)_

## `eggs mom`

ask for mommy (gui interface)!

```
USAGE
  $ eggs mom

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/mom.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/mom.ts)_

## `eggs prerequisites`

install packages prerequisites to run eggs

```
USAGE
  $ eggs prerequisites

OPTIONS
  -c, --check    check prerequisites
  -h, --help     show CLI help
  -v, --verbose  verbose

EXAMPLES
  ~$ eggs prerequisites
  install prerequisites and create configuration files

  sudo eggs prerequisites -c
    create configuration's file
```

_See code: [src/commands/prerequisites.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/prerequisites.ts)_

## `eggs produce`

the system produce an egg: livecd creation.

```
USAGE
  $ eggs produce

OPTIONS
  -b, --basename=basename  basename egg
  -f, --fast               fast compression
  -h, --help               show CLI help
  -m, --max                max compression
  -n, --normal             max compression
  -s, --script             script mode. Generate scripts to manage iso build
  -v, --verbose            verbose
  -y, --yolk               -y force yolk renew
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

  $ sudo eggs produce -vm
  the same as the previuos, compression xz (normal compression)

  $ sudo eggs produce -vm
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

_See code: [src/commands/produce.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/produce.ts)_

## `eggs remove`

remove eggs, eggs configurations, prerequisites, calamares, calamares configurations

```
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

_See code: [src/commands/remove.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/remove.ts)_

## `eggs tools:clean`

clean system log, apt, etc

```
USAGE
  $ eggs tools:clean

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose
```

_See code: [src/commands/tools/clean.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/tools/clean.ts)_

## `eggs tools:initrd`

Test initrd

```
USAGE
  $ eggs tools:initrd

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
  --check=check  check if necessary to clean initrd.img
  --clean=clean  clean the initrd.img
```

_See code: [src/commands/tools/initrd.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/tools/initrd.ts)_

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

_See code: [src/commands/tools/locales.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/tools/locales.ts)_

## `eggs tools:man`

install man manual eggs

```
USAGE
  $ eggs tools:man

OPTIONS
  -h, --help     show CLI help
  -r, --remove   remove manual
  -v, --verbose  verbose
```

_See code: [src/commands/tools/man.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/tools/man.ts)_

## `eggs tools:pve`

enable/start/stop pve-live

```
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

_See code: [src/commands/tools/pve.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/tools/pve.ts)_

## `eggs tools:sanitize`

sanitize

```
USAGE
  $ eggs tools:sanitize

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/tools/sanitize.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/tools/sanitize.ts)_

## `eggs tools:skel`

update skel from home configuration

```
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

_See code: [src/commands/tools/skel.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/tools/skel.ts)_

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

_See code: [src/commands/tools/yolk.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/tools/yolk.ts)_

## `eggs update`

update the penguin's eggs tool.

```
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

_See code: [src/commands/update.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.7.25/src/commands/update.ts)_
<!-- commandsstop -->

## FILE
      /etc/penguins-eggs.d
        all eggs configurations are here

      /usr/local/share/penguins-eggs/exclude.list
        exclude.list rsync

      /usr/lib/penguins-eggs (deb package)
        here eggs is installed
      OR
      /usr/lib/node_modules/penguins-eggs/ (npm package)
        here eggs is installed


## TROUBLES
Different versions of eggs can have differents configurations files. This can lead to get errors. A fast workaround for this trouble can be download eggs, remove eggs, remove it's configurations, reinstall new version and run sudo eggs prerequisites:

  **sudo eggs update** # select basket, choose the version and download it but not install!

  **sudo apt --purge eggs** # remove eggs

  **sudo rm /usr/penguins-eggs/ rf** # remove eggs 

  **sudo rm /etc/penguins-eggs.d -rf** # remove eggs configurations files

  **sudo dpkg -i /tmp/eggs_7.7.9-1_amd64.deb** # install eggs from downloaded package

  **sudo eggs prerequisites** # check prerequisites and generate configuration's files

## BUGS

See GitHub Issues: <https://github.com/pieroproietti/penguins-eggs/issues>

## RESOURCES AND DOCUMENTATION
Website: **https://penguins-eggs.net**

Documentation: **https://penguins-eggs.net/book**

GitHub repository & Issue Tracker: **github.com/pieroproietti/penguins-eggs**

## AUTHOR

Piero Proietti <piero.proietti@gmail.com>
