### eggs-9.4.17
Finished to work on implementing custom final steps. Actually is possible to builds cfs for Arch/Debian/Ubuntu and they can be used to execute arbitrary customizations at the end of installations progress. 

You can find a sample on [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe/tree/main/vendors/bliss), write me for more informations.

### eggs-9.4.16
Almost no differences, except the work to add custom-final-steps to let possible configure easily custom installation with calamares or krill;
* Note: actually krill `eggs install -un` - the CLI installer - can work on Arch too;
* Some fixes.

### eggs-9.4.15
* egg of [blendOS](https://blendos.co/) now install and can re-produce! Until now I used version [23.04-1](https://sourceforge.net/projects/blendos/files/23.04-1/). You can find samples on [sample](https://sourceforge.net/projects/penguins-eggs/files/ISOS/blendos/).

### eggs-9.4.14
* first egg of [blendOS](https://blendos.co/) produced!

### eggs-9.4.13
* created unique kernelParameters function used for both grub.cfg and isolinux.cfg for live for Arch derived distributions;
* rethought and modified the creation of initramfs-linux.img for Arch derived distributions.

### eggs-9.4.12
* Introduced Ubuntu/devel compatibility for rhino, this solve the problems with calamares installer in rhino;

### eggs-9.4.11
* rewrote Utils.initrdImg() and Utils.vmlinuz() to try to integrate Arch, BlendOS, Crystal, EndeavourOS, RebornOS;
* adjustments in /addons/template/grub.template;
* added Ubuntu devel (Rhino Linux) to derivaties;
* added rhino theme in penguins-wardrobe.

### eggs-9.4.10
* Solved issue [Exclude.list not working #231](https://github.com/pieroproietti/penguins-eggs/issues/231);
* fixed: install-system.desktop icon.

### eggs-9.4.9
* `install-debian` - after so long time - became finally `install-system`;
* investigate about the lacks of calamares show and progress bar on Ubuntu jammy gnome;
* moved naked/arch configuration to penguis-wardrobe and aligned themes to the changes in eggs.

### eggs-9.4.8
Arch derivatives: compatibility with [EndeavourOS](https://endeavouros.com/) distribution added;

### eggs-9.4.6

I worked mainly on wardrobe, the changes in egg were a consequence.

After an attempt to switch to bash for defining customs, I decided to use for all four managed distributions the yaml language.

Managing Debian/Devuan, Ubuntu, and Arch with the same code is accomplished through yaml files that allow you to define the operations to be performed and what is needed,

The effort made was considerable, I hope it was worth it, but that will depend on who wants to adopt the methodology.

Report problems and bugs, suggestions, etc., after all, being able to handle more than 50% of Linux distributions in the same way could come in handy.

### eggs-9.4.5
* btrfs: ```eggs produce``` now works fine on btrfs. Note: calamares and krill configuration for btrfs is not enabled by default;
* bugfix: eggs copy branding from themes including subdirs;
* bugfix: check theme if exists and remove final / if we pass a theme;
* bugfix: link penguins-eggs and others stuffs README.md connected to the new site;
* live boot: removed CLI boot option and added safe option, GRUB is now hidden with a 2 seconds timeout, same for isolinux.

### eggs-9.4.4
* site: we switched to using docusauros to manage the [penguins-eggs.net](https://penguins-eggs.net) site;
- mom: better integration with the new site;
* typos: thanks to @JUST1CEjohnson, several grammatical and typing corrections have been made on the READMEs and commands;
* using [pnpm@8.1.0](https://pnpm.io/).

### eggs-9.4.3
* Manjaro: penguins-eggs was included in the [Manjaro community repo](https://gitlab.manjaro.org/packages/community/penguins-eggs);
* Arch: penguins-eggs is currently in [AUR](https://aur.archlinux.org/packages/penguins-eggs) repository;
* Debian/Devuan/Ubuntu: penguins-eggs for that distros and derivaties is included on [penguins-eggs-ppa](https://github.com/pieroproietti/penguins-eggs-ppa);
* bugfix: various bugfix and typos.

### eggs-9.4.2
* package: fixed the error that occurred when upgrading the package;
* until now I have tried [UEI - Unattended Eggs Installation](https://github.com/pieroproietti/penguins-eggs/blob/master/eui/README.md) extensively on XFCE, starting from this version cinnammon is working too as UEI;
* UEI scripts for gnome, kde and other desktop environments still remain to be created/fixed, I hope someone can give me some suggestions or help, thanks in advance.

### eggs-9.4.1
Working on EUI (Eggs Unattended Installation):

* solved the problem of network configuration on computers booted with PXE resetting the network connection with ```nmcli networking off``` and ```nmcli networking on``` during boot;
* to prevent further installation when the machine is configured with the PXE option as the first boot device, I added ```eggs install --flag halt```, so the system will be halted after the installation;
* fixed poweroff on Devuan;
* producing an EUI iso result in a iso filename with postfix _EUI.

### eggs-9.4.0
Ad un certo punto occorre eseguire il salto di versione - i numeri lunghi si ricordano male - ed è più semplice ricordare 9.4.0 invece di 9.3.31. In questo caso, per sottolineare il cambiamento ho fatto soprattutto una revisione dei testi in inglese che, non è la mia madrelingua. Spero - con l'aiuto di [deepl Translator](https://www.deepl.com/) - di esserci riuscito e che qualcuno voglia dare una mano.
