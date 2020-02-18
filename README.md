[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/pieroproietti/penguins-eggs) 

penguins-eggs
=============

Penguin&#39;s eggs are generated and new birds are ready to fly...

[![Repository](https://img.shields.io/badge/repository-github.com-brightgreen)](https://github.com/pieroproietti/penguins-eggs)
[![Version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![Downloads/week](https://img.shields.io/npm/dw/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![Documentation](https://img.shields.io/badge/typedoc-documentation-brightgreen)](https://penguins-eggs.sourceforge.io/index.html)
[![book](https://img.shields.io/badge/book-penguin's%20eggs-blue)](https://penguin-s-eggs.gitbook.io/project/)
[![License](https://img.shields.io/npm/l/penguins-eggs.svg)](https://github.com/pieroproietti/penguins-eggs/blob/master/package.json)

# Presentation
penguins-eggs is a console utility, in active development, who let you to
remaster your system and redistribuite it as iso images or from the lan via PXE
remote boot.

The scope of this project is to implement the process of remastering your
version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb
key to boot your system. You can also boot your egg - via remote boot - on your
LAN.

All it is written in pure nodejs, so ideally can be used with differents Linux
distros. At the moment it is tested with Debian 10 Buster, Debian 9 Stretch, Debian 8 Jessie,
Ubuntu 19.04 and derivates as Linux Mint and Bunsenlabs Helium. 
For others distros we need to find collaborations.

penguins-eggs, at the moment 2019 september 20 is in a beta state, and can have again
same troubles for people not in confidence with Linux system administration, but
can be already extremely usefull, You can easily create your organization/school 
version of Linux and deploy it on your LAN, give it to your friends as usb key 
or publish eggs in the internet!

You can try now penguins-eggs, it is a console utility - no GUI - but don't be
scared, penguins-eggs is a console command - really very simple usage - if you
are able to open a terminal, you can use it.

# Install penguins-eggs

## Debian package
This simplest way to installe eggs is to download the [package eggs](https://sourceforge.net/projects/penguins-eggs/files/DEBS/) from [sourceforge](https://sourceforge.net/projects/penguins-eggs/files/DEBS/) and install it

```sudo dpkg -i eggs_7.1.XX-1_amd64.deb```

the most recent package, is usually the right choice.

## NPM package (require nodejs)

If you have already nodejs installed, you can install penguins-eggs with the utility npm (node package manager). 
Simply copy and past the following lines:

```sudo npm config set unsafe-perm true```

```sudo npm i penguins-eggs -g```

### Note on i386 architecture
The last official version for this architecture is Node.js v8.x, we can install it.

##### Ubuntu
```curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -```
```sudo apt-get install -y nodejs```

##### Debian
```curl -sL https://deb.nodesource.com/setup_8.x | bash -```
```apt-get install -y nodejs```

and finally, we check the nodejs version:

```apt-cache policy nodejs ```

```apt install nodejs=8.17.0-1nodesource1```

to install the nodejs version 8.

# Usage

<!-- toc -->
* [Presentation](#presentation)
* [Install penguins-eggs](#install-penguins-eggs)
* [Usage](#usage)
* [Usage](#usage-1)
* [Commands](#commands)
* [That's all Folks!](#thats-all-folks)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g penguins-eggs
$ eggs COMMAND
running command...
$ eggs (-v|--version|version)
penguins-eggs/7.1.42 linux-x64 node-v12.15.0
$ eggs --help [COMMAND]
USAGE
  $ eggs COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`eggs calamares`](#eggs-calamares)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs info`](#eggs-info)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs prerequisites`](#eggs-prerequisites)
* [`eggs produce`](#eggs-produce)
* [`eggs sterilize`](#eggs-sterilize)
* [`eggs update`](#eggs-update)

## `eggs calamares`

Install calamares installer and configure it

```
USAGE
  $ eggs calamares

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.1.42/src/commands/calamares.ts)_

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

## `eggs info`

informations about penguin's eggs

```
USAGE
  $ eggs info

EXAMPLE
  $ eggs info
  You will find here informations about penguin's eggs!
```

_See code: [src/commands/info.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.1.42/src/commands/info.ts)_

## `eggs install`

penguin's eggs installation

```
USAGE
  $ eggs install

OPTIONS
  -g, --gui  use the gui installer

ALIASES
  $ eggs hatch

EXAMPLE
  $ eggs install
  penguin's eggs installation
```

_See code: [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.1.42/src/commands/install.ts)_

## `eggs kill`

kill the eggs/free the nest

```
USAGE
  $ eggs kill

ALIASES
  $ eggs clean

EXAMPLE
  $ eggs kill
  kill the eggs/free the nest
```

_See code: [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.1.42/src/commands/kill.ts)_

## `eggs prerequisites`

install the prerequisites packages to run penguin's eggs

```
USAGE
  $ eggs prerequisites

EXAMPLE
  $ eggs prerequisites
  install the prerequisites packages to run penguin's eggs
```

_See code: [src/commands/prerequisites.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.1.42/src/commands/prerequisites.ts)_

## `eggs produce`

the penguin produce an egg

```
USAGE
  $ eggs produce

OPTIONS
  -B, --bindFs             bind file systen (fast but unsure)
  -b, --basename=basename  basename egg
  -c, --compress           max compression
  -f, --fast               compression fast
  -h, --info               show CLI help

ALIASES
  $ eggs spawn
  $ eggs lay

EXAMPLE
  $ eggs produce --basename uovo
  the penguin produce an egg called uovo-i386-2020-01-18_2000.iso
```

_See code: [src/commands/produce.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.1.42/src/commands/produce.ts)_

## `eggs sterilize`

describe the command here

```
USAGE
  $ eggs sterilize

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/sterilize.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.1.42/src/commands/sterilize.ts)_

## `eggs update`

update/upgrade the penguin's eggs tool

```
USAGE
  $ eggs update

EXAMPLE
  $ eggs update
  update/upgrade the penguin's eggs tool
```

_See code: [src/commands/update.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.1.42/src/commands/update.ts)_
<!-- commandsstop -->

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations
For other informations, there is same documentation i the document folder of this repository,
look at [Piero Proietti's blog](http://pieroproietti.github.com),
contact me, or open an [issue](https://github.com/pieroproietti/penguins-eggs/issues) on github.

I mostly use Facebook.

* facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/)
* twitter: [@pieroproietti](https://twitter.com/pieroproietti)
* mail: piero.proietti@gmail.com


## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](http://pieroproietti.github.com), dual licensed under the MIT or GPL Version 2 licenses.
