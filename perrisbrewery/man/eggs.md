eggs(1) -- A reproductive system for penguins
=============================================

* [Index](#index)
* [Presentation](#presentation)
* [Packages](#packages)
* [Usage](#usage)
* [Commands](#commands)
* [Terminal samples](#terminal-samples)
* [That&#39;s all Folks!](#thats-all-folks)


## SYNOPSIS

```sh-session
$ npm install -g penguins-eggs
$ eggs COMMAND
running command...
$ eggs (-v|--version|version)
penguins-eggs/7.8.10 linux-x64 node-v14.15.4
$ eggs --help [COMMAND]
USAGE
  $ eggs COMMAND
...
```


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

* [&#x60;eggs adapt&#x60;](#eggs-adapt)
* [&#x60;eggs autocomplete [SHELL]&#x60;](#eggs-autocomplete-shell)
* [&#x60;eggs calamares&#x60;](#eggs-calamares)
* [&#x60;eggs dad&#x60;](#eggs-dad)
* [&#x60;eggs export:deb&#x60;](#eggs-exportdeb)
* [&#x60;eggs export:docs&#x60;](#eggs-exportdocs)
* [&#x60;eggs export:iso&#x60;](#eggs-exportiso)
* [&#x60;eggs help [COMMAND]&#x60;](#eggs-help-command)
* [&#x60;eggs info&#x60;](#eggs-info)
* [&#x60;eggs install&#x60;](#eggs-install)
* [&#x60;eggs kill&#x60;](#eggs-kill)
* [&#x60;eggs mom&#x60;](#eggs-mom)
* [&#x60;eggs prerequisites&#x60;](#eggs-prerequisites)
* [&#x60;eggs produce&#x60;](#eggs-produce)
* [&#x60;eggs remove&#x60;](#eggs-remove)
* [&#x60;eggs tools:clean&#x60;](#eggs-toolsclean)
* [&#x60;eggs tools:initrd&#x60;](#eggs-toolsinitrd)
* [&#x60;eggs tools:locales&#x60;](#eggs-toolslocales)
* [&#x60;eggs tools:pve&#x60;](#eggs-toolspve)
* [&#x60;eggs tools:sanitize&#x60;](#eggs-toolssanitize)
* [&#x60;eggs tools:skel&#x60;](#eggs-toolsskel)
* [&#x60;eggs tools:yolk&#x60;](#eggs-toolsyolk)
* [&#x60;eggs update&#x60;](#eggs-update)

## &#x60;eggs adapt&#x60;

adapt monitor resolution for VM only

&#x60;&#x60;&#x60;
USAGE
  $ eggs adapt

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ eggs adjust
&#x60;&#x60;&#x60;


## &#x60;eggs autocomplete [SHELL]&#x60;

display autocomplete installation instructions

&#x60;&#x60;&#x60;
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
&#x60;&#x60;&#x60;


## &#x60;eggs calamares&#x60;

calamares or install or configure it

&#x60;&#x60;&#x60;
USAGE
  $ eggs calamares

OPTIONS
  -f, --final    final: remove eggs prerequisites, calamares and all it&#39;s dependencies
  -h, --help     show CLI help
  -i, --install  install calamares and it&#39;s dependencies
  -v, --verbose
  --theme&#x3D;theme  theme&#x2F;branding for eggs and calamares

EXAMPLES
  ~$ sudo eggs calamares 
  create&#x2F;renew calamares configuration&#39;s files

  ~$ sudo eggs calamares -i 
  install calamares and create it&#39;s configuration&#39;s files
&#x60;&#x60;&#x60;


## &#x60;eggs dad&#x60;

ask help from daddy (gui interface)!

&#x60;&#x60;&#x60;
USAGE
  $ eggs dad

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
&#x60;&#x60;&#x60;


## &#x60;eggs export:deb&#x60;

export package eggs-v7-x-x-1.deb in the destination host

&#x60;&#x60;&#x60;
USAGE
  $ eggs export:deb

OPTIONS
  -c, --clean  remove old .deb before to copy
  -h, --help   show CLI help
  --all        export all archs
  --amd64      export amd64 arch
  --armel      export armel arch
  --i386       export i386 arch
&#x60;&#x60;&#x60;


## &#x60;eggs export:docs&#x60;

remove and export docType documentation of the sources in the destination host

&#x60;&#x60;&#x60;
USAGE
  $ eggs export:docs

OPTIONS
  -h, --help  show CLI help
&#x60;&#x60;&#x60;


## &#x60;eggs export:iso&#x60;

export iso in the destination host

&#x60;&#x60;&#x60;
USAGE
  $ eggs export:iso

OPTIONS
  -c, --clean  delete old ISOs before to copy
  -h, --help   show CLI help
&#x60;&#x60;&#x60;


## &#x60;eggs help [COMMAND]&#x60;

display help for eggs

&#x60;&#x60;&#x60;
USAGE
  $ eggs help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
&#x60;&#x60;&#x60;


## &#x60;eggs info&#x60;

informations about system and eggs

&#x60;&#x60;&#x60;
USAGE
  $ eggs info

EXAMPLE
  $ eggs info
  You will find here informations about penguin&#39;s eggs!
&#x60;&#x60;&#x60;


## &#x60;eggs install&#x60;

eggs installer - (the egg became penguin)

&#x60;&#x60;&#x60;
USAGE
  $ eggs install

OPTIONS
  -c, --cli        try to use antiX installer (cli)
  -g, --gui        use Calamares installer (gui)
  -h, --info       show CLI help
  -l, --lvmremove  remove lvm &#x2F;dev&#x2F;pve
  -m, --mx         try to use MX installer (gui)
  -u, --umount     umount devices
  -v, --verbose    verbose

ALIASES
  $ eggs hatch

EXAMPLE
  $ eggs install
  Install the system with eggs cli installer(default)
&#x60;&#x60;&#x60;


## &#x60;eggs kill&#x60;

kill the eggs&#x2F;free the nest

&#x60;&#x60;&#x60;
USAGE
  $ eggs kill

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose

EXAMPLE
  $ eggs kill
  kill the eggs&#x2F;free the nest
&#x60;&#x60;&#x60;


## &#x60;eggs mom&#x60;

ask for mommy (gui interface)!

&#x60;&#x60;&#x60;
USAGE
  $ eggs mom

OPTIONS
  -h, --help  show CLI help
&#x60;&#x60;&#x60;


## &#x60;eggs prerequisites&#x60;

Initialize eggs and install packages prerequisites to run eggs

&#x60;&#x60;&#x60;
USAGE
  $ eggs prerequisites

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose

ALIASES
  $ eggs fertilize
  $ eggs init

EXAMPLE
  ~$ eggs init
  Initialize eggs, install prerequisites and create configuration files
&#x60;&#x60;&#x60;


## &#x60;eggs produce&#x60;

the system produce an egg: livecd creation.

&#x60;&#x60;&#x60;
USAGE
  $ eggs produce

OPTIONS
  -b, --basename&#x3D;basename  basename
  -f, --fast               fast compression
  -h, --help               show CLI help
  -m, --max                max compression
  -n, --normal             normal compression
  -p, --prefix&#x3D;prefix      prefix
  -s, --script             script mode. Generate scripts to manage iso build
  -v, --verbose            verbose
  -y, --yolk               -y force yolk renew
  --adapt                  adapt video resolution in VM
  --final                  final: remove eggs prerequisites, calamares and all it&#39;s dependencies
  --ichoice                allows the user to choose the installation type cli&#x2F;gui
  --pve                    administration of virtual machines (Proxmox-VE)
  --rsupport               remote support via dwagent
  --theme&#x3D;theme            theme&#x2F;branding for eggs and calamares

ALIASES
  $ eggs spawn
  $ eggs lay

EXAMPLES
  $ sudo eggs produce 
  produce an ISO called [hostname]-[arch]-YYYY-MM-DD_HHMM.iso, compressed xz (standard compression).
  If hostname&#x3D;ugo and arch&#x3D;i386 ugo-x86-2020-08-25_1215.iso

  $ sudo eggs produce -v
  the same as the previuos, but with more explicative output

  $ sudo eggs produce -vf
  the same as the previuos, compression lz4 (fastest but about 30%
  less compressed than xz)

  $ sudo eggs produce -vm
  the same as the previuos, compression xz (normal compression xz)

  $ sudo eggs produce -vm
  the same as the previuos, compression xz -Xbcj x86 (max compression, about 10%
  more compressed)

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
  in &#x2F;home&#x2F;eggs&#x2F;ovarium and you can customize all you need
&#x60;&#x60;&#x60;


## &#x60;eggs remove&#x60;

remove eggs, eggs configurations, prerequisites, calamares, calamares configurations

&#x60;&#x60;&#x60;
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
&#x60;&#x60;&#x60;


## &#x60;eggs tools:clean&#x60;

clean system log, apt, etc

&#x60;&#x60;&#x60;
USAGE
  $ eggs tools:clean

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose
&#x60;&#x60;&#x60;


## &#x60;eggs tools:initrd&#x60;

Test initrd

&#x60;&#x60;&#x60;
USAGE
  $ eggs tools:initrd

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
  --check&#x3D;check  check if necessary to clean initrd.img
  --clean&#x3D;clean  clean the initrd.img
&#x60;&#x60;&#x60;


## &#x60;eggs tools:locales&#x60;

install&#x2F;clean locales

&#x60;&#x60;&#x60;
USAGE
  $ eggs tools:locales

OPTIONS
  -h, --help       show CLI help
  -r, --reinstall  reinstall locales
  -v, --verbose    verbose
&#x60;&#x60;&#x60;


## &#x60;eggs tools:pve&#x60;

enable&#x2F;start&#x2F;stop pve-live

&#x60;&#x60;&#x60;
USAGE
  $ eggs tools:pve

OPTIONS
  -d, --disable  disable
  -e, --enable   enable
  -h, --help     show CLI help
  -v, --verbose  stop service
  --start        start
  --stop         stop service
&#x60;&#x60;&#x60;


## &#x60;eggs tools:sanitize&#x60;

sanitize

&#x60;&#x60;&#x60;
USAGE
  $ eggs tools:sanitize

OPTIONS
  -h, --help  show CLI help
&#x60;&#x60;&#x60;


## &#x60;eggs tools:skel&#x60;

update skel from home configuration

&#x60;&#x60;&#x60;
USAGE
  $ eggs tools:skel

OPTIONS
  -h, --help       show CLI help
  -u, --user&#x3D;user  user to be used
  -v, --verbose

EXAMPLE
  $ eggs skel --user mauro
  desktop configuration of user mauro will get used as default
&#x60;&#x60;&#x60;


## &#x60;eggs tools:yolk&#x60;

configure eggs to install without internet

&#x60;&#x60;&#x60;
USAGE
  $ eggs tools:yolk

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

EXAMPLE
  $ eggs yolk -v
&#x60;&#x60;&#x60;


## &#x60;eggs update&#x60;

update the penguin&#39;s eggs tool.

&#x60;&#x60;&#x60;
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
  update&#x2F;upgrade the penguin&#39;s eggs tool
&#x60;&#x60;&#x60;



## FILES
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
* gitHub repository: **https://github.com/pieroproietti/penguins-eggs**

## AUTHOR

Piero Proietti <piero.proietti@gmail.com>
