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

penguins-eggs, at the moment 2021 febrary is a mature tool and is extremely usefull, You can easily create your personal customized iso or your organization/school version of Linux and deploy it on your LAN, give it to your friends as usb key or publish yours eggs in the internet!

Try penguins-eggs yes, it is a console utility - no GUI - but don't be scared, penguins-eggs is a console command - really very simple - if you are able to open a terminal, you can use it and yours final users will enjoy of full gui and pratical installer to install your livecd.

## Addons
Starting with version 7.6.x an addons architecture was been added to eggs, that allows third parties to develop extensions. Note that we currently have an extension for the theme that includes both calamares branding and installer link and icon. In addition, also as addon has been developed others addons, to chosen hoosing between GUI or CLI installation, adapt video resolution, etc.

## yolk 
yolk so called - staying on the subject of eggs - is a local repository included in the livecd that contains a minimum of indispensable packages during installation. Thanks to yolk, you can safely install your system without the need o an active internet connection.

## Two great helpers!
I recently added two lightweight helpers integrated with eggs: mom and dad. While mom is a bash script with whiptail - and guides the user to the various commands and documentation. Dad is a short way to creating the iso: all you have to do is type in **sudo eggs dad** and follow simple instructions.

## What distributions can I use?
Eggs is born on Debian strecth/buster, full support Debian bullseys, Devuan beowulf, Ubuntu focal, bionic and derivatives. I usually try it against Debian buster, Devuan beowulf, Linux Mint 19.3 tricia (bionic derivated) and Linux Mint 20 ulyana (focal derivated) before releases. I tried it successfully in LMDE 4 debbie, and deepin. Eggs, generally must work with all the derivates from that distros.

Some iso images remastered with eggs are in the [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/iso/). 

# Packages
eggs is released as deb package and npm package. Most users need just deb version, if you already use nodejs the npm package can be installed too, 

## deb packages
eggs is released deb packages for i386 and amd64 architectures. Due the characteristic of eggs, they can installed in Debian, Devuan or Ubuntu based distros, withouth worries about different versions, except for the architecture. Lately was added scripts for preinst, postinst, prerm and postrm not presents in the original.

### Install
This simplest way to install eggs is download the [package eggs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) from [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/) and install it

```
sudo dpkg -i eggs_7.7.33-1_amd64.deb
```

or, on a i386 system:
```
sudo dpkg -i eggs_7.7.33-1_i386.deb
```
### update
The fastest way to use sudo eggs update and choose basket. Eggs let you to select the last 4 versions in the basket and install it.

```sudo eggs update```

Of course, if your distro include eggs in the repository, you can use apt too.


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
penguins-eggs/7.8.30 linux-x64 node-v14.16.0
$ eggs --help [COMMAND]
USAGE
  $ eggs COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`eggs autocomplete [SHELL]`](#eggs-autocomplete-shell)
* [`eggs help [COMMAND]`](#eggs-help-command)

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
