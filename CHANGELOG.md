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

# Changelog
Versions are listed on reverse order, the first is the last one.

## penguins-eggs_25.7.7-1
I decided to switch to a version number based on year, month, day, and release number. I hope it will be more clear and useful. Based on that, our first actuale release is named penguins-eggs_25.7.7-0.

These days I have been doing a lot of work on remote installation via PXE, on some long neglected distributions: alpine, opensuse, etc. This is the current situation:

* alpine: remaster OK, installation CLI ok, calamares no, PXE boot
* arch: remaster OK, installation CLI ok, calamares ok, PXE boot
* debian: remaster OK, installation CLI ok, calamares ok, PXE boot
* fedora: remaster OK, installation CLI ok, calamares ko, PXE boot
* opensuse: remaster OK, installation CLI ok, calamares ko, PXE boot

## Here is a summary of the changes for the provided versions of penguins-eggs.

# Summary of Penguins-Eggs Changelog

This summary categorizes the updates into major features, expanded distribution support, installer improvements, and other key refinements to provide a clear overview of the project's progress.

***

## 🚀 Major Features & Enhancements

* **AI-Powered Refactoring**: In version **10.1.1**, the developer began using AI for intensive code refactoring, significantly speeding up development and improving code quality.
* **New `pods` Command**: Version **10.1.0-2** introduced the experimental `eggs pods` command, which allows users to create minimal live ISO images directly from `podman` containers.
* **Container-Based Builds**: A major "underground" change in version **10.1.0-1** enabled building live images of one distribution on a host system running a different one (e.g., creating an Arch Linux image on a Debian system).
* **New GUI `eggsmaker`**: A new, usable graphical user interface called **eggsmaker** was introduced in version **10.0.61**, making the tool more accessible to users who prefer a GUI.
* **Installation Modes**: The installation options were simplified in version **10.0.60**. The LVM2 mode was removed, leaving three primary modes: **Erase disk**, **Erase disk/Encrypted**, and **Replace partition**.
* **Secure Boot Support**: Work was done in version **10.0.59** to enable ISOs to boot with Secure Boot enabled on UEFI systems, with success on Debian Bookworm and a manual workaround for Ubuntu.

***

## 🌐 Expanded Distribution Support

The project has significantly broadened its compatibility across different Linux families.

* **RPM-Based Distros**: A major breakthrough in version **10.0.54** enabled the creation of bootable UEFI ISO images for **Fedora**, **AlmaLinux**, **RockyLinux**, and **openSUSE**. Fedora support was a major focus in version **10.0.36**.
* **Alpine Linux**: Support for **Alpine Linux** was reintroduced and improved across several versions, including the creation of Calamares packages, fixes for the `krill` installer, and a more streamlined live boot process (**10.1.1-26**, **10.0.34**, **10.0.25**).
* **Arch Linux**: Btrfs support was improved, and a new Calamares package was aligned with the latest release (**10.1.1-26**, **10.0.46**).
* **Newer Releases**: Support was added for recent distribution releases, including **LMDE 7 (Gigi)**, **Linux Mint 22.2 (Zara)**, **Ubuntu Noble**, and **Devuan Excalibur** (**10.1.1-26**, **10.0.42**, **10.0.14**).
* **Other Distros**: Efforts were made to add support for **openmamba**, **VoidLinux**, and **ALDOS** (**10.0.51**).

***

## 🛠️ Installer Improvements (Krill & Calamares)

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

## ✨ Other Key Changes & Refinements

* **Development & Packaging**: The project's build system was modernized to support both CommonJS and ECMAScript modules. The official package name was changed from `eggs` to **`penguins-eggs`** to reflect this major update (**10.0.0**, **9.8.0**).
* **Dependency Management**: Unnecessary dependencies like `lsb_release`, `pxelinux`, and `isolinux` were removed to streamline the tool (**10.0.57**, **10.0.45**, **10.0.42**).
* **ISO Creation**: The logic for creating ISOs was refined. The `--udf` flag was removed in favor of automatically detecting `genisoimage` vs. `xorriso` to handle large ISOs compatible with Windows tools like Rufus (**10.0.18**, **10.0.15**).
* **Code Cleanup**: A significant amount of old, unused code was removed, particularly code related to the initial plan of distributing `eggs` via npm packages (**9.8.2**).


# changelog.d
Old changelogs are located on[changelog.d](https://github.com/pieroproietti/penguins-eggs/tree/master/changelog.d).

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