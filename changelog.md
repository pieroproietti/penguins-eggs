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
Versions are listed on reverse order, the first is the last one. Old versions are moved to [oldest](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/oldest/). 

### eggs-9.1.23
* building eggs: thanks a little patch to [oclif](https://github.com/pieroproietti/penguins-oclif), we switched to [pnpm](https://github.com/pnpm/pnpm) in place of [npm](https://github.com/npm/cli) to build eggs, this reduce a lot times for compiling, no changes on the usage.

### eggs-9.1.22-1
* XDG: lightdm configuration
* exclusion: added /etc/initramfs-tools/conf.d/resume to exclude.list

### eggs-9.1.21-1
* wardrobe: introduced try_accessories. If an accessory is not compatible with your system wardrobe will emit a warning and continue but for try_accessory the process will continue without any warning. This let to build universal accessories like liquorix, valid for all the varius distros. Consult accessories/liquorix in [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe).

### eggs-9.1.20-1
* wardrobe: if a costume is not compatible with the system, wardrobe will end immidiatly, but if an accesory is not compatible with the system wardrobe will emit a warning and skip it going to the next, the same if an accessory will be not found.

### eggs-9.1.19-1
* wardrobe: all the packages are now filtered if they are availables on the repository. If a package is in sections: dependencies, packages or packages_not_install_recommend wardrobe will emit a warning, if the package is listed in sections: try_packages or try_packages_not_install_recommend wardrobe will skip it and just continue.

### eggs-9.1.18-1
* wardrobe: instroduced new sections: try_packages and try_packages_no_install_recommends on costumes;
* calamares: align calamares configurations files to [calamares_settings_debian](https://salsa.debian.org/live-team/calamares-settings-debian).

### eggs-9.1.17-1
calamares: align calamares configurations files to Ubuntu 22.04 jammy [calamares_settings_lubuntu](https://github.com/lubuntu-team/calamares-settings-ubuntu), this solve the network issue [122](https://github.com/pieroproietti/penguins-eggs/issues/122)

### eggs-9.1.16-1
* wardrobe: changed the way to get SUDO_USER this fix a bug finding ~/.wardrobe in Ubuntu
* wardrobe: wardrobe now install debs depending on the distro, this made possible to have an unique costume/accessory for more distros. Example: we have now just an accessory for waydroid not three differents versions (bullseye, bookworm, jammy). 

### eggs-9.1.15-1
* wardrobe: the configuration scripts of the various: gdm3, lightdm, sddm are now common to all costumes.

### eggs-9.1.14-1
I made some modifications in the way to build eggs, trying to reduce the times of compiling it:
* using [verdaccio](https://verdaccio.org/) private proxy registry;
* replacing npm with [pnpm](https://pnpm.io/) as package manager.

### eggs-9.1.13-1
* gdm3 autologin in live for Debian/Devuan fix

### eggs-9.1.12-1
* wardrobe: removing sources.list control on Ubuntu (use different schema) and testing a lot with Ubuntu 22.04. I did'nt find clean way to get a clean Ubuntu 22.04 CLI only installation as I do with Debian/Devuan,  tryed with Ubuntu server edition minumun and stardard installation, but always there are delay on start of the iso due a wait for networking.

### eggs-9.1.11-1
* wardrobe: added servers section to wardrobe and a samba sample
* commands: removed command bro, removed all command aliases to reduce confusion, re-estabilish warming if a command need to be called with sudo

### eggs-9.1.9-1
* wardrobe: add prefix costumes/ to COSTUME if not specified costumes/ or accessories/ in ironing, show and wear;
* bugfix: wardrobe verions 9.1.8 due a bug don't find accessories.

### eggs-9.1.8-1
wardrobe: the syntax of the wardrobe commands has been modified: in particular the costume flag has been removed and the COSTUME is passed as argument of the command. The default wardrobe is now saved in ~/.wardrobe. Costumes are now included in the wardrobe costumes directory, this creates a better organization of the wardrobe. We are near to be stable.

### eggs-9.1.7-1
* installers: A new idea it's taking form, using wardrobe I added the nice Linuxmint LMDE installer to same custom version - mostly bullseye and chimaera and the result was positive. So now we have 3 different installation possibilities for our iso: krill for CLI systems, live-installer and calamares for GUI systems.

### eggs-9.1.6-1
* bugfix and a new idea

### eggs-9.1.5-1
* wardrobe: try 5 times if apt-get install fail before to exit. Tested against colibri, owl and eagle, the remain problem it's just desktop background.

### eggs-9.1.4-1
* wardrobe: a bit restructured in costumes definitions, look costume colibri for more details and reference

### eggs-9.1.3-1
* changed eggs info, tested wardrobe with owl and 5.17.0-1.2-liquorix-amd64 kernel, plus the usual bunch of fixes and enhancements

### eggs-9.1.2-1
* changed definition of sourcesList in costumes, now a simple string []
* added command eggs wardrobe get to get the wardobe. --repo https://github.com/pieroproietti/penguins-wardrobe
* update command mom adding wardrobe commands
* added default to wardrobe commands: ironing, list, show, wear. Default --wardrobe ./penguins-wardrobe --costume colibri 
* removed npm package pjson and class basket not more necessaries
* update autocomplete scripts and man page

### eggs-9.1.1-1
* wardrobe: added distributions, as an array of [bullseye, bookworn, chimaera, etc] to limit usage of costumes ans accessories just on the appropriate distros.

### eggs-9.1.0-1

A breacking news!

* wardrobe: after a bit of consolidation, I moved the suddivision of firmwares from the code to the wardrobe organization. ```firmwares``` now is a accessory with same own internal accessories. 
* accessories: now accessories can be external and internal. Internal accessories live inside the costume, for example  inside firmwares live codecs, network-cable and so on. Internal accessories have suffix: ```./```: ```./codecs```, ```./network-cable```, etc.
* If you open ```wardrobe.d/accessories/firmwares```, you can find inside: codecs, network-cable, printers, video-nvidia, network-wifi, video-amd and ou are free to add others. 

This result in a great semplification of code and a improved organization. Just adding others firmware categories inside firmwares - such graphics-tables - add an index.yml with the packages you needs; note: if your packages need a specific repo, you can add it too. Add your new accessory on index.yml of firmares and eggs will load it, add the request repos then install yours packages.

### eggs-8.17-17
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
