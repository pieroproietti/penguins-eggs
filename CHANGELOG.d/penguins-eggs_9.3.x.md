### eggs-9.3.30
* ```sudo produce --clone```: now calamares - when configured for clone - no longer asks for user configuration and previous users are used. You can also install with krill; the advantage is that it will be faster and will respect the autologin configuration, which is reset by calamares to the default.

### eggs-9.3.29
* fix: ```sudo produce --clone``` unmount all binded mounts;
* fix: in case of errors, now ```sudo eggs produce``` shows the error and pauses before to end.

### eggs-9.3.28
* fix: penguins-eggs.desktop will be removed on installed system if you use: ```sudo eggs produce --release```;

### eggs-9.3.27
This package does exactly the same as the previous one, but I changed the way I use dhcpd-proxy for cuckoo - this has no impact on the usage of eggs - is more a refactoring of eggs itself.

When I implemented cuckoo, the PXE service included in eggs, I used a small package from the FOGProject [node-dhcproxy](https://github.com/FOGProject/node-dhcproxy)  and simply adapted it to my usage. The problem is that the last commit of that package was on September 21, 2019, and since then many things have changed, and we need to have some control over it.

So I decided to rewrite it, convert it to typescript and create another package called [etrick](https://github.com/pieroproietti/etrick), without just having the code inside the eggs as it was before. In the future I will also move it to the code for tftp and https, to have all the PXE services together, for now it's okay, we are just starting.

I was undecided whether to publish this version or not - there are no interesting new features, no big changes for users, all the changes are just hidden - but in the end I thought I would publish it almost to stabilize it, have a working master branch - for those who want to collaborate - and create a new development branch.

### eggs-9.3.26
* kill: added --nointeractive flag;
* various commands: uniformed --nointeractive flag for all commands;
* mom: little adjustments;
* eggs unattended install: see [eui](/documents/eui.md) or [here](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/eui.md).

### eggs-9.3.25
* Just discovered a nice companion of eggs: [epoptes](https://epoptes.org/). If you need to build classrooms, just install epoptes, run ```sudo eggs produce --fast``` and in minutes you will have classroom ready;
* produce: changed flag --backup to --cryptoclone;
* produce: changed default compression to fast if not specified
* moved inside /etc/penguins-eggs.d files is_clone and is_crypted clone to solve the problem with PXE they was not visible during installation;
* ovary/krill: generally speacking producing a clone or installing a clone, we don't touch more: locale, keyboard, localecfg, delLiveUser, adduser and autologin. Remain to save and restore autologin for cryptedclone;
* iso denomination changed from ```egg-of-distro-codebase-host-arch``` to ```egg-of-distro-codebase-host-arch_type_arch``` where type can be: ``, `clone` or `crypted`;
* it seem working reinstalling from ISO, PXE, clone and cryptedclone.

### eggs-9.3.24
* krill: bugfix on locale and locales configuration;
* mom: expanded the menu to Documentation

### eggs-9.3.23
* mom: a revamped mom to be used interactively as a help viewer of eggs commands;
* usage, description and examples renewed or added for all eggs commands;
* please NOTE that the USAGE section found in the README, the command: ```man eggs``` and the command ```eggs mom``` share always the same UPDATED informations.

### eggs-9.3.22
* due a bug - I forgot to remove "," in the new derivatives.yaml - I release this new version with Linuxmind victoria added.

### eggs-9.3.21
* bugfix on ```/etc/penguins-eggs.d/derivaties.yaml```
* added elementary OS 7 Horus;

### eggs-9.3.20
* krill: added confirm button or abort before to erase disk for --unattended and new option --nointeractive for scripts;
* produce: if not present  and package sddm is installed eggs will create it in production for autologin with ```Session=plasma-wayland``` or ```Session=plasma``` and ```User=live```;
* tools skel: added copy waydroid-package-manager to skel if present.
* wardrobe: removed command ironing and tons of add/remove/fixes on penguins-wardrobe;
* wardrobe: we have now 3 new birds: wagtail, warbler and whispbird. You can build them from a naked iso installing and running: ```eggs wardrobe get```, ```sudo eggs wardrove wear wagtail```, etc,

### eggs-9.3.19
* grub:  now we have a new default resolution ```set gfxmode=1024x768```, and bugfix for Ubuntu on the option CLI boot;
* added new distros: SysLinuxOS filadelfia, Netrunner Desktop 23;
* same changes on krill ```eggs install --unattended``` and ```eggs install config [your-unattended-configuration]``` in prevision to [sepia](https://github.com/pieroproietti/sepia) to get an OEM installation.

### eggs-9.3.18
* iso: boot in GUI or CLI
* krill: added new motd with explanations
* krill: bugfix keyboard, bugfix add/remove packages.
* doas: accepted bugfix from [rreyn331](https://github.com/rreyn331/penguins-eggs),


### eggs-9.3.16
* I added a new configuration file /etc/penguins-eggs.d/derivaties.yaml to allow easier addition of new compatible distributions . The Ubuntu makululu linux distribution was added on this occasion.

### eggs-9.3.15
* LinuxFX: adapt ```eggs tools skel``` to the particularity of LinuxFX plasma;
* LinuxFX: created a new linuxfx theme in penguins-addons.

### eggs-9.3.14
* calamares: bugfix in desktop icon;
* oclif: updated to [oclif-pnpm@3.4.3-1](https://www.npmjs.com/package/oclif-pnpm)


### eggs-9.3.13
* logname: workaround for limiting a curious problem with the logname command. In some circumstances-at least on xubuntu 22.04 and linuxmint 21.1 mate-the logname command returns an empty string instead of the correct user name. In the case where logname fails to return the user name correctly, the environment variable SUDO_USER is examined before to fail.

### eggs-9.3.12
* linuxmint: just added linuxmint vera;
* oclif: working to integrate pnpm package manager inside oclif.

### eggs-9.3.11
* oclif: passed to [oclif-pnpm](https://github.com/pieroproietti/oclif-pnpm)@[3.4.2](https://www.npmjs.com/package/oclif-pnpm), a mime - little modified version of [oclif](https://github.com/oclif/oclif)@[3.4.2](https://www.npmjs.com/package/oclif) - with the scope of use pnpm. I hope to remain aligned with original, but really I like [pnpm](https://pnpm.io/) and its features, if someome have mine same need - use [oclif](https://oclif.io/) with [pnpm](https://pnpm.io/) - will be nice to collaborate.

### eggs-9.3.10
* changed ```liveMediumPath = '/run/archiso/copytoram/'``` and ```squashfs = '/airootfs.sfs'``` for archlinux, aligned to archiso;
* created configuration on ```naked/arch``` for archinstall for a [Arch naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html) version;


### eggs-9.3.9
Working with [LinuxFX](https://www.linuxfx.org/), which impressed me with its ability to mimic the look of Windows 11:

* eggs: added compatibility to [doas](https://wiki.archlinux.org/title/Doas), thanks to Roy Reynolds:
* produce: now remove the last slash from the theme (passed as path) and checks the existence of the theme itself;
* calamares: changed line Exec in install-system.desktop **Exec=install-system.sh**
* skel: added file .linuxfx if exist in home for linuxfx

### eggs-9.3.8

* theme: introduced possibility to define and use themes outside of eggs, You can pass a ```--theme ./path/to/theme``` to use them;

* theme: calamares modules ```locale```, ```partition``` and ```users``` can now be included in the theme. eg: EducaAndOS need a different configuration in calamares module ```users.conf```, this informations will come from ```/educancos/theme/calamares/modules/users.yml```.

Example: 
```
git clone https://github.com/pieroproietti/penguins-addons
sudo eggs produce --fast --theme ./penguins-addons/educaandos
```
Themes now can include more customizations, not only livecd and calamares brand, but user definition too and - with same time and experience - much more.

All the addictional themes are now removed from eggs and included in the [penguins-addons](https://github.com/pieroproietti/penguins-addons) repository. 

You can request [me](https://t.me/penguins_eggs) to be added as a collaborator to this repository and thus participate in the development. 

### eggs-9.3.7
Finally we get both Arch and Manjaro versions of eggs aligned with Debian/Devuan/Ubuntu. You can boot and install other computers via PXE booting from a live system! 

Just: ```sudo eggs cuckoo``` start to serve the inserted iso on your network. 

Remain to solve PXE boot on UEFI systems and find a working calamares pkgbuild for Arch.

### eggs-9.3.6
- cuckoo: arch and manjaro are correcty booting on PXE, at moment only on BIOS systems;
* calamares: differents mountpoints of the iso (from DVD vs PXE) create a problem in calamares/krill module unpack.conf (cannot find airootfs.sfs / livefs.sfs). You must edit ```/etc/calamares/modules/unpack.conf``` and adapt the path, before to run calamares/krill in case of PXE boot.

### eggs-9.3.5
Released eggs-9.3.5 version to manjaro and arch, it is working except PXE boot (cannot load http://${pxeserver}/filesystem.squashfs, I hope someone have suggestions)

### eggs-9.3.4-1
calamares: just a bugfix on module /etc/calamares/modules/packages.conf

### eggs-9.3.4
* added to dependencies sshfs, I'm now using it to export isos and debs, I previously used the commands: ssh and scp which involved entering two passwords;
* various adjustments in export paths with new defaults in tools.yaml
* removal of the ``eggs export docs`` command and removal of the generation of source documentation, in the end it was useless;
* updating the **mom-cli.sh** script used by the command ``eggs mom`` aligning it with the current edition
* Cleanup and path change for **adapt** and **resy** scripts (re-install eggs saving yolk) previously located in ``/usr/local/bin`` and moved to ``/usr/bin``

### eggs-9.3.3
* various bug fixes and README revision from [Sunu Aziz](https://github.com/sunuazizrahayu)

### eggs-9.3.2
* calamares/krill: readded module dpkg-unsafe-io, dpkg-unsafe-io-undo; changed modules sources-yolk, sources-yolk-undo
* calamares/krill: changed packages.ts to build module packages.conf

### eggs-9.3.1
* tools: added command ```sudo eggs tools ppa``` to add or remove penguins-eggs-ppa to the trusted repositories of the system;
* bugfix: xdg.ts, lightdm configuration, line 107

### eggs-9.3.0
bugfix: in version 9.2.9 I had forgotten to add the pxelinux package to the dependencies, to be added if not already present in the distro.
