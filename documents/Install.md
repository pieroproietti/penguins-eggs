
![penguins-eggs](https://github.com/pieroproietti/penguins-eggs/blob/master/assets/penguins-eggs.png?raw=true)
# penguin's eggs

[![NPM Package](https://img.shields.io/npm/v/penguins-eggs.svg?style=flat)](https://npmjs.org/package/penguins-eggs "View this project on npm")
[![Build Status](https://travis-ci.org/pieroproietti/penguins-eggs.svg?branch=master)](https://travis-ci.org/pieroproietti/penguins-eggs)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![Join the chat at https://gitter.im/penguins-eggs/Lobby](https://badges.gitter.im/pieroproietti/penguins-eggs.svg)](https://gitter.im/penguins-eggs/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
&nbsp;[gitbook](https://penguin-s-eggs.gitbook.io/project/) &nbsp;[leggimi](./README.it_IT.md)&nbsp;[trends](https://www.npmtrends.com/penguins-eggs) &nbsp;[sourceforge](https://sourceforge.net/projects/penguins-eggs/)  &nbsp;[notes](https://github.com/pieroproietti/penguins-eggs/blob/master/developer.md)


## Presentation
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

## Install penguins-eggs
Well, it is time to try it!

### Prerequisites
penguins-eggs need nodejs installed, use the version on the nodesource [repository](https://github.com/nodesource/distributions/blob/master/README.md#deb). You can install version 12 for AMD64, or the version 8 for i386 (i386 is not available for Node.js 10 and later) according your computer architecture.

If not already installed, You need also to install the ``build-essential`` package too.

```apt-get install build-essential```

penguins-eggs depend on various packages too, you must install them using once the options
prerequisites-cli and prerequisites-calamares, if you want to use the GUI installer.

### Installation penguins-eggs via npm

After You have installed nodejs, you can install penguins-eggs with the utility npm (node package manager). 
Simply copy and past the following lines:

```sudo npm config set unsafe-perm true```

```sudo npm i penguins-eggs -g```

### Intel 386
The last version is Node.js v8.x:

#### Ubuntu
```curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -```
```sudo apt-get install -y nodejs```

#### Debian

```curl -sL https://deb.nodesource.com/setup_8.x | bash -```

```apt-get install -y nodejs```

and finally, we check the nodejs version:

```apt-cache policy nodejs ```

 ```nodejs: ```
 ```  Installato: 8.16.1-1nodesource1 ```
 ```  Candidato:  8.16.1-1nodesource1 ```
 ```  Tabella versione: ```
 ``` *** 8.16.1-1nodesource1 100 ```
 ```        100 /var/lib/dpkg/status ```

and install it:

```apt install nodejs=8.16.1-1nodesource1```


### Installation penguins-eggs from source

You need a functional installation of Linux Debian version 10, 9 or 8, LinuxMint, LMDE, 
Ubuntu 19.04 or derivates and install all the prerequisites plus the ``build-essential`` package.

```apt-get install build-essential```

At this point You can download last version on github.com. Copy and past the
following lines:

```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
npm i
```

You can launch egg, in developer mode, in this way:

```cd penguins-eggs```

```sudo npm run ts-start spawn```

or, in short: 

```./eggs spawn```

Of course, you can build it or link it.