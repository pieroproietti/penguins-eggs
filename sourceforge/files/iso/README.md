penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![repo](https://img.shields.io/badge/repo-github.com-blue)](https://github.com/pieroproietti/penguins-eggs)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![debs](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![isos](https://img.shields.io/badge/iso-images-blue)](https://sourceforge.net/projects/penguins-eggs/files/iso)
[![typedoc](https://img.shields.io/badge/doc-typedoc-blue)](https://penguins-eggs.sourceforge.io/index.html)
[![book](https://img.shields.io/badge/book-penguin's%20eggs-blue)](https://penguin-s-eggs.gitbook.io/project/)
[![facebook](https://img.shields.io/badge/page-facebook-blue)](https://www.facebook.com/penguinseggs)
[![gitter](https://img.shields.io/badge/chat-gitter-blue)](https://gitter.im/penguins-eggs-1/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![License](https://img.shields.io/badge/license-MIT/GPL2-blue)](https://github.com/pieroproietti/penguins-eggs/blob/master/LICENSE)


# Penguin's eggs remastered ISOs

All ISOs are based on Debian Buster, Ubuntu Focal, Linux Mint 19.x and Deepin 20 Beta. 

# user/password
* ```live/evolution```
* ```root/evolution```

All the ISOs include nodejs and eggs installed (.npm package), so you can update your eggs tool with the command:

```sudo eggs update```

# ISOs

I work mostly on Debian stable, so here you can find my personal versions and other examples.

## Debian Buster
* **debu**  - it is my personal version with cinnamon, mostly for development, but include common office tools;
* **lampp** - same as debu, but with tools to develop web sites with php and wordpress;
* **naked** - just the juice, without GUI, with nodejs and eggs. You can start here to build your revolution! 
* **less** - it's just naked, dressed with lxde-core and the tools to work.
* **blockchain** - I'm not a blockchain expert, the idea is to give an example of that is possible to build with eggs. I mean an an ISO image to giveup to * students for learn blockchain, develop smart contracts, etc. Feel free to give suggestions on it or ask for help to build your own version.
* **incubator** - Debian Buster + Proxmox VE 6.2 and the same tools of debu;

## Linux Mint Debian Edition 4 
* **lmde4** - LMDE4 Debbie, remastered with eggs, without any modifications except for develop tools.

## Linux Mint 19.3
* **tricia** - Linux Mint 19.3 remastered with eggs, without any modifications except for develop tools.

## Deepin 20 beta
* **dpin** - deepin 20 beta apricot remastered with eggs, without any modifications except for develop tools.

## Ubuntu 20.04 focal
* **ufo-mini** - Ubuntu focal minimal installation, remastered with eggs, without any modifications except for develop tools.



# Collaboration

A suitable way to start to collaborate in penguin's eggs development can be to install one of them (I suggest debu) or install nodejs, git, build-essential in in your personal system, and start to play with penguins-eggs source.

It is quite simple! Just download penguins-eggs the sources with the command:

```git clone https://github.com/pieroproietti/penguins-eggs```


Install in it the necessary npm packages:

```cd penguins-egg```

```npm i```

And now, from the same directory, you can use eggs from sources:

```~/penguins-eggs$ .\eggs info```

```~/penguins-eggs$ sudo .\eggs produce -fv```

You can also use choose the option -d (--dry) and play later with the scripts in /home/eggs/ovarium. Can be exciting! ;-)

Don't esitate to ask me for suggestions and help.

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations
For other informations, there is same documentation i the document folder of this repository,
look at facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/),
contact me, or open an [issue](https://github.com/pieroproietti/penguins-eggs/issues) on github.

I mostly use Facebook.

* facebook personal: [Piero Proietti](https://www.facebook.com/thewind61)
* facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/)
* facebook page:  [Penguin's Eggs](https://www.facebook.com/penguinseggs)
* mail: piero.proietti@gmail.com


## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://github.com/pieroproietti), dual licensed under the MIT or GPL Version 2 licenses.
