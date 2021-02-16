penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-blue)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-blue)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-blue)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-orange)](https://sourceforge.net/projects/penguins-eggs/files/packages-deb)
[![iso](https://img.shields.io/badge/iso-images-orange)](https://sourceforge.net/projects/penguins-eggs/files/iso)

# Penguin's eggs Debian package

Usually the last version is the right one. Detailed instrunctions for usage are published on the [penguin's eggs book](https://penguins-eggs.net/book). 
You can follow the project also consulting the [commit history](https://github.com/pieroproietti/penguins-eggs/commits/master). 

## Changelog
Versions are listed on reverse order, the first is the last one.

### eggs-7.8.13
* modified pre e post install scripts and added check presence /usr/man/man1 and /etc/bash_completion.d. 

### eggs-7.8.12
* added cli-autologin in naked live versions. 

### eggs-7.8.11
* removed unused commands: initrd, pve and sanitize. New version eggs.1 man and eggs.1.html

### eggs-7.8.10
* perrisbrewey: just a step in the brewery and preinst, postinst, prerm e postrm are all ready!

### eggs-7.7.33
* added display user and password on liveCD. Most prerequisites packages are now as dependecies

### eggs-7.7.32
* bugfix add autocomplete in i386. Added control, preinst, postinst, prerm, postrm in deb packages 

### eggs-7.7.31
* bugfix export:iso, I hope definitive!

### eggs-7.7.30
* bugfix export:iso, changed locales array to user configuration plus en_US.UTF8.

### eggs-7.7.29
* workaround to solve problems compatility oclif-plugings with node8, actually all commands works on i386, except autocomplete and command-not-found.

### eggs-7.7.28
* added --prefix in produce, mom get you original manual and translations at your fingertips

### eggs-7.7.27
* eggs init in place of prerequisites. The new version will install man and aucomplete. Sorry, due nodejs version, I forced to remove i386 version.

### eggs-7.7.24
* mom now only cli version. update all dependecies except js-yaml 3.14.1 - 4.0.0, but node8 don't work.

### eggs-7.7.23
* mom execute mom-cli if zenity is not present. hostname fixed in hatching

### eggs-7.7.21
* bugfix eggs.yaml, refactoring settings. Now we have theme saved in dad, and others vars are possible

### eggs-7.7.18
* added Linux Mint 20.1 ulyssa 

### eggs-7.7.17
* resolved bug #38 mancata rimozione yolk.list e mancata creazione di machine-id

### eggs-7.7.16
* little bug fix in mom and mom-cli to let install and use of man

### eggs-7.7.15
* added command eggs tools:man. Install/remove man pages for eggs

### eggs-7.7.9
* install system without internet update, just yolk

### eggs-7.7.8
* cleaning and bug fixes

### eggs-7.7.7
* added command dad, expanded mom both gui/cli helpers for reproductive eggs!

### eggs-7.7.6 deprecated
* added command mom, a gui/cli helper for reproductive eggs!

# Older [deprecated] versions 
Here, You can find [older versions](/documents/changelog-old.md).

# Help
Don't esitate to ask me for suggestions and help.

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations

You can find more informations at [Penguin's eggs blog](https://penguins-eggs.net).

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* mail: piero.proietti@gmail.com

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
