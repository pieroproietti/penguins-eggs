penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![www](https://img.shields.io/badge/www-blog-cyan)](https://penguins-eggs.net)
[![telegram](https://img.shields.io/badge/telegram-group-cyan)](https://t.me/penguins_eggs)
[![basket](https://img.shields.io/badge/basket-packages-blue)](https://penguins-eggs.net/basket/)
[![drive](https://img.shields.io/badge/drive-isos-blue)](https://penguins-eggs.net/drive)
[![sourceforge](https://img.shields.io/badge/sourceforge-all-blue)](https://sourgeforge.net/project/penguins-eggs)
[![ver](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)

It took years of work to create the penguins-eggs, and I also incurred expenses for renting the site and subscribing to Google Gemini, for the artificial intelligence that is now indispensable.

[![donate](https://img.shields.io/badge/Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/penguinseggs)

# Changelog
We switched to a version number based on year, month, day, and release number. I hope it will be more clear and useful. 

Versions are listed on reverse order, the first is the last one.

## penguins-eggs_25.8.24
Released packages for all the distros.

## penguins-eggs_25.8.23
Finally, remastering Debian trixie, resulting ISO will boot on UEFI and will be correctly installed using calamares, but you need to DISABLE Secure Boot.

We need to discover more, about this annoying problem. I'm releasing again, becouse need feedback.

## penguins-eggs_25.8.22
* changed the way the image ISO is generated, priority now is xorriso. Only if xorriso is not installed will try genisoimage;
* added Debian 14 forky;
* updated modules;
* work in progress... see note.

This version on Debian trixie will boot on UEFI, but will not correctly installed using calamares on Debian trixie. 

## penguins-eggs_25.8.10 (San Lorenzo edition)

I have recreated the packages for i386, amd64, and arm64 for Devuan/Debian/Ubuntu distributions and derivatives.

We will continue to use Debian bootloaders to boot the other supported distributions: Alpine, Arch, Fedora, Manjaro, OpenSUSE, Rocky, and Ubuntu. The bootloaders will be collected in a `/bootloaders` folder under penguins-eggs, and will be created from the specific `bootloaders.tag.gz` associated with the current release.

The good news is that I did a complete overhaul of the make-efi.ts and xorriso-command.ts code, including restoring support for arm64 and i386.

The arm64 package need to be tested -  I have no way actually - so please test it and send me feedback.

* `.disk/info` reflect now volid, to support Debian live-boot scripts, which rely on finding the correct Volume ID for device verification;
* introduced a `.disk/README.md` for general informations about the ISO and the tool used.

## penguins-eggs_25.8.6
I spent most of my time compiling a list of [supported distributions](https://github.com/pieroproietti/get-eggs/blob/main/SUPPORTED-DISTROS.md), which was a huge task, and I'm only halfway through the 100 distributions I need to test. On the other hand, this experience forced me to review the derivatives.yaml file and make some additions.

I am also considering restoring the package for arm84 and, perhaps, i386, which I had to remove due to the decision to simplify bootloader management, but this step requires time and thought, so we will postpone it until September.

## penguins-eggs_25.7.30
During this time I did a great work on [get-eggs](https://github.com/pieroproietti/get-eggs) completely rewritten and adding an usefull [SUPPORTED-DISTROS](https://github.com/pieroproietti/get-eggs/blob/main/SUPPORTED-DISTROS.md) list. In addiction, same fixes and improvment on penguins-eggs:
* ovarium: 
    * reintroduced the `bindvfs` and `ubindvfs` scripts used to mount and unmount virtual file systems;
    * fixed path to `isohdpfx.bin` on the ovarium script `mkiso`;
* fixed paths on the commands `export` and `update` to reflect actual versioning and folders structure on [penguins-eggs.net](https://penguins-eggs.net/basket) and [sourceforge page](https://sourceforge.net/projects/penguins-eggs/).

## penguins-eggs_25.7.22
This is a settlement version. During version 25.7.14 rpm packages for [fedora](https://sourceforge.net/projects/penguins-eggs/files/Packages/fedora/), [opensuse](https://sourceforge.net/projects/penguins-eggs/files/Packages/opensuse/) and [rhel9](https://sourceforge.net/projects/penguins-eggs/files/Packages/el9/)  were created for the first time. Of course, this gradually required code changes. This version picks them up and includes all them, but has no substantial new features compared to the previous version.

## penguins-eggs_25.7.14
* `produce --script`: copied directories: `/etc` and `/boot` are not overwritten a second time when the `bind` script is run and are not deleted by `ubind`. This led to a malfunction of the `produce --script` command and the deletion of the live user in the generated ISO.
* `produce --script`: added patch to the script `mksquashfs` to emulate livecd structure of archiso/miso. Now option: `sudo produce --script` can be successully used on every distro.
* `Alpine`/`Fedora`: finally calamares is configured and installing. Remain to solve for `OpenSUSE`.

## penguins-eggs_25.7.12 (Back to future!)

A few months ago - around March - I tried to introduce building complete systems from containers. This required a global review of the methods for getting the kernel name and version. Neither `uname -r` nor `/proc/cmdline` parsing can be used in containers.

Having received several reports from users who have the system with several kernels installed, I decided to return to the traditional method for common installed systems.

I also retraced my steps for the classes utils.tsx and distro.ts, which had been restructured with the help of AI. 

The problem here was the fact that it was impossible for me to maintain them. AI has a broader knowledge of language and methodologies than myself, but also excessively tortuous from a logical point of view. However, I count-in the future-to partially recover the good parts of this work by rewriting it from scratch.

## penguins-eggs_25.7.10
I have greatly simplified boot management expecially on UEFI machines: previously for each distribution I used the grub of the distribution itself, which was very fine but time-consuming in terms of code maintenance. Now I use for booting from live CD the Debian grub and I do the same for booting via PXE and, this, has allowed me to simplify the code considerably. 

All bootloaders: grub, ipxe and syslinux, are now collected in the bootloaders folders and contained in the package itself.

## penguins-eggs_25.7.7
These days I have been doing a lot of work on remote installation via PXE, on some long neglected distributions: alpine, opensuse, etc. 

This is the actual situation:

* alpine: remaster OK, installation CLI OK, calamares KO, PXE boot OK, install from PXE OK
* arch: remaster OK, installation CLI OKk, calamares OK, PXE boot OK, install from PXE OK
* debian: remaster OK, installation CLI OK, calamares OK, PXE boot OK, install from PXE OK
* fedora: remaster OK, installation CLI OK, calamares KO, PXE boot OK, install CLI from PXE KO
* opensuse: remaster OK, installation CLI OK, calamares KO, PXE boot OK, install CLI from PXE KO

## Summary of Penguins-Eggs Changelog 10.1.x

This summary categorizes the updates into major features, expanded distribution support, installer improvements, and other key refinements to provide a clear overview of the project's progress.

***

### Major Features & Enhancements

* **AI-Powered Refactoring**: In version **10.1.1**, the developer began using AI for intensive code refactoring, significantly speeding up development and improving code quality.
* **New `pods` Command**: Version **10.1.0-2** introduced the experimental `eggs pods` command, which allows users to create minimal live ISO images directly from `podman` containers.
* **Container-Based Builds**: A major "underground" change in version **10.1.0-1** enabled building live images of one distribution on a host system running a different one (e.g., creating an Arch Linux image on a Debian system).
* **New GUI `eggsmaker`**: A new, usable graphical user interface called **eggsmaker** was introduced in version **10.0.61**, making the tool more accessible to users who prefer a GUI.
* **Installation Modes**: The installation options were simplified in version **10.0.60**. The LVM2 mode was removed, leaving three primary modes: **Erase disk**, **Erase disk/Encrypted**, and **Replace partition**.
* **Secure Boot Support**: Work was done in version **10.0.59** to enable ISOs to boot with Secure Boot enabled on UEFI systems, with success on Debian Bookworm and a manual workaround for Ubuntu.

***

### Expanded Distribution Support

The project has significantly broadened its compatibility across different Linux families.

* **RPM-Based Distros**: A major breakthrough in version **10.0.54** enabled the creation of bootable UEFI ISO images for **Fedora**, **AlmaLinux**, **RockyLinux**, and **openSUSE**. Fedora support was a major focus in version **10.0.36**.
* **Alpine Linux**: Support for **Alpine Linux** was reintroduced and improved across several versions, including the creation of Calamares packages, fixes for the `krill` installer, and a more streamlined live boot process (**10.1.1-26**, **10.0.34**, **10.0.25**).
* **Arch Linux**: Btrfs support was improved, and a new Calamares package was aligned with the latest release (**10.1.1-26**, **10.0.46**).
* **Newer Releases**: Support was added for recent distribution releases, including **LMDE 7 (Gigi)**, **Linux Mint 22.2 (Zara)**, **Ubuntu Noble**, and **Devuan Excalibur** (**10.1.1-26**, **10.0.42**, **10.0.14**).
* **Other Distros**: Efforts were made to add support for **openmamba**, **VoidLinux**, and **ALDOS** (**10.0.51**).

***

### Installer Improvements (Krill & Calamares)

Both the command-line installer (`krill`) and the graphical installer (`calamares`) received significant updates.

* **Krill (TUI Installer)**:
    * Added support for **encrypted installations** and LVM2 (**10.0.59**).
    * The user interface was completely revised with a new spinner and a more intuitive layout (**10.0.38**).
    * Added a **chroot** option, allowing users to make final package changes before rebooting the newly installed system (**10.0.3**).
    * User creation is now standardized, taking default groups from the Calamares configuration to ensure consistency (**10.1.1-26**).
* **Calamares (GUI Installer)**:
    * Configuration was updated to automatically select the parent system's original filesystem as the default (**10.0.46**).
    * Branding parameters (like support URLs) are now pulled from `/etc/os-release` for better integration (**10.0.4**).
    * Fixed issues to get Calamares working successfully on newer releases like **Ubuntu Noble** and **Linux Mint 22** (**10.0.22**).

***

### Other Key Changes & Refinements

* **Development & Packaging**: The project's build system was modernized to support both CommonJS and ECMAScript modules. The official package name was changed from `eggs` to **`penguins-eggs`** to reflect this major update (**10.0.0**, **9.8.0**).
* **Dependency Management**: Unnecessary dependencies like `lsb_release`, `pxelinux`, and `isolinux` were removed to streamline the tool (**10.0.57**, **10.0.45**, **10.0.42**).
* **ISO Creation**: The logic for creating ISOs was refined. The `--udf` flag was removed in favor of automatically detecting `genisoimage` vs. `xorriso` to handle large ISOs compatible with Windows tools like Rufus (**10.0.18**, **10.0.15**).
* **Code Cleanup**: A significant amount of old, unused code was removed, particularly code related to the initial plan of distributing `eggs` via npm packages (**9.8.2**).



# CHANGELOG.d
You can find old changelogs under [CHANGELOG.d](https://github.com/pieroproietti/penguins-eggs/tree/master/CHANGELOG.d).

# Help
Don't esitate to ask me for suggestions and help. I hope to receive [feedback](https://github.com/pieroproietti/penguins-eggs/issues).

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

# More informations
There is a [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide) and same other documentation - mostly for developers - on the repository [penguins-eggs](https://github.com/pieroproietti/penguins-eggs) under [DOCUMENTATION](https://github.com/pieroproietti/penguins-eggs/tree/master/DOCUMENTATION). I want to point out [hens, differents species](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/hens-different-species.md) a brief how to use eggs in Debian. Arch and Manjaro, and the post [Arch-naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html) on the blog which describes how to create an Arch naked live, install it, then dress the resulting system with a graphics development station.

You can contact me by [mail](mailto://pieroproietti@gmail.com) or follow me on 
[blog](https://penguins-eggs.net), 
[facebook](https://www.facebook.com/groups/128861437762355/), 
[mastodom](https://social.treehouse.systems/@artisan),
[github](https://github.com/pieroproietti/penguins-krill), 
[jtsi](https://meet.jit.si/PenguinsEggsMeeting), 
[reddit](https://www.reddit.com/user/Artisan61), 
[telegram](https://t.me/penguins_eggs), 
[twitter](https://twitter.com/pieroproietti).



# Copyright and licenses
Copyright (c) 2017, 2025 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.