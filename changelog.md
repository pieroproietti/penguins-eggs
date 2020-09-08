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

### eggs-7.0.27_1.deb
* created /etc/xdg/autostart/penguins-links.desktop to build links on the desktop on live and new users, due the localization;
* create a module in calamares to remove installation link;
* on lxde, now we create links in different schema to be compatible with it, except for installer;
* tested on cinnamon, lxde.


### eggs-7.0.22_1.deb
Introduced command locales, install and clean all the locale not necessary, leaving only the defined ones.
### eggs-7.0.20_1.deb
Finally localisation start to work, your system can boot live in different languages [issue #34](https://github.com/pieroproietti/penguins-eggs/issues/34)

### eggs-7.0.18_1.deb
Cleanig configuration, writings [issues](https://github.com/pieroproietti/penguins-eggs/issues) and trying to solve. 

### eggs-7.6.14_1.deb
Fixed bug that prevented grub from loading the kernel and initrd.img from the iso image. The error was only detectable on UEFI machines.

### eggs-7.6.13_1.deb
Revisited the creation of the liveCD boot for standard and UEFI machines. Fixed the safe option in the isolinux menu and in the grub menu.

### eggs-7.6.12_1.deb
This is a version mosty rethink and bug fixes. eggs calamares now work as prerequisites, alone install and configure calamares, calamares -c only configuration.
I changed also few flags in produce, with the idea to not have _ in them. So proxmox_ve became ve, remote_assistance becamo rassistance, etc. I changed something
in calamares modules too, to get the flag theme. The next versione will be a bugfixes too, I need to check why disappered in the boot from iso the option safe.

### eggs-7.6.11_1.deb
Bux fix for Devuan beowolf support, minor errors remain to fix wicd, but I'm sure some users will segnale it. Currently eggs supports and has been tested on Debian, Ubuntu and Devuan

### eggs-7.6.0-10
Bug fix for Devuan, now in beowulf We can build iso and start it. To login go to console and sudo startx.

### eggs-7.6.0-9
Bug fix for produce flag --installer_choice and --dwagent now working. First implementaion addon for proxmox_ve.

### eggs-7.6.0-7
I write here changement in the last few and short time versions, after the last cleaning and reorder. Now You can customize eggs with your theme, or add some particular aspect. Look in /addons or ask to the author for more informations.

* eggs adjust became eggs adapt (to adapt video resolution in VM);
* check for /etc/skel/Desktop, if exist eggs don't translate Desktop folder;
* removed, at moment, flag for addons but not it's implementation. (probably we will back again, but at the moment the flag is unusefull);
* removed flag assistant and rewrote it as install-choice to let to chosen beetwen cli or calamares installation;
* created flag --theme for theming eggs installtion with calamares;
* created addons to let vendors to build specific addon to customize eggs.

### eggs-7.6.0-1
Continuing the collaboration with ufficiozero.org, we closed an important bug in Ubuntu and derived: after installation, the resolution of dns addresses was missing. Currently the network works correctly with Debian Buster, Ubuntu focal, Ubuntu cosmic and Ubuntu bionic, Linux mint 20.20, Linux mint 19.3

### eggs-7.5.139-1
During some attempts to collaborate in order to get a remastering of Linux Mint, we discovered and fixed the following bugs:
* Bug fix for custom live user configuration. Now you can actually use any live CD user name and password by configuring it in /etc/penguins-eggs.conf
* bug fix for ubuntu focal and ubuntu bionic, calamares was not configured to delete the live CD user.
Thanx to Adriano Morselli developer at ufficiozero.org for the segnalation.


### eggs-7.5.132-1
This morning I noticed with surprise that all the versions made with eggs-7.5.130-1 loaded on sourceforge, were affected by a serious problem: the user created was not part of the sudo group. After some investigation I discovered that it was due to a typing error in the focal.ts, bionic.ts and buster.ts modules that create the configuration for calamari. Instead of writing defaultGroups I had written defaultGroups and of course it is not the same! This version fixes the problem, I am reloading the images and packages.

### eggs-7.5.130-1
eggs now completely support - remaster the system and use GUI installer calamares - for:
* Debian 10 Buster (i386/amd64)
* Ubuntu 20.04 Focal (amd64)
* Linuxmint 20 ulyana (amd64)
* Linuxmint 19.3 tria (i386/amd64)
* Lubuntu 18.04 (i386/amd64)
* Ubuntu 18.04 bionic (i386/amd64)

You will find new examples of the ISOs on [Penguin's eggs sourceforge](https://sourceforge.net/projects/penguins-eggs/files/iso/)


### eggs-7.5.129-1
Well, the big moment has arrived: 

eggs now allows you to remaster the system and use calamares for installation on:
* Linuxmint 20 ulyana
* Ubuntu 20.04 Focal
* Debian 10 Buster and derivatives.
Other versions can of course be remastered, but without the possibility of using calamares with installer.
I would like to push compatibility up to Linuixmint 19.3 tricia for the possibility of a robust i386 distro included.
Unfortunately, neither Ubuntu nor Linuxmint are releasing the new versions on i386 architecture.


### eggs-7.5.126-1
work in progress to adapt our script to work with calamares installer in Ubuntu focal and Linux mint.
Calamares again don't work in ubuntu and Mint, but thanx to big refactoring is more simple to adapt it:
* abbreviated writing of calamares-modules in buster
* created focal from buster, added instances, shellprocess, contextualprocess and scripts from lubuntu
* rewritten most of the buster modules, only packages and displaymanager remain
* created buster from previuos script

### eggs-7.5.124-1
eggs compatible again with node14 and node8.

* eggs compatible again with node14 and node8;
* the versions for i386 and for amd64 start from the same code, but are spelled with node8 or node14 respectively;
* it is therefore possible. use the version of node present on the system;
* the structure of calamares has been modified to adapt it to the need to insert different setting versions, one for each distribution.

### eggs-7.5.122-1
Sometimes, to move forward, you need to step back first.

Well, in order not to miss the opportunity to have debian packages for both the i386 and amd64 architecture, I chose to go back to the old Node8, the latest version released by nodesource for both architectures.

The main change in this version is, of course, the presence of the i386 version, which can be a good opportunity for all people with old hardware combined with young will to experiment with them.

But not only!

Now the various READMEs, links, etc point to the new site https://penguins-eggs.net. 

Come in here for more informations.


### eggs-7.5.110-1
Here we are, I was looking for a solution to facilitate myself in the work of adapting Ubuntu and Deepin to calamares and, trafficking with this, as often happens a new idea came up:

- flag --dry (shord "d")

Eggs, from this version, in addition to being able to directly generate the ISO, can be used with the --dry option which instead generates the structure and scripts necessary to complete the work. And, neither creating the filesystem.squasfs nor the iso image is obviously instantaneous. However, scripts are generated, which therefore allow the user to bind and ubind the live filesystem, its compression and the generation of the ISO.
- introduct in ```eggs produce``` the flag --dry. Eggs run without produce not squashfs, nor iso image, but creating same scripts: bind, ubind, mksquashfs and  mkiso to let you to change your live filesystem and your iso filesystem before to package it.

Of course, besides being able to work in the live filesystem and in the iso folder, you can also change all the compression, generation, etc. parameters.

- introduced the --dry operation without the production of the iso but only the scripts necessary for it;
- included in the ovary, in addition to the necessary scripts, a short explanatory README.md.


### eggs-7.5.100-1
One hundred is a round figure, plus something has been done.

I worked a lot on the cli installer built into eggs, the work started with the idea of adding formatting LVM2 for Proxmox VE, but also continued with the intention - I hope successful - to make it more easily usable.

At the moment Ubuntu focal and the various derivatives (Linux Mint included) they can be installed ONLY with the cli-installer, while for Debian buster and LMDE4 are recommended to use the installer Calamares.

ATTENTION: the use of the eggs cli installer is still from ONLY for experts if you erase the disc.

- link on the desktop for cli-installer or calamares depending on the presence of the latter;

- desktop link for eggs adjust only for Desktop managers that do not resize the monitor if it is enlarged on the virtual machines (LXDE, LXQT, XFCE and Mate). Obviously the effect is visible only when using virtual machines with the integration tools installed, for example: spice-vdagent for KVM.

- removed the enabling of the desktop links on gnome (some problems related to the use of the gio command that requires the mounting of / dev also in the construction phase of the iso remain to be solved. but it remains busy. (If anyone has same suggestions ...)

- Bem-vindo aos novos amigos brasileiros, teremos que pensar em uma internacionalização do pacote.

- Welcome to the new Brazilian friends, sooner or later we will have to think about an internationalization of the package.

- Benvenuto ai nuovi amici brasiliani, bisognerà prima o poi pensare ad una internazionalizzazione del pacchetto.



### eggs  7.5.86

- modified the call to xorriso, trying to make it analogous to systemback (according to the suggestions of Franco Conidi);

- reimported - and corrected - the utils from tools;

- cleaning of makeIsoImage () in ovary;

- copy of the utils in penguins-tools, to standardize the tools;

- various cleaning of the code.


### 7.5.81
- work continues for compatibility with Ubuntu, currently it is possible to remaster it and install with eggs cli install;

- more than a few freaks to make the gnome links work by marking them trusted with the gio command which, however, as the user is not logged in, must be launched with sudo -u user dbus-launch gio set ...;

Of course eggs remains compatible with Debian Buster.



### eggs-7.5.76
Eggs is becoming adept at remastering Ubuntu 20.04 focal, it manages to remaster Ubuntu without any problem. For the installation, at the moment, it is not possible to do it with the graphic installer but only with the built-in one.

- restructuring of the code to allow selection among the various distros;

- fixing hotspots for focal Ubuntu remastering (both ubuntu-server and Ubuntu-desktop);

- xbuntu, kubuntu, UbuntuMate and UbuntuBudgie versions boot properly.

It remains to fix the configuration of the graphical installer for Ubuntu.


### eggs-7.5.72
- skel command for copying the user configuration in /etc/skel. It works very well on cinnamon. Need to test it on other desktop Managar, maybe tell me which ones you are interested in.


### eggs 7.5.64
- possibility to configure the live user name and passwords directly in the / etc / penguins-eggs file (there are those who prefer live / evolution, those who demo / demo, etc;

- creation of the live user ALWAYS and only as the only user of the liveCD part of the sudo group.

I chose to make this change for better cleaning and user control. At the moment I only uploaded the npm version

### eggs-7.5.60-1
- cleaning of git repository: remuved old documentts,  in documents


### eggs-7.5.51-1
- info: nuovo look;
- produce: if the prerequisites are not installed, it correctly proposes their installation;
- installer cli: introduced a new display to confirm the entered values.

I have problems with the cli installer, it is quite good and has also become humanly usable, but for some reason that I don't know, after the installation, during the boot phase, a boot delay is generated which, by performing the installation with calamares


In particular, it reports:

```mdadm: no array found in config file or automatically```

(I use only virtual machines on proxmox-ve, so I don't need and have disk arrays)

and, once past the rock, it still waits 1:30 for:

```A start job is running for /sys/subsystem/net/devices/multi/user```

If someone can help me, don't esitate, thanx.

### eggs-7-5-57-1
- add warning for look new versions;
- the presentation of calamares translated into English;
- added verbose option also in ```adjust``` command;
- changed name and position of the exclude.list;
- restructured and simplified exclude list, insert options for apache2 and pveproxy.

### eggs-7.5.54-1
- tested with LMDE4, both standard amd EFI machines.

### eggs-7.5.44-1
- installer cli: fstab will use UUID no more /dev/sda1, etc
- installer cli: removal of the user and group of the liveCD during installation

### eggs-7.5.40-1
* fixed failure to remove CD user group pending, edit the fstab file in the cli installer by adding the blkids.


### eggs-7.5.39-1
* added skel command: copy of the Desktop configuration in / etc / sket;
* correct and tested functioning of the installer cli.

### eggs-7.5.36-1
* added flag -a for the installation assistant which allows the choice between graphical installation and cli installation;
* corrected problem of deleting apt lists on the version installed with graphic installer.

Happy 1st of May to all


### eggs-7-5-34-1
- Eliminated the ISO construction error on a non-UEFI machine. Previously, since the grub-efi-amd64 package and its dependencies were not installed, eggs failed even if the make_efi = no value had been set correctly in the configuration file;

* Introduced a further flag in eggs produce, for the addition on the desktop of the installation assistant that allows you to choose between calamares or installer cli.

### eggs_7.5.18-1_amd.deb
In these versions from 7.5.0-1 to 7.5.18-1 I have completely revised the commands trying - as much as possible - to simplify the use. This version, in case of prerequisites not installed, asks the user to install them on the fly and so does for calamares (if in / etc / penguins-eggs force-installer = yes) and for the configuration file itself which, if absent, is automatically generated. Furthermore, for non-graphical workstations, calamares are no longer configured, obviously not necessary and the installation takes place directly with eggs.

If you have problems, try using the -v flag to view the video output of the various calls.

### eggs_7.5.0-1_amd,deb
* Finally we have the working UEFI version.

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
