### eggs-7.8.50
* more steps to krill, eggs now produce configuration for krill or calamares in all the distro/version

### eggs-7.8.49
* a step more to krill: configuration for jessie and stretch. More modern versions use same configuration of calamares.

### eggs-7.8.48
* remove unused dependencies, announcing krill installer for CLI version

### eggs-7.8.47
* added Ubuntu hirsute (Ubuntu 20.04) to compatibily list

### eggs-7.8.46
* checking and rewriting eggs tools:skel.

### eggs-7.8.45
* think a plan to rewrite eggs CLI installer

### eggs-7.8.44
* added theme neon, revisited theme eggs

### eggs-7.8.43
* select between zstd/lz4/gzip for fast compression. In produce we have --release in place of --final (add max compression and sterilize)

### eggs-7.8.42
* eggs clean diversion in calamares before remove, bugfix in eggs calamares --remove and --install. Added --addons in produce, take place of --adapt, --pve

### eggs-7.8.41
* removed drivelist package from eggs, jessie now work with the mainstrem eggs, removed xterm from dependencies

### eggs-7.8.40
* zstd -Xcompression-level 1 take place of lz4 in fast compression, others adpment for jessie.

### eggs-7.8.39
* added possibility to customize default partition in theme: openos will have btrfs as default

### eggs-7.8.38
* working in cli installer

### eggs-7.8.37
* added livecd theme for ufficiozero, check option --final in produce and calamares

### eggs-7.8.36
* added livecd theme for openos, added full name on the livecd boot and in installed system boot

### eggs-7.8.35
* adaptment to mx linux, machine-id, grub-efi-amd64-bin in place of grub-efi-amd64 in Utils.isUEFI(). Perhaps we must test also grub-efi-i386-bin for i386?

### eggs-7.8.34
* added .disk folder in iso with info, mkiso, etc. added version in calamares, isGui, and others

### eggs-7.8.31
* bugfixes: check the presence of vmlinuz and initrd_img else stop, distroUniqueId in rootTemplate of calamares (deprecated)

### eggs-7.8.30
* rewrite of distros.ts class: cleanup and reorganization

### eggs-7.8.29
* eggs mom change in accord with new commands and flags

### eggs-7.8.28
* postinst just alert for the absense of calamares in GUI systems during eggs installation. show.qml fix presentation

### eggs-7.8.27
* removed the compression filter by processor for ia64, added for ARM

### eggs-7.8.26
* bufixes and compression filter by processor

### eggs-7.8.25
* eggs ask for calamares if it is not installed, fixes in themes eggs and openos

### eggs-7.8.24
* added theme openos from Sebastien <admi.openos.neon@gmail.com>

### eggs-7.8.23
* patch for remove //@ in path btrfs, moved vmlinuz and initrd_img configurations in eggs.yml

### eggs-7.8.22
* apt remove and apt purge working, sddb bugfix, calamares show revisited

### eggs-7.8.20
* all bugfix sddm desktop manages, npm package bugfixes

### eggs-7.8.18
* cleaning and extending pre e post installations, man, npm package, etc

### eggs-7.8.15
* add filter for arch in export:iso

### eggs-7.8.14
* added siduction to supported distros, aka: seduct from siduction!

### eggs-7.8.13
* modified pre e post install scripts and added check presence directory man1   and bash_completion.d. 

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

### eggs-7.7.5.1_deb deprecated
* bugfix in bullseye and deepin to not confuse versions

### eggs-7.7.4.1_deb deprecated
* added guadalinex theme

### eggs-7.7.3.1_deb deprecated
* fixed annoying bug in option safe booting from livecd

### eggs-7.7.0.1_deb deprecated
* added autocomplete bash

### eggs-7.6.88.1_deb deprecated
* changing and fixes in devuan beowulf, ubuntu focal, Ubuntu groovy

### eggs-7.6.86.1_deb deprecated
* changed commands prerequisites and renamed sterilize as remove, added different flags.

### eggs-7.6.85.1_deb deprecated
* changing the configuration. I suggest to remove the old configuration dir before to use: 
  * sudo rm /etc/penguins-eggs.d -rf
  * sudo eggs prerequisites
* updated cli installer, new defailt address, gateway, dns, etc. 
* introduced experimental pve-live.service.

### eggs-7.6.83.1_deb deprecated
* reintroduced armel arch; info now show running mode

### eggs-7.6.82.1_deb deprecated
* fix gdm3 displaymanager in calamares configuration, export deb armel

### eggs-7.6.81.1_deb deprecated
* restored debian theme for calamares, check install-system.sh, clean flags usage in export

### eggs-7.6.80.1_deb deprecated
* displays the command flags

### eggs-7.6.79.1_deb deprecated
* mx-installer starting to work (experimental)

### eggs-7.6.78.1_deb deprecated
* solved permissions problems in /tmp, mxlinux now install with calamares, trying to become mx-installer compatible.

### eggs-7.6.77.1_deb deprecated
* select vmlinuz and initrd.img version from cmdline del kernel

### eggs-7.6.76.1_deb deprecated
* introducing basket update, removed documents from packages.

### eggs-7.6.73.1_deb deprecated
* finishing touches in update: show sources and versions.

### eggs-7.6.72.1_deb deprecated
* changes for site, readme, terminal session and so on.

### eggs-7.6.71.1_deb deprecated
* just a little hack for the vmlinuz link in proxmox-ve.

### eggs-7.6.70.1_deb deprecated
* finally eggs is again able to remaster and install the naked version (without graphical interface) of your system.

### eggs-7.6.65.1_deb deprecated
* update -i show the last 4 versions ordered and select the correct architecture; check presence of dpkg-packages before to run yolk

### eggs-7.6.63.1_deb deprecated
* remake configuration of calamares for bullseye, be careful with lsb_release in bullseye otherwise UEFI boot will not work

### eggs-7.6.62.1_deb deprecated
* changed the way to work of ovary, put /boot, /etc, /usr, /var in overlayfs, create /home just like a normal directory who is not deleted, until kill

### eggs-7.6.61.1_deb deprecated
* exclude yolk from copy, cleaning tools.yaml using settings from eggs.

### eggs-7.6.60.1_deb deprecated
* improvement:  if you installed eggs as debian package, you can now update it with sudo eggs update -i.

### eggs-7.6.57.1_deb deprecated
* improvment: added Ubuntu groovy to the supported versions. Remain same trouble with displaymanager - actually disabled - and the link in the desktop are non able to be executed before to click right key on the mouse and click on let to execute.

### eggs-7.6.56.1_deb deprecated
* bugfix: added apt install -y --allow-unauthenticated shim-signed in focal and reintroduced download shim-signed e dependecies in yolk;

### eggs-7.6.55.1_deb deprecated
* bugfix: from test I saw who it is not possible to install shim-signed from yolk, perhaps becouse yolk is not signed? I  removed it to not impact with others distros;

* focal will not install without internet connection on UEFI.

I removed 

### eggs-7.6.54.1_deb deprecated
* bugfix: LMDE debbie don't start using it's name in EFI, so eggs change bootloaderEntryName=Debian for
this distro;

* bugfix: added shim-signed to the packages of local repository yolk. 


### eggs-7.6.53.1_deb deprecated
* tested on: buster/beowulf/bionic/focal
* distro tested: Debian buster amd64, Devuan beowulf i386/amd64, Linux Mint 19.3 amd64, Linux Mint ulyana amd64, LMDE debbie amd64.

### eggs-7.6.52.1_deb deprecated
improvment: added in eggs fuctions who was before in penguins-tools. Don't get worried, are mostly for developers!
Here we are:
* export:deb export debian packages (only for developers)
* export:docs export documentation (only developers)
* export:iso exporting iso image created via scp in accord with configuration in /etc/penguins-eggs.d/tools.yaml

improvment. Introducing a tools command to reach the following commands, part of them was present before, other addedd:
* tools:clean like previous eggs clean

* tools:initrd sperimental. Edit initrd to remove resume and crypto from inird on the ISO

* tools:locales like previous eggs clean

* tools:sanitize clear all the stuffs created from eggs (calamares configurations. script, etc)

* tools:skel like previous eggs skel

* tools:yolk like previous eggs

improvment. Now yolk check better the dependences for the local repository and is possible, for example
to create an ISO form a Bios installation and install it on a UEFI machine, without need to be on line
during the installation.

Yolk is created automatically during the produce, but if the repository exists then produce will
use the previous version. 

You can, of course, recreate yolk repository in /var/local/yolk giving command: sudo eggs tools:yolk, or - short way - add flag -y in produce.

bugfix: Devuan don't start using it's name in EFI, so eggs change bootloaderEntryName=Debian for
this distro.

book: soon we will align the italian book with this new edition.

### eggs-7.6.50.1_.deb deprecated
bugfix: just an await before the call yolk.create()... It worked the same, but with a better output.

### eggs-7.6.49.1_.deb
One user pointed out to me an annoying problem with eggs, the impossibility of installation in the absence of internet.

After studying it, I am proud to present yolk, a very small local repository, responsible for making it possible to install the system in the absence of internet. 

There are no changes in the way to use the eggs but, during the production process, a small repo is created in /var/local/yolk, and the related calamares modules are built to add this local repo to the apt sources. 

Yolk is very little, about 2.1 MB and contains only the following packages: grub-pc, grub-pc-bin, cryptsetup, keyutils, grub-efi-amd64 and rub-efi-amd64-bin. 

After installation yolk is removed from apt sources.

### eggs-7.6.48.1_.deb deprecated
* rewrote of the commands prerequisites and sterilize, they now try to explain better that  will happen behind the scenes, during their use. It remain the possibility to see all via --verbose flag.

### eggs-7.6.47.1_.deb deprecated
* added a beutifull new theme for ufficiozero thanx to Julian Del Vecchio.

### eggs-7.6.46.1_.deb deprecated
* changed flags in produce and calamares. just added flag --final to make the final version of your project: all the packages relative to the "reproduction"  will be removed during the installation with the gui installer;
* module packages in calamares now work in accord with the flag --final, if present will build the remove section in packages.conf (you can check this file in /etc/calamares/modules) if not, only section try-install will be build. This section is ideal for international packages, languages, etc.

### eggs-7.44.1_.deb deprecated
* buxfix: there was a little problem with links in the previus version.

### eggs-7.6.43.1_.deb deprecated
* improvement: patch per bionic in calamares module grubcf, added check plymouth from successive version of calamares (in bionic calamares is quite old and not mantained);
* improvment: actually is possible to use directly produce after the installation, eggs will propose the necessary operations to install prerequisites, calamares and so on;
* bugfix: the previous version I put distro.codenameId as productName in calamares, but due the fact who was used ad EFI name too, Debian refuse to boot. So I changed in branding.ts the line bootloaderEntryName=productName to bootloaderEntryName = distro.distroId.

### eggs-7.6.42.1_.deb deprecated
* removed open-infrastructure-system-config dependencies from ubuntu bionic. 

### eggs-7.6.41._1.deb
* using mustache for templates (grub, isolinux, locale.gen, locale);
* check exist links to distros in new installation or update;
* removed clean from packman and using clean from bleach, removing all apt space used;
* made new isolinux and grub.cfg for bionic and focal, with languages
* actualy eggs produce a boot menu, with the first item language host, submenu languages and menu safe.

### eggs-7.6.40._1.deb deprecated
* beowulf, bionic, buster, focal buxfixes in yml configurazion of calamares:
* added bullseye as supported distros;
* rewrite command kill with new class settings, and removed flag --umount;
* added - but not yet activated - new class initrd to configurare resume and crypto in the live initrd.img
* changed the way eggs work, not remove prerequisites. Added --sterilize flag in produce and calamares, if yuo want to remove them.
* hard tested on beowulf, bionic, buster, focal the reproductive system: produce, install, modify, produce, and so on.

### eggs-7.6.39_1.deb deprecated
* bugfix su bionic - thanx to Adriano Morselli

### eggs-7.6.38_1.deb deprecated
* focal bugfix in packages.conf, don't let to remove packages;
* all calamares packages.conf, try_install libreoffice-help-l10n-$LOCALE, firefox-esr-$LOCALE, thunderbird-locale-$LOCALE etc (give feedback for addictions);

### eggs-7.6.37_1.deb deprecated
* simplified calamares configuration, all the work now is on fisherman class;
* revisited completely the way to build links for the various user case (sources, npm or package deb);
* added slim to desktop managers for autologin in live;
* tested on UfficioZero Linux Roma (beowulf i386), Linux Mint tricia 19.3 i386, UfficioZero Tropea (focal x86_64), Debian buster x86_64.

### eggs-7.6.36_1.deb deprecated
During the creation tests made by UfficioZero, a serious error was found in the generated debian packages: eggs-7.6.35-amd64 and eggs-7.6.35-i386.deb.

This error is due to the fact that debian packaging made with oclif-dev does not keep the symbolic links, so a later version was made, in which these links are created when installing the prerequisites.

The current deb version, was tested on UfficioZero Roma (Devuan beowulf() i386 and UfficioZero Tropea (Linux Mint ulyana/Ubuntu focal).

### eggs-7.6.35_1.deb deprecated
OK, now we are pointing to internationalization and customization. 

Is changed the configuration file and its position

/etc/penguins-eggs.yaml  -> /etc/penguins-eggs.d/eggs.yaml

In /etc/penguins-eggs.d you will find a README.md, a tools.yaml, and two links:

/etc/penguins-eggs.d/addons
/etc/penguins-eggs.d/distros

Read /etc/penguins-eggs.d/README.md for more specific usage and mean.


### eggs-7.6.34_1.deb deprecated
This is an important version, in which a lot of work is completed, the reasons are the following:

* Just finished the rewriting work. Well now we have officially Debian buster, Devual beowulf, Ubuntu focal and 
Ubuntu bionic fully supported, both for standard BIOS installation and UEFI installation, both on i386 and 
amd64 architecture.

* Of course it follows that other derived distros can also be easily remastered: Linux Mint 20.20, Linux Mint 19.3, etc. 

* I also tried Deepin 20, which works perfectly, but only on standard BIOS machines.

### eggs-7.6.33_1.deb deprecated
I made a rethinking and rewriting of the part of eggs who work with calamares. Before I build the configuration completely with code
now I choose to use directly yaml files ed use them as template. Well, was hard - test alla on buster, focal, devuan and bionic 
it's a big question but, finally we have a a great result:
* eggs now work in UEFI with ubuntu focal

### eggs-7.6.28_1.deb
* created /etc/xdg/autostart/penguins-links.desktop to build links on the desktop on live and new users, due the localization;
* create a module in calamares to remove installation link;
* on lxde, now we create links in different schema to be compatible with it, except for installer;
* tested on cinnamon, lxde in Debian, Devuan

### eggs-7.6.22_1.deb deprecated
Introduced command locales, install and clean all the locale not necessary, leaving only the defined ones.

### eggs-7.6.20_1.deb deprecated
Finally localisation start to work, your system can boot live in different languages [issue #34](https://github.com/pieroproietti/penguins-eggs/issues/34)

### eggs-7.6.18_1.deb deprecated
Cleanig configuration, writings [issues](https://github.com/pieroproietti/penguins-eggs/issues) and trying to solve. 

### eggs-7.6.14_1.deb deprecated
Fixed bug that prevented grub from loading the kernel and initrd.img from the iso image. The error was only detectable on UEFI machines.

### eggs-7.6.13_1.deb deprecated
Revisited the creation of the liveCD boot for standard and UEFI machines. Fixed the safe option in the isolinux menu and in the grub menu.

### eggs-7.6.12_1.deb deprecated
This is a version mosty rethink and bug fixes. eggs calamares now work as prerequisites, alone install and configure calamares, calamares -c only configuration.
I changed also few flags in produce, with the idea to not have _ in them. So proxmox_ve became ve, remote_assistance becamo rassistance, etc. I changed something
in calamares modules too, to get the flag theme. The next versione will be a bugfixes too, I need to check why disappered in the boot from iso the option safe.

### eggs-7.6.11_1.deb deprecated
Bux fix for Devuan beowolf support, minor errors remain to fix wicd, but I'm sure some users will segnale it. Currently eggs supports and has been tested on Debian, Ubuntu and Devuan

### eggs-7.6.0-10 deprecated
Bug fix for Devuan, now in beowulf We can build iso and start it. To login go to console and sudo startx.

### eggs-7.6.0-9 deprecated
Bug fix for produce flag --installer_choice and --dwagent now working. First implementaion addon for proxmox_ve.

### eggs-7.6.0-7 deprecated
I write here changement in the last few and short time versions, after the last cleaning and reorder. Now You can customize eggs with your theme, or add some particular aspect. Look in /addons or ask to the author for more informations.

* eggs adjust became eggs adapt (to adapt video resolution in VM);
* check for /etc/skel/Desktop, if exist eggs don't translate Desktop folder;
* removed, at moment, flag for addons but not it's implementation. (probably we will back again, but at the moment the flag is unusefull);
* removed flag assistant and rewrote it as install-choice to let to chosen beetwen cli or calamares installation;
* created flag --theme for theming eggs installtion with calamares;
* created addons to let vendors to build specific addon to customize eggs.

### eggs-7.6.0-1 deprecated
Continuing the collaboration with ufficiozero.org, we closed an important bug in Ubuntu and derived: after installation, the resolution of dns addresses was missing. Currently the network works correctly with Debian Buster, Ubuntu focal, Ubuntu cosmic and Ubuntu bionic, Linux mint 20.20, Linux mint 19.3

### eggs-7.5.139-1 deprecated
During some attempts to collaborate in order to get a remastering of Linux Mint, we discovered and fixed the following bugs:
* Bug fix for custom live user configuration. Now you can actually use any live CD user name and password by configuring it in /etc/penguins-eggs.yaml
* bug fix for ubuntu focal and ubuntu bionic, calamares was not configured to delete the live CD user.
Thanx to Adriano Morselli developer at ufficiozero.org for the segnalation.


### eggs-7.5.132-1 deprecated
This morning I noticed with surprise that all the versions made with eggs-7.5.130-1 loaded on sourceforge, were affected by a serious problem: the user created was not part of the sudo group. After some investigation I discovered that it was due to a typing error in the focal.ts, bionic.ts and buster.ts modules that create the configuration for calamari. Instead of writing defaultGroups I had written defaultGroups and of course it is not the same! This version fixes the problem, I am reloading the images and packages.

### eggs-7.5.130-1 deprecated
eggs now completely support - remaster the system and use GUI installer calamares - for:
* Debian 10 Buster (i386/amd64)
* Ubuntu 20.04 Focal (amd64)
* Linuxmint 20 ulyana (amd64)
* Linuxmint 19.3 tria (i386/amd64)
* Lubuntu 18.04 (i386/amd64)
* Ubuntu 18.04 bionic (i386/amd64)

You will find new examples of the ISOs on [Penguins' eggs sourceforge](https://sourceforge.net/projects/penguins-eggs/files/iso/)


### eggs-7.5.129-1 deprecated
Well, the big moment has arrived: 

eggs now allows you to remaster the system and use calamares for installation on:
* Linuxmint 20 ulyana
* Ubuntu 20.04 Focal
* Debian 10 Buster and derivatives.
Other versions can of course be remastered, but without the possibility of using calamares with installer.
I would like to push compatibility up to Linuixmint 19.3 tricia for the possibility of a robust i386 distro included.
Unfortunately, neither Ubuntu nor Linuxmint are releasing the new versions on i386 architecture.


### eggs-7.5.126-1 deprecated
work in progress to adapt our script to work with calamares installer in Ubuntu focal and Linux mint.
Calamares again don't work in ubuntu and Mint, but thanx to big refactoring is more simple to adapt it:
* abbreviated writing of calamares-modules in buster
* created focal from buster, added instances, shellprocess, contextualprocess and scripts from lubuntu
* rewritten most of the buster modules, only packages and displaymanager remain
* created buster from previuos script

### eggs-7.5.124-1 deprecated
eggs compatible again with node14 and node8.

* eggs compatible again with node14 and node8;
* the versions for i386 and for amd64 start from the same code, but are spelled with node8 or node14 respectively;
* it is therefore possible. use the version of node present on the system;
* the structure of calamares has been modified to adapt it to the need to insert different setting versions, one for each distribution.

### eggs-7.5.122-1 deprecated
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
