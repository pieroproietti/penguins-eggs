[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://vshymanskyy.github.io/StandWithUkraine)

penguins-eggs
=============

### Penguins&#39; eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Index
<!-- toc -->
* [Index](#index)
* [Introduction](#Introduction)
* [Technology](#technology)
* [Features](#features)
* [Packages](#packages)
* [Usage](#usage)
* [Commands](#commands)
* [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
* [That's all Folks!](#thats-all-folks)
<!-- tocstop -->


# Introduction
**penguins-eggs** is a console tool, under continuous development, that allows you to remaster your system and redistribute it as live images on usb sticks or via PXE.
The concept behind Penguins’ Eggs stems from the idea of “reproduction” and “population selection” applied to operating systems. During the era of popular remastering programs like Remastersys and Systemback, both of which experienced maintenance issues and were eventually abandoned, the need for a new, modern tool became evident. The inspiration for Penguins’ Eggs led to the development of a new tool written in a modern, cross-distribution language, utilizing its own packaging system. Initially built with node.js and later transitioning to Typescript as the primary development language, the tool’s design resembles an egg production process, consisting of operations such as “produce” for creating the eggs, “hatch” for installation, and other commands like “kill” for removing produced ISOs, “update” for software updates, and “install” for configuring the graphical installer. It also has prerequisites to install the .deb packages necessary for the process, namely, calamares.

Considered a work-in-progress, the ultimate goal for Penguins’ Eggs is to implement a PXE server for local network distribution, drawing inspiration from the behavior of the cuckoo bird, which relies on others to hatch its eggs. Written primarily in TypeScript, Penguins’ Eggs is designed to be compatible with various Linux distributions, despite differences in package managers, file paths, and more. The tool currently supports Debian, Devuan, Ubuntu, Arch, Manjaro, and their derivatives, across multiple architectures including amd64, i386, and arm64. With the release of version 9.6.x, Penguins’ Eggs is now available as a Debian package, catering to a wide range of systems including PCs, older machines, and single-board ARM systems like the Raspberry Pi, across amd64, i386, and arm64 architectures. For more information and updates, visit the Penguins’ Eggs official website.

"Penguins-eggs" is an actively developed console tool designed to help you customize and distribute your system as live images on USB sticks or through PXE. By using this tool, you can remaster your system according to your preferences.

By default, "penguins-eggs" completely removes the system's data and users. However, it also offers the option to remaster the system while including the data and accounts of existing users. This can be done using the "--clone" flag. Additionally, you can preserve the users and files by storing them in an encrypted LUKS file within the resulting ISO file, which can be achieved with the "--cryptedclone" flag.

The resulting live system can be easily installed using either the Calamares installer or the internal TUI Krill installer. Furthermore, if you prefer an unattended installation, you can utilize the "--unattended" flag.

One interesting feature of "penguins-eggs" is its integration with the "penguins-wardrobe." This allows you to create or utilize scripts to switch between different configurations. For example, you can start with a bare version of the system, featuring only a command-line interface (CLI), and then easily transition to a full graphical user interface (GUI) or server configurations.

For more information and customization options, you can explore "penguins-wardrobe," a related project. You can fork it and adapt it to meet your specific needs.

See [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe), fork it, and adapt it to your needs.

# Technology
"eggs" is primarily written in TypeScript and is designed to be compatible with various Linux distributions. While there may be differences in package managers, paths, and other aspects, the underlying programs used to build the live system are generally the same.

Currently, "eggs" supports several Linux distributions, including [Debian](https://www.debian.org/), [Devuan](https://www.devuan.org/), [Ubuntu](https://ubuntu.com/), [Arch](https://archlinux.org/), [Manjaro](https://manjaro.org/) and [derivatives](./conf/derivatives.yaml); and their derivatives. It also caters to different architectures, namely amd64, i386, and arm64.

Starting from version 9.6.x, "Penguins' eggs" is released as a Debian package, available for amd64, i386, and arm64 architectures. This allows it to support a wide range of PCs, including older machines, as well as single-board ARM systems like the Raspberry Pi. You can learn more about this release in the article titled Triple Somersault! [Triple somersault!](https://penguins-eggs.net/blog/triple-somersault).

For more information on the supported distributions and architectures, you can visit the blog [blog](https://penguins-eggs.net/blog/distros-that-can-be-remastered-with-eggs). Additionally, you can find examples of remastered ISO images created with "eggs" on the project's SourceForge page [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/ISOS/).

**penGUI take cure of eggs!**

![icon](https://github.com/pieroproietti/pengui/blob/main/assets/pengui.png?raw=true)

The development of a GUI for "penguins-eggs" with the penGUI project sounds promising. It's exciting to see that work on the GUI has started and is progressing rapidly. GUIs can greatly enhance the user experience and make it more accessible to a wider range of users. I hope the penGUI [penGUI](https://github.com/pieroproietti/pengui) project continues to thrive and brings a user-friendly interface to "penguins-eggs". If you have any specific questions or need further information about the penGUI project, feel free to ask!

# Features
Penguins-eggs is a versatile tool that offers an array of features and benefits for Linux users. Whether you want to create an installable ISO from your current Linux system or explore various customization options, Penguins-eggs has got you covered. To get started with Penguins-eggs, you'll need to install it on your Linux distribution. The tool supports a wide range of Linux distributions and their major derivatives, including Arch, Debian, Devuan, Manjaro, Ubuntu, and more. Additionally, you can easily add support for additional derivatives, expanding the tool's capabilities even further.

1. fast and efficient

Penguins-eggs is designed to be fast and efficient. Unlike traditional methods that involve copying the entire file system, Penguins-eggs utilizes livefs, which allows for instant acquisition of the live system. By default, the tool 

2. Supports Compression Algorithm

Employs the zstd compression algorithm, significantly reducing the time required for the process, often up to 10 times faster. When creating an installable ISO. 

3. Supports Clone

Penguins-eggs provides various options to suit your needs. With the --clone flag, you can preserve the data and accounts of unencrypted users, ensuring a seamless experience for users accessing the live system. Moreover, you can opt for a crypted clone, where user data and accounts are saved in an encrypted LUKS volume within the ISO image, enhancing security and privacy.

4. Cuckoo and PXE boot

In addition to ISO creation, Penguins-eggs offers a unique feature called Cuckoo. By starting Cuckoo from the live system, you can set up a PXE boot server, making it accessible to all computers on the network. This functionality opens up possibilities for network booting and streamlined deployment.Penguins Eggs Linux ushers in a new era of innovation and convenience with its groundbreaking default feature, Cuckoo live network boot, which transforms any computer running Penguins Eggs into a PXE (Preboot eXecution Environment) boot server. This revolutionary paradigm of network booting and seamless deployment underscores Penguins Eggs Linux’s commitment to redefining the parameters of accessibility and efficiency within the realm of Linux distributions

5. Supports Both TUI/GUI Installer

To simplify the installation process, Penguins-eggs provides its own system installer called krill. This installer is particularly useful when a GUI (Graphical User Interface) is not available, allowing for installation in various situations. However, if you are using a desktop system, Penguins-eggs recommends and configures the calamares GUI installer, ensuring a seamless and user-friendly experience. 
Penguins Eggs Linux spearheads a transformative revolution in the realm of system installation with the incorporation of its TUI (Text-based User Interface) / GUI (Graphical User Interface) installer, setting a new standard of versatility and accessibility within the landscape of Linux distributions. 

6. repository lists

One of the key advantages of Penguins-eggs is its commitment to utilizing only the original distro's packages. This means that no modifications are made to your repository lists, ensuring a safe and reliable environment. Penguins-eggs prioritizes maintaining the integrity and authenticity of your Linux distribution.

7. Wardrobe

To enhance customization options, Penguins-eggs introduces the concept of Wardrobe. With Wardrobe and its various components, such as costumes, you can easily organize and manage your customizations, samples, and more. This feature enables a streamlined and efficient workflow, allowing you to tailor your Linux system to your preferences.

8. supporting multiple distributions

Eggs supporting multiple distributions and their derivatives
Supports: Arch, Debian, Devuan, Manjaro, Ubuntu,
 and major derivatives: Linuxmint, KDE neon, EndeavourOS, Garuda, etc. You can easily add more derivatives.

10. supports hardware architectures

supports a wide range of hardware architectures.
Supports: i386, amd64 and arm64 architecture, from old PCs, and common PCs to single board computers like Raspberry Pi 4/5

11. Supports privacy and security 

Safe: only use the original distro's packages, without any modification in your repository lists. Penguins Eggs Linux embarks on a steadfast commitment to user security and system integrity through its default practice of exclusively utilizing original distributions’ packages without any modifications in the repository lists. This resolute dedication to maintaining the pristine authenticity of packages reinforces Penguins Eggs’ fundamental ethos of safety and reliability, fostering an environment characterized by unwavering trust in the integrity of the software ecosystem.

## more features 
[https://github.com/pieroproietti/penguins-eggs/tree/master/changelog.d]


## Wardrobe, Themes, and Addons
In April 2022, the "wardrobe" feature was introduced to "eggs." This addition serves as a comprehensive tool to assist and streamline the process of creating a customized version of Linux, starting from a command-line interface (CLI) system. I have embraced wardrobe for all my editions to enhance convenience, enabling me to better organize, consolidate, and manage my work effectively.

To add a unique touch to my customizations, I have assigned bird names to each edition. Except for the "naked" edition, there are various options available, including "Colibri," "eagle," "duck," "owl," and "chicks" under the bookworm and plastilinux distributions. [bookworm](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bookworm/)  and [plastilinux](https://sourceforge.net/projects/penguins-eggs/files/ISOS/plastilinux/),.Furthermore, under Waydroid on the eggs' SourceForge page, you can find "wagtail" and "warbier."

I have high hopes that people will take an interest in wardrobe and consider forking the main repository to incorporate their own customizations. By collaborating, we can achieve significant progress that would be challenging for a single developer to accomplish. If you would like to delve deeper into the wardrobe, I recommend reading the Penguins' eggs blog [Penguins' eggs blog](https://penguins-eggs.net/blog/wardrobe-colibri-duck-eagle-and-owl/). post titled Wardrobe: 
Colibri, Duck, Eagle, and Owl, which provides further insights into its features and benefits.

Furthermore, addons, predominantly themes, have been organized under the vendor's folder in the penguin's wardrobe. I encourage utilizing your wardrobe for all your customization needs to maintain consistency and organization throughout your work.

For detailed instructions on using a wardrobe, please consult the wardrobe users' guide  [wardrobe users' guide](https://penguins-eggs.net/docs/Tutorial/wardrobe-users-guide)..


## Clone/Cryptedclone
When creating a live distribution of your system, you have different options to consider: the default mode, clone, and cryptedclone.
•	The default mode, achieved by using the command "eggs produce," completely removes user data from the live distribution. This ensures that no private data remains in the live system.

•	The "eggs produce --clone" command allows you to save both user data and system data directly in the generated ISO. This means that if someone obtains a copy of the ISO, they will be able to see and access the 
user data directly from the live system. It's important to note that this data is not encrypted, so it may not be suitable for sensitive information.

•	On the other hand, the "eggs produce --cryptedclone" command saves the data within the generated ISO using a LUKS (Linux Unified Key Setup) volume. With this option, the user data will not be visible in the live system. However, it can be automatically reinstalled during the system installation process using the "krill" installer. Even if someone has the generated ISO, they won't be able to access the user data without the LUKS passphrase. This ensures that your data remains protected.

To summarize the available options:

•	"eggs produce" (default): All private data is removed from the live system.

•	"eggs produce --clone": All user data is included unencrypted directly in the live system.

•	"eggs produce --cryptedclone": All user data is included encrypted within a LUKS volume inside the ISO.

During the installation process, you can use the "krill" installer to restore your crypted data automatically. By running the command "sudo eggs install" with the "krill" installer, your encrypted data will be securely transferred and made available in the installed system.

## calamares and krill
eggs was developed to use [calamares](https://calamares.io) as the system installer and allows its customization with themes. It also includes its own installer, called krill, which allows you to produce and install CLI systems such as servers. krill uses a CLI interface that mimics calamares and uses the same configuration files created by eggs for calamares. This provides a "roughly similar" installation experience for both desktop and server installations. With krill it is also possible to have unattended installations, simply by adding the ``--unattended`` flag, the configuration values can be changed in ``/etc/penguins-eggs.d/krill.yaml`` and will then be used for automatic installation.

## cuckoo
The cuckoo lays its eggs in the nests of other birds, and the eggs are hatched by the latter. Similarly eggs can start a self-configuring PXE service to allow you to boot and install your iso on third party networked computers. Command cuckoo can be used either to deploy a newly created iso on an installed system or by live booting the iso itself. 

## mom and dad
I added two built-in assistants with eggs: mom and dad. While mom is a script based on [easybashgui](https://github.com/BashGui/easybashgui) that explains the various commands and documentation, dad started as a shortcut to properly configure eggs: just type ```sudo eggs dad``` and follow simple instructions. Even faster, using ```sudo eggs dad -d``` you will resets the configuration, loads defaults, deletes created isos. At this point, with eggs configured, just type ```sudo produce``` to generate your live.

## yolk 
yolk - so called staying on the subject of eggs - is a local repository included in the livecd that contains a minimum of indispensable packages during installation. Thanks to yolk, you can safely install your system without the need of an active internet connection.

# Packages
Supporting various distributions, we need to have different packages. Debian, Devuan and Ubuntu share the .deb packages for amd_64 and i386 architecture, while Arch and ManjaroLinux use their own PKGBUILDs.

## Debian families
eggs is released as a deb package for amd64, i386 and arm64 too.

Because of eggs' features, the packages can be installed in Debian, Devuan, or Ubuntu-based distros without worrying about exact version (buster, bullseye, bookworm, trixie, chimaera, daedalus, bionic, focal and jammy) are reported to work, of course respect the processor architecture. 

The packages includes standard scripts for preinst, postinst, prerm and postrm and man pages. 

### Install eggs
There are more than a way to install eggs as .deb package, the most practical is to add and use penguins-eggs-ppa.

#### Download the package and install with dpkg

The simplest way to install eggs is download the [package eggs](https://sourceforge.net/projects/penguins-eggs/files/DEBS/) from [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/) and install it

```
sudo dpkg -i eggs_9.6.24_amd64.deb 
```

or, on a i386 system:
```
sudo dpkg -i eggs_9.6.24_i386.deb
```

Once eggs is installed you can add the [penguins-eggs-ppa](https://pieroproietti.github.io/penguins-eggs-ppa) repository with the command: ```sudo eggs tools ppa --install```

#### Using penguins-eggs-ppa (stable version)

You can use a little utility I wrote: `get-eggs`. Use it in this way:

* `git clone https://github.com/pieroproietti/get-eggs`
* `cd get-eggs`
* `sudo ./get-eggs`

On Debian, Devuan and Ubuntu get-eggs will add the ppa and install eggs.

For derivatives of Debian, Devuan and Ubuntu, like Linuxmint, LMDE, etc, get-eggs will normally  work but You can again copy and paste the following two lines in a terminal:

```
curl -fsSL https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/penguins-eggs.gpg
echo "deb [arch=$(dpkg --print-architecture)] https://pieroproietti.github.io/penguins-eggs-ppa ./" | sudo tee /etc/apt/sources.list.d/penguins-eggs.list > /dev/null
```

Update your repositories and install eggs:

```
sudo apt update && sudo apt install eggs
```

### Upgrade eggs
If you are using penguins-eggs-ppa You can upgrade eggs as others packages just: **sudo apt upgrade**, else simply download new versions of eggs from [sourgeforge page](https://sourceforge.net/projects/penguins-eggs/files/DEBS/) and install it with the standard command **sudo gdebi eggs_9.6.24_amd64.deb** or **sudo dpkg -i eggs_9.6.24_i386.deb** and **sudo apt install -f**.

## Arch families
eggs has been present in [AUR](https://aur.archlinux.org/) for a long time, even without my knowledge thanks the support of Arch peoples. I am currently directly maintaining the AUR version of [penguins-eggs](https://aur.archlinux.org/packages/penguins-eggs) and I'm participating in the [Manjaro Community Repository](https://gitlab.manjaro.org/packages/community/penguins-eggs).

The development versions of penguins eggs and other PKGBUILDs are instead in my [eggs-pkgbuilds](https://github.com/pieroproietti/eggs-pkgbuilds) repository.

### Arch
It's possible to install penguins-eggs from [AUR](https://aur.archlinux.org/packages/penguins-eggs) adding repo [Chaotic-AUR](https://aur.chaotic.cx/) and using `sudo pacman -Sy penguins-eggs`.

You can use a little utility I wrote: `get-eggs`. Use it in this way:

* `git clone https://github.com/pieroproietti/get-eggs`
* `cd get-eggs`
* `sudo ./get-eggs`

[get-eggs](https://github.com/pieroproietti/get-eggs) will add AUR repository and install penguins-eggs.

Of course you can also use yay: `yay penguins-eggs` or download the sources and run makepkg:

```
git clone https://aur.archlinux.org/packages/penguins-eggs
cd penguins-eggs
makepkg -srcCi
```
### Manjaro
From penguins-eggs v9.4.3 the package is part of the [Manjaro community](https://gitlab.manjaro.org/packages/community/penguins-eggs) repo and can be installed with `pamac install penguins-eggs`.

Alternatively you can clone the package, and:
```
git clone https://gitlab.manjaro.org/packages/community/penguins-eggs/
cd penguins-eggs
makepkg -srcCi
```

# Usage

Once the package has been installed, you can have the new ```eggs``` command. Typing ```eggs``` will get the list of commands, typing ```eggs produce --help``` will get the eggs produce command help screen. You can also use the command autocomplete with the TABS key, you will get the possible choices for each command. In addition, there is a man page, so by typing ```man eggs``` you will get that help as well. You can also use the ```eggs mom``` command that interactively allows you to consult the help for all commands and online documentation.

## Examples

* Create a live system without user data:

```sudo eggs produce ```

* Create a live system with user data uncrypted.

```sudo eggs produce --clone```

* Create a live system with the encrypted user data.

```sudo eggs produce --cryptedclone```

At the moment eggs uses the default fast compression, which provides a faster compression speed, for the final compression it is worth using the ```--max``` flag to get more compressed ISOs.

In addition to the description of the commands in this README, you can consult the [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide).

# Commands
<!-- commands -->
* [`eggs adapt`](#eggs-adapt)
* [`eggs analyze`](#eggs-analyze)
* [`eggs autocomplete [SHELL]`](#eggs-autocomplete-shell)
* [`eggs calamares`](#eggs-calamares)
* [`eggs config`](#eggs-config)
* [`eggs cuckoo`](#eggs-cuckoo)
* [`eggs dad`](#eggs-dad)
* [`eggs export deb`](#eggs-export-deb)
* [`eggs export iso`](#eggs-export-iso)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs mom`](#eggs-mom)
* [`eggs produce`](#eggs-produce)
* [`eggs status`](#eggs-status)
* [`eggs syncfrom`](#eggs-syncfrom)
* [`eggs syncto`](#eggs-syncto)
* [`eggs tools clean`](#eggs-tools-clean)
* [`eggs tools ppa`](#eggs-tools-ppa)
* [`eggs tools skel`](#eggs-tools-skel)
* [`eggs tools stat`](#eggs-tools-stat)
* [`eggs tools yolk`](#eggs-tools-yolk)
* [`eggs update`](#eggs-update)
* [`eggs version`](#eggs-version)
* [`eggs wardrobe get [REPO]`](#eggs-wardrobe-get-repo)
* [`eggs wardrobe list [WARDROBE]`](#eggs-wardrobe-list-wardrobe)
* [`eggs wardrobe show [COSTUME]`](#eggs-wardrobe-show-costume)
* [`eggs wardrobe wear [COSTUME]`](#eggs-wardrobe-wear-costume)

## `eggs adapt`

adapt monitor resolution for VM only

```
USAGE
  $ eggs adapt [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  adapt monitor resolution for VM only

EXAMPLES
  $ eggs adapt
```

_See code: [src/commands/adapt.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/adapt.ts)

## `eggs analyze`

analyze for syncto

```
USAGE
  $ eggs analyze [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  analyze for syncto

EXAMPLES
  sudo eggs analyze
```

_See code: [src/commands/analyze.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/analyze.ts)_

## `eggs autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ eggs autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ eggs autocomplete

  $ eggs autocomplete bash

  $ eggs autocomplete zsh

  $ eggs autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.3.8/src/commands/autocomplete/index.ts)_

## `eggs calamares`

configure calamares or install or configure it

```
USAGE
  $ eggs calamares [-h] [-i] [-n] [-r] [--remove] [--theme <value>] [-v]

FLAGS
  -h, --help           Show CLI help.
  -i, --install        install calamares and its dependencies
  -n, --nointeractive  no user interaction
  -p, --policies       configure calamares policies
  -r, --release        release: remove calamares and all its dependencies after the installation
  -v, --verbose
  --remove             remove calamares and its dependencies
  --theme=<value>      theme/branding for eggs and calamares

DESCRIPTION
  configure calamares or install or configure it

EXAMPLES
  sudo eggs calamares

  sudo eggs calamares --install

  sudo eggs calamares --install --theme=/path/to/theme

  sudo eggs calamares --remove
```

_See code: [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/calamares.ts)_

## `eggs config`

Configure and install prerequisites deb packages to run it

```
USAGE
  $ eggs config [-c] [-h] [-n] [-v]

FLAGS
  -c, --clean          remove old configuration before to create new one
  -h, --help           Show CLI help.
  -n, --nointeractive  no user interaction
  -N, --noicons        no icons

DESCRIPTION
  Configure and install prerequisites deb packages to run it

EXAMPLES
  sudo eggs config

  sudo eggs config --clean

  sudo eggs config --clean --nointeractive
```

_See code: [src/commands/config.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/config.ts)_

## `eggs cuckoo`

PXE start with proxy-dhcp

```
USAGE
  $ eggs cuckoo [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  PXE start with proxy-dhcp

EXAMPLES
  sudo eggs cuckoo
```

_See code: [src/commands/cuckoo.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/cuckoo.ts)_

## `eggs dad`

ask help from daddy - TUI configuration helper

```
USAGE
  $ eggs dad [-c] [-d] [-h] [-v]

FLAGS
  -c, --clean    remove old configuration before to create
  -d, --default  remove old configuration and force default
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  ask help from daddy - TUI configuration helper

EXAMPLES
  sudo dad

  sudo dad --clean

  sudo dad --default
```

_See code: [src/commands/dad.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/dad.ts)_

## `eggs export deb`

export deb/docs/iso to the destination host

```
USAGE
  $ eggs export deb [-a] [-c] [-h] [-v]

FLAGS
  -a, --all      export all archs
  -c, --clean    remove old .deb before to copy
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  export deb/docs/iso to the destination host

EXAMPLES
  $ eggs export deb

  $ eggs export deb --clean

  $ eggs export deb --all
```

_See code: [src/commands/export/deb.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/export/deb.ts)_

## `eggs export iso`

export iso in the destination host

```
USAGE
  $ eggs export iso [-c] [-h] [-v]

FLAGS
  -c, --clean    delete old ISOs before to copy
  -C, --checksum  export checksums md5 and sha256
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  export iso in the destination host

EXAMPLES
  $ eggs export iso

  $ eggs export iso --clean
```

_See code: [src/commands/export/iso.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/export/iso.ts)_

## `eggs help [COMMAND]`

Display help for eggs.

```
USAGE
  $ eggs help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for eggs.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.23/src/commands/help.ts)_

## `eggs install` or `eggs krill`

krill: the CLI system installer - the egg became a penguin!

```
USAGE
  $ eggs install [-k] [-c <value>] [-d <value>] [-H] [-h] [-i] [-n] [-N] [-p] [-r] [-s] [-S] [-u] [-v]

FLAGS
  -H, --halt            Halt the system after installation
  -N, --none            Swap none: 256M
  -S, --suspend         Swap suspend: RAM x 2
  -c, --custom=<value>  custom unattended configuration
  -d, --domain=<value>  Domain name, defult: .local
  -h, --help            Show CLI help.
  -i, --ip              hostname as ip, eg: ip-192-168-1-33
  -k, --crypted         Crypted CLI installation
  -n, --nointeractive   no user interaction
  -p, --pve             Proxmox VE install
  -r, --random          Add random to hostname, eg: colibri-ay412dt
  -s, --small           Swap small: RAM
  -u, --unattended      Unattended installation
  -v, --verbose         Verbose

DESCRIPTION
  krill: the CLI system installer - the egg became a penguin!

EXAMPLES
  sudo eggs install

  sudo eggs install --unattended

  sudo eggs install --custom it
```

_See code: [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/install.ts)_

## `eggs kill`

kill the eggs/free the nest

```
USAGE
  $ eggs kill [-h] [-n] [-v]

FLAGS
  -h, --help           Show CLI help.
  -i, --isos           erase all ISOs on remote mount
  -n, --nointeractive  no user interaction
  -v, --verbose        verbose

DESCRIPTION
  kill the eggs/free the nest

EXAMPLES
  sudo eggs kill
```

_See code: [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands//kill.ts)_

## `eggs mom`

ask help from mommy - TUI helper

```
USAGE
  $ eggs mom [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  ask help from mommy - TUI helper

EXAMPLES
  $ eggs mom
```

_See code: [src/commands/mom.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/mom.ts)_

## `eggs produce`

produce a live image from your system whithout your data

```
USAGE
  $ eggs produce [--addons <value>] [--basename <value>] [-c] [-C] [-h] [-m] [-n] [-p <value>] [--release]
    [-s] [-f] [--theme <value>] [-v] [-y]

FLAGS
  -C, --cryptedclone    crypted clone
  -c, --clone           clone
  -f, --standard        standard compression
  -h, --help            Show CLI help.
  -m, --max             max compression
  -N, --noicons         no icons
  -n, --nointeractive   no user interaction
  -p, --prefix=<value>  prefix
  -s, --script          script mode. Generate scripts to manage iso build
  -u, --unsecure        include /home/* and full /root contents on live
  -v, --verbose         verbose
  -y, --yolk            force yolk renew
  --addons=<value>...   addons to be used: adapt, ichoice, pve, rsupport
  --basename=<value>    basename
  --filters=<value>...  filters to be used: custom. dev, homes, usr
  --release             release: max compression, remove penguins-eggs and calamares after installation
  --theme=<value>       theme for livecd, calamares branding and partitions

DESCRIPTION
  produce a live image from your system whithout your data

EXAMPLES
  sudo eggs produce

  sudo eggs produce --max

  sudo eggs produce --clone
  
  sudo eggs produce --clone --max
  
  sudo eggs produce --basename=colibri

  sudo eggs produce --filters custom homes usr

  sudo eggs produce --theme /path/to/theme --addons adapt
```

_See code: [src/commands/produce.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/produce.ts)_

## `eggs status`

informations about eggs status

```
USAGE
  $ eggs status [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  informations about eggs status

EXAMPLES
  $ eggs status
```

_See code: [src/commands/status.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/status.ts)_

## `eggs syncfrom`

restore users and user data from a LUKS volumes

```
USAGE
  $ eggs syncfrom [--delete <value>] [-f <value>] [-h] [-r <value>] [-v]

FLAGS
  -f, --file=<value>     file LUKS volume encrypted
  -h, --help             Show CLI help.
  -r, --rootdir=<value>  rootdir of the installed system, when used from live
  -v, --verbose          verbose
  --delete=<value>       rsync --delete delete extraneous files from dest dirs

DESCRIPTION
  restore users and user data from a LUKS volumes

EXAMPLES
  sudo eggs syncfrom

  sudo eggs syncfrom --file /path/to/fileLUKS
```

_See code: [src/commands/syncfrom.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/syncfrom.ts)_

## `eggs syncto`

saves users and user data in a LUKS volume inside the iso

```
USAGE
  $ eggs syncto [--delete <value>] [-f <value>] [-h] [-v]

FLAGS
  -f, --file=<value>  file LUKS volume encrypted
  -h, --help          Show CLI help.
  -v, --verbose       verbose
  --delete=<value>    rsync --delete delete extraneous files from dest dirs

DESCRIPTION
  saves users and user data in a LUKS volume inside the iso

EXAMPLES
  sudo eggs syncto

  sudo eggs syncto --file /path/to/fileLUKS
```

_See code: [src/commands/syncto.js](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/syncto.ts)_

## `eggs tools clean`

clean system log, apt, etc

```
USAGE
  $ eggs tools clean [-h] [-n] [-v]

FLAGS
  -h, --help           Show CLI help.
  -n, --nointeractive  no user interaction
  -v, --verbose        verbose

DESCRIPTION
  clean system log, apt, etc

EXAMPLES
  sudo eggs tools clean
```

_See code: [src/commands/tools/clean.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/clean.ts)_

## `eggs tools ppa`

add/remove PPA repositories (Debian family)

```
USAGE
  $ eggs tools ppa [-a] [-h] [-n] [-r] [-v]

FLAGS
  -a, --add            add penguins-eggs PPA repository
  -h, --help           Show CLI help.
  -n, --nointeractive  no user interaction
  -r, --remove         remove penguins-eggs PPA repository
  -v, --verbose        verbose

DESCRIPTION
  add/remove PPA repositories (Debian family)

EXAMPLES
  sudo eggs tools ppa --add

  sudo eggs tools ppa --remove
```
_See code: [src/commands/tools/ppa.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/ppa.ts)_

## `eggs tools skel`

update skel from home configuration

```
USAGE
  $ eggs tools skel [-h] [-u <value>] [-v]

FLAGS
  -h, --help          Show CLI help.
  -u, --user=<value>  user to be used
  -v, --verbose

DESCRIPTION
  update skel from home configuration

EXAMPLES
  sudo eggs tools skel

  sudo eggs tools skel --user user-to-be-copied
```
_See code: [src/commands/tools/skel.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/skel.ts)_


## `eggs tools stat`

get statistics from sourceforge

```
USAGE
  $ eggs tools stat [-h] [-m] [-y]

FLAGS
  -h, --help   Show CLI help.
  -m, --month  current month
  -y, --year   current year

DESCRIPTION
  get statistics from sourceforge

EXAMPLES
  $ eggs tools stat

  $ eggs tools stat --month

  $ eggs tools stat --year
```

_See code: [src/commands/tools/stat.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/stat.ts)_


## `eggs tools yolk`

configure eggs to install without internet

```
USAGE
  $ eggs tools yolk [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  configure eggs to install without internet

EXAMPLES
  sudo eggs tools yolk
```
_See code: [src/commands/tools/yolk.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/tools/yolk.ts)_


## `eggs update`

update the Penguins' eggs tool

```
USAGE
  $ eggs update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose  verbose

DESCRIPTION
  update the Penguins' eggs tool

EXAMPLES
  $ eggs update
```

_See code: [src/update.js](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands//update.ts)_

## `eggs version`

```
USAGE
  $ eggs version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v1.1.4/src/commands/version.ts)_

## `eggs wardrobe get [REPO]`

get warorobe

```
USAGE
  $ eggs wardrobe get [REPO] [-h] [-v]

ARGUMENTS
  REPO  repository to get

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  get warorobe

EXAMPLES
  $ eggs wardrobe get

  $ eggs wardrobe get your-wardrobe
```

_See code: [src/commands/wardrobe/get.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/wardrobe/get.ts)_


## `eggs wardrobe list [WARDROBE]`

list costumes and accessoires in wardrobe

```
USAGE
  $ eggs wardrobe list [WARDROBE] [-h] [-v]

ARGUMENTS
  WARDROBE  wardrobe

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  list costumes and accessoires in wardrobe

EXAMPLES
  $ eggs wardrobe list

  $ eggs wardrobe list your-wardrobe
```

_See code: [src/commands/wardrobe/list.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/wardrobe/list.ts)_


## `eggs wardrobe show [COSTUME]`

show costumes/accessories in wardrobe

```
USAGE
  $ eggs wardrobe show [COSTUME] [-h] [-j] [-v] [-w <value>]

ARGUMENTS
  COSTUME  costume

FLAGS
  -h, --help              Show CLI help.
  -j, --json              output JSON
  -v, --verbose
  -w, --wardrobe=<value>  wardrobe

DESCRIPTION
  show costumes/accessories in wardrobe

EXAMPLES
  $ eggs wardrobe show colibri

  $ eggs wardrobe show accessories/firmwares

  $ eggs wardrobe show accessories/
```
_See code: [src/commands/wardrobe/show.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/wardrobe/show.ts)_

## `eggs wardrobe wear [COSTUME]`

wear costume/accessories from wardrobe

```
USAGE
  $ eggs wardrobe wear [COSTUME] [-h] [-a] [-f] [-s] [-v] [-w <value>]

ARGUMENTS
  COSTUME  costume

FLAGS
  -a, --no_accessories    not install accessories
  -f, --no_firmwares      not install firmwares
  -h, --help              Show CLI help.
  -s, --silent
  -v, --verbose
  -w, --wardrobe=<value>  wardrobe

DESCRIPTION
  wear costume/accessories from wardrobe

EXAMPLES
  sudo eggs wardrobe wear duck

  sudo eggs wardrobe wear accessories/firmwares

  sudo eggs wardrobe wear wagtail/waydroid
```

_See code: [src/commands/wardrobe/wear.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/commands/wardrobe/wear.ts)_

<!-- commandsstop -->

# Penguins' eggs official guide
The original edition of the eggs manual is released in Italian, of course other languages can be accessed using machine translation:

[Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)

A nice thing to do to help users could be to make terminal samples, I did this some time ago, but they should be updated.

![terminal samples](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/terminal-lessons/eggs_help.gif?raw=true)

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

# More informations
There is a [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide) and same other documentation - mostly for developers - on the repository [penguins-eggs](https://github.com/pieroproietti/penguins-eggs) under [documents](https://github.com/pieroproietti/penguins-eggs/tree/master/documents). I want to point out [hens, differents species](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/hens-different-species.md) a brief how to use eggs in Debian. Arch and Manjaro, and the post [Arch-naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html) on the blog which describes how to create an Arch naked live, install it, then dress the resulting system with a graphics development station.

You can contact me by [mail](mailto://pieroproietti@gmail.com) or follow me on 
[blog](https://penguins-eggs.net), 
[facebook](https://www.facebook.com/groups/128861437762355/), 
[github](https://github.com/pieroproietti/penguins-krill), 
[jtsi](https://meet.jit.si/PenguinsEggsMeeting), 
[reddit](https://www.reddit.com/user/Artisan61), 
[telegram](https://t.me/penguins_eggs), 
[twitter](https://twitter.com/pieroproietti).

# Copyright and licenses
Copyright (c) 2017, 2024 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
