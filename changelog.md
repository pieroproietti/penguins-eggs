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

Detailed instructions for usage are published on the [penguin's eggs book](https://penguins-eggs.net/book). 
You can follow the project also consulting the [commit history](https://github.com/pieroproietti/penguins-eggs/commits/master). 

## Changelog
Versions are listed on reverse order, the first is the last one. Old versions are moved to [versions](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/versions/). 

### eggs-9.1.35
refresh exclude.list from [resfratasnapshot](https://git.devuan.org/pieroproietti/refractasnapshot-base/src/branch/master/snapshot_exclude.list), this solve the delay in boot from live of bionic

### eggs-9.1.34
Arch: I started to try to use eggs against Arch Linux original, using archiso hooks, here is the [BUILDPKG](https://github.com/pieroproietti/penguins-eggs-archlinux). 


### eggs-9.1.33
* krill: all the methods of class krill-install, are now on individual files under modules. This is not a difference of beaviour, but was made in the hope to help peoples experts in calamares to try/use/collaborate in krill

### eggs-9.1.32
* krill: command install became krill
* krill: added autoconfiguration from internet for timezone;
* krill: now /etc/locale.gen seem to be OK on manjaro
* krill: command localectl set-keymap [map] in krill-sequence don't update /etc/default/keyboard, I tried to force that, but again don't work
* krill: as workaround it' possible to reconfigure keyboard after the installation
         
### eggs-9.1.31
* focal/jammy: removed in before_bootloader_contest.yml command apt-cd:
* manjaro: a lot of work on dependencies and package
* all distros: bugfix module calamares package.yml

### eggs-9.1.29
* nodejs: restart to use node v. 16.x to be compatible with Ubuntu bionic glibc.2.27 
* focal, bionic: rebuild naked CLI version for focal and bionic and added some species:
* manjaro: bug fix module packages.conf
* package: added lvm2 to dependencies
. distros: added linuxmint vanessa

### eggs-9.1.28
* calamares: renamed eggs-cleanup to cleanup; removed complete path to run sed in the script cleanup.sh, becouse a differents paths in Devuan and others

### eggs-9.1.27
* calamares: unified modules eggs-cleanup and remove-link on calamares module eggs-cleanup. This simplify a bit and let to check if /etc/issue and /etc/motd are not present.
* adapt: the link to adapt the monitor to the size of the VM now work alone work now without eggs.

### eggs-9.1.26
* localization: rewrote completely the way to get/edit locale.gen due a prolem with calamares installer

### eggs-9.1.25
* produce: flag --release now configure calamares to remove calamares. eggs and live* dependencies, bugfix enable links on desktop;
* calamares: renamed option --final to the more appropriate --release.

### eggs-9.1.24
* wardrobe wear: added flag --no_firmwares to skip firmwares installation in case we are wearing a costume for a VMs:  most of the cases during developing.

### eggs-9.1.23
* building eggs: thanks a little patch to [oclif](https://github.com/pieroproietti/penguins-oclif), we switched to [pnpm](https://github.com/pnpm/pnpm) in place of [npm](https://github.com/npm/cli) to build eggs, this reduce a lot times for compiling, no changes on the usage. At the same time we moved from nodejs 16.x to nodejs 18.x.

### eggs-8.17.17-1 (i386)
* tested against devuan beowulf/chimaera, debian buster/bullseye/bookworm, neon developer (ubuntu focal). This is the last version for i386 architecture.

### Older versions 
You can find older versions on the [penguins-eggs repo](https://github.com/pieroproietti/penguins-eggs) under in **changelog-old.md** under **documents**

# Help
Don't esitate to ask me for suggestions and help. I hope to receive [feedback](https://github.com/pieroproietti/penguins-eggs/issues).

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

# More informations
* site: [penguins-eggs.net](https://penguins-eggs.net)
* meeting: [jitsi meet](https://meet.jit.si/PenguinsEggsMeeting)
* gitter: [penguin's eggs chat](https://gitter.im/penguins-eggs-1/community?source=orgpage)
* issues: [github](https://github.com/pieroproietti/penguins-eggs/issues).
* facebook:  
   * [penguin's eggs Group](https://www.facebook.com/groups/128861437762355/)
   * [penguin's eggs Page](https://www.facebook.com/penguinseggs)
   * mail: piero.proietti@gmail.com

# Copyright and licenses
Copyright (c) 2017, 2021 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
