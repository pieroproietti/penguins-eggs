eggs(1) -- A reproductive system for penguins
=============================================

<!-- toc -->

<!-- tocstop -->

## SYNOPSIS

<!-- usage -->
<!-- usage -->
```sh-session
$ npm install -g penguins-eggs
$ eggs COMMAND
running command...
$ eggs (-v|--version|version)
penguins-eggs/7.7.25 linux-x64 node-v14.15.4
$ eggs --help [COMMAND]
USAGE
  $ eggs COMMAND
...
```
<!-- usagestop -->
<!-- usagestop -->

Most of the commands of eggs need sudo, but there are exceptions for export, info and mom.

examples:

```
sudo eggs init  # initialize eggs, create man pages and autocomplete for eggs
sudo eggs produce # create an ISO of the system
sudo eggs kill # delete the created ISO and clean the nest
```
There are too, two interactive helpers:

```
eggs mom # interactive GUI (be kind with mom, she don't need sudo)
sudo eggs dad # get help from dad to finalize ISO
```

Help yorself signing in the forum or in facebook group page or asking me.

## DESCRIPTION

eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso image.

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb key to boot your system. You can easily install your live system with gui installer (calamares)  or eggs cli installer.

## COMMANDS

<!-- commands -->
<!-- commands -->
* [eggs adapt](#eggs-adapt)
* [eggs autocomplete [SHELL]](#eggs-autocomplete-shell)
* [eggs calamares](#eggs-calamares)
* [eggs dad](#eggs-dad)
* [eggs export:deb](#eggs-exportdeb)
* [eggs export:docs](#eggs-exportdocs)
* [eggs export:iso](#eggs-exportiso)
* [eggs help [COMMAND]](#eggs-help-command)
* [eggs info](#eggs-info)
* [eggs init](#eggs-init)
* [eggs install](#eggs-install)
* [eggs kill](#eggs-kill)
* [eggs mom](#eggs-mom)
* [eggs produce](#eggs-produce)
* [eggs remove](#eggs-remove)
* [eggs tools:clean](#eggs-toolsclean)
* [eggs tools:initrd](#eggs-toolsinitrd)
* [eggs tools:locales](#eggs-toolslocales)
* [eggs tools:pve](#eggs-toolspve)
* [eggs tools:sanitize](#eggs-toolssanitize)
* [eggs tools:skel](#eggs-toolsskel)
* [eggs tools:yolk](#eggs-toolsyolk)
* [eggs update](#eggs-update)

## eggs adapt

adapt monitor resolution for VM only


USAGE
  $ eggs adapt

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ eggs adjust




## eggs autocomplete [SHELL]

display autocomplete installation instructions


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




## eggs calamares

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




## eggs dad

ask help from daddy (gui interface)!


USAGE
  $ eggs dad

OPTIONS
  -h, --help     show CLI help
  -v, --verbose




## eggs export:deb

export package eggs-v7-x-x-1.deb in the destination host


USAGE
  $ eggs export:deb

OPTIONS
  -c, --clean  remove old .deb before to copy
  -h, --help   show CLI help
  --all        export all archs
  --amd64      export amd64 arch
  --armel      export armel arch
  --i386       export i386 arch




## eggs export:docs

remove and export docType documentation of the sources in the destination host


USAGE
  $ eggs export:docs

OPTIONS
  -h, --help  show CLI help




## eggs export:iso

export iso in the destination host


USAGE
  $ eggs export:iso

OPTIONS
  -c, --clean  delete old ISOs before to copy
  -h, --help   show CLI help




## eggs help [COMMAND]

display help for eggs


USAGE
  $ eggs help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI




## eggs info

informations about system and eggs


USAGE
  $ eggs info

EXAMPLE
  $ eggs info
  You will find here informations about penguin's eggs!




## eggs init

Initialize eggs and install packages prerequisites to run eggs


USAGE
  $ eggs init

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose

ALIASES
  $ eggs prerequisites
  $ eggs config

EXAMPLE
  ~$ eggs init
  install prerequisites and create configuration files




## eggs install

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




## eggs kill

kill the eggs/free the nest


USAGE
  $ eggs kill

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose

EXAMPLE
  $ eggs kill
  kill the eggs/free the nest




## eggs mom

ask for mommy (gui interface)!


USAGE
  $ eggs mom

OPTIONS
  -h, --help  show CLI help




## eggs produce

the system produce an egg: livecd creation.


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




## eggs remove

remove eggs, eggs configurations, prerequisites, calamares, calamares configurations


USAGE
  $ eggs remove

OPTIONS
  -a, --all            remove all
  -h, --help           show CLI help
  -p, --prerequisites  remove eggs packages prerequisites
  -v, --verbose        verbose
  --purge              remove eggs, eggs configuration

EXAMPLES
  $ sudo eggs remove 
  remove eggs

  $ sudo eggs remove --purge 
  remove eggs, eggs configurations

  $ sudo eggs remove --prerequisites 
  remove packages prerequisites, calamares, calamares configurations

  $ sudo eggs remove --all
  remove eggs, eggs configurations, prerequisites, calamares, calamares configurations




## eggs tools:clean

clean system log, apt, etc


USAGE
  $ eggs tools:clean

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose




## eggs tools:initrd

Test initrd


USAGE
  $ eggs tools:initrd

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
  --check=check  check if necessary to clean initrd.img
  --clean=clean  clean the initrd.img




## eggs tools:locales

install/clean locales


USAGE
  $ eggs tools:locales

OPTIONS
  -h, --help       show CLI help
  -r, --reinstall  reinstall locales
  -v, --verbose    verbose




## eggs tools:pve

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




## eggs tools:sanitize

sanitize


USAGE
  $ eggs tools:sanitize

OPTIONS
  -h, --help  show CLI help




## eggs tools:skel

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




## eggs tools:yolk

configure eggs to install without internet


USAGE
  $ eggs tools:yolk

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

EXAMPLE
  $ eggs yolk -v




## eggs update

update the penguin's eggs tool.


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



<!-- commandsstop -->
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
Different versions of eggs can have differents configurations files. This can lead to get errors. 

A fast workaround for this trouble can be:

* download eggs
* remove eggs
+ remove it's configurations
* reinstall new version
+ run sudo eggs init

Here are the commands to do:

* **sudo eggs update** # select basket, choose the version and download it but not install!

* **sudo apt --purge eggs** # remove eggs

* **sudo rm /usr/penguins-eggs/ rf** # remove eggs 

* **sudo rm /etc/penguins-eggs.d -rf** # remove eggs configurations files

* **sudo dpkg -i /tmp/eggs_7.7.9-1_amd64.deb** # install eggs from downloaded package

* **sudo eggs init** # check prerequisites and generate configuration's files

## BUGS

Report problems o new ideas in: <https://github.com/pieroproietti/penguins-eggs/issues>

## RESOURCES AND DOCUMENTATION
Consult website to find  documentation, forum. There is a facebook gruop and page too.

* website: **https://penguins-eggs.net**
* gitHub repository: **github.com/pieroproietti/penguins-eggs**

## AUTHOR

Piero Proietti <piero.proietti@gmail.com>
