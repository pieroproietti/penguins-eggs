# README

# Penguin&#39;s eggs are generated and new birds are ready to fly...

[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![www](https://img.shields.io/badge/www-blog-cyan)](https://penguins-eggs.net)
[![telegram](https://img.shields.io/badge/telegram-group-cyan)](https://t.me/penguins_eggs)
[![basket](https://img.shields.io/badge/basket-naked-blue)](https://penguins-eggs.net/basket/)
[![gdrive](https://img.shields.io/badge/gdrive-all-blue)](https://drive.google.com/drive/folders/19fwjvsZiW0Dspu2Iq-fQN0J-PDbKBlYY)
[![sourceforge](https://img.shields.io/badge/sourceforge-all-blue)](https://sourceforge.net/projects/penguins-eggs/files/)
[![ver](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![Get it as AppImage](https://img.shields.io/badge/Get%20it%20as-AppImage-important.svg)](https://github.com/pieroproietti/penguins-eggs/releases)

<a href="https://drive.google.com/drive/folders/19fwjvsZiW0Dspu2Iq-fQN0J-PDbKBlYY">
  <img src="https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/assets/penguins-eggs-logo.png" width="280" height="300" alt="CD-ROM">
</a>

It took years of work to create the penguins-eggs, and I also incurred expenses
for renting the site and subscribing to Google Gemini, for the artificial
intelligence that is now indispensable.

[![donate](https://img.shields.io/badge/Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/penguinseggs)

## Index

<!-- toc -->
* [README](#readme)
* [Penguin&#39;s eggs are generated and new birds are ready to fly...](#penguin39s-eggs-are-generated-and-new-birds-are-ready-to-fly)
* [penguins-eggs](#penguins-eggs)
* [Installation](#installation)
* [Usage](#usage)
* [The Aviary: Tools & Terminology](#the-aviary-tools--terminology)
* [Supported Distributions](#supported-distributions)
* [Links & Documentation](#links--documentation)
* [Commands](#commands)
* [GUI](#gui)
* [Book](#book)
* [Copyright and licenses](#copyright-and-licenses)
<!-- tocstop -->

## Links

- [Blog](https://penguins-eggs.net/blog)
- [Cook eggs in 5 minutes!](https://penguins-eggs.net/docs/Tutorial/eggs5)
- [Users guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
- [Wardrobe users' guide](https://penguins-eggs.net/docs/Tutorial/wardrobe-users-guide)
- [FAQ](https://penguins-eggs.net/docs/faq)
- [Changelog](https://github.com/pieroproietti/penguins-eggs/blob/master/CHANGELOG.md#changelog)

# penguins-eggs

**penguins-eggs** (or simply `eggs`) is a console tool that allows you to
remaster your system and redistribute it as live images on USB sticks or via
PXE.

Think of it as a way to "hatch" a new system from an existing one. It is a
system cloning and distribution remastering tool primarily designed for Linux.
It allows users to create customized live ISO images or backups of a Linux
system, replicating the setup easily.

### Key Capabilities

- **Distribution Remastering:** Craft your own Linux distro (or a spin of an
  existing one). Tweak an existing system, strip or add components, and package
  it as a new ISO.
- **System Backup & Cloning:** Create a snapshot of your current system,
  including installed packages and configurations.
- **Distro-Agnostic:** Works across **Debian, Devuan, Ubuntu, Arch, Fedora,
  AlmaLinux, Rocky, OpenSuSE, and Alpine**.
- **Multi-Architecture:** Debian/Ubuntu packages are relased for `i386`,
  `amd64`, `arm64` and `riscv64` (native recursive remastering).
- **Fast & Efficient:** Leverages OverlayFS to avoid physically copying the
  entire filesystem, combined with zstd compression (up to 10x faster).
- **Secure:** Supports LUKS encryption for user data within the ISO.

---

# Installation

There are three main ways to install `eggs`. Choose the one that fits your
workflow.

### Method 1: The "Fresh Eggs" Script (Recommended)

This is the most practical way suitable for all
[supported distros](https://github.com/pieroproietti/fresh-eggs/blob/main/SUPPORTED-DISTROS.md).
It automatically configures necessary repositories (like NodeSource) and
installs dependencies.

```bash
git clone [https://github.com/pieroproietti/fresh-eggs](https://github.com/pieroproietti/fresh-eggs)
cd fresh-eggs
sudo ./fresh-eggs.sh
```

### Method 2: AppImage (Universal)

Download the latest AppImage from
[Releases](https://github.com/pieroproietti/penguins-eggs/releases).

**Prerequisites:** Depending on your distro, you may need FUSE:

- **Debian/Ubuntu:** `sudo apt-get install fuse libfuse2`
- **Arch:** `sudo pacman -S fuse2`
- **Fedora:** `sudo dnf install fuse fuse-libs`

**Run:**

```bash
chmod +x penguins-eggs-*.AppImage
sudo ./penguins-eggs-*.AppImage
```

_The AppImage will automatically configure itself as `/usr/bin/eggs`._

### Method 3: Native Packages

If you prefer native package managers, specific repositories are available.

| Family            | Instructions                                                                                                                                                                                                        |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Debian/Ubuntu** | [Install Guide](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-DEBIAN-DEVUAN-UBUNTU.md) / [PPA Info](https://pieroproietti.github.io/penguins-eggs-ppa)                                    |
| **Arch/Manjaro**  | Available in **AUR** and **Manjaro Community**. Use `yay penguins-eggs` or `pamac install penguins-eggs`.                                                                                                           |
| **Fedora/RHEL**   | [Fedora Guide](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-FEDORA.md) / [Enterprise Linux](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-ENTERPRISE-LINUX.md) |
| **Alpine**        | Available in the [penguins-alpine](https://github.com/pieroproietti/penguins-alpine) repo.                                                                                                                          |

---

# Usage

Once installed, simply run `eggs` to see the available commands.

### Basic: Create a Clean ISO

This creates a distributable live ISO _without_ user data. Perfect for sharing
your custom distro.

```bash
sudo eggs produce
```

### Cloning: Backup Your System

To keep your user data, configurations, and files:

| Goal                | Command                    | Description                                              |
| :------------------ | :------------------------- | :------------------------------------------------------- |
| **Standard Clone**  | `eggs produce --clone`     | Copies user data unencrypted. **Do not share publicly.** |
| **Home Encryption** | `eggs produce --homecrypt` | Encrypts `/home` data inside the ISO using LUKS.         |
| **Full Encryption** | `eggs produce --fullcrypt` | Encrypts the entire system (Debian/Devuan only).         |

### Compression Options

- `--pendrive`: Optimized for USBs (zstd level 15).
- `--standard`: Uses `xz` compression.
- `--max`: Maximum compression (`xz -Xbcj`).

---

# The Aviary: Tools & Terminology

`penguins-eggs` uses a bird-themed naming convention for its internal tools:

- **Wardrobe:** A tool to organize customizations, scripts, and themes. It
  allows you to switch between configurations (e.g., from a bare CLI system to a
  full GUI). See
  [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe).
- **Cuckoo:** A PXE boot server feature. It allows you to boot your generated
  ISO on other computers over the local network without needing a USB drive.
- **Yolk:** A local repository bundled inside the ISO containing essential
  packages, allowing offline installation.
- **Krill:** The internal CLI/TUI system installer. Essential for server
  installs or when no GUI is available.
- **Calamares:** The industry-standard GUI installer, automatically configured
  by `eggs` for desktop environments.
- **Mom & Dad:**
  - `eggs mom`: Interactive help and documentation assistant.
  - `eggs dad`: Configuration wizard. Run `sudo eggs dad -d` to reset
    configuration.

---

# Supported Distributions

`eggs` is designed to be distro-agnostic. It respects the original package
manager and repository lists.

- **Debian Family:** Debian, Devuan, Ubuntu, Linux Mint, Kali, KDE Neon,
  Pop!_OS.
- **Arch Family:** Arch Linux, Manjaro, Biglinux, EndeavourOS, Garuda.
- **RPM Family:** Fedora, AlmaLinux, Rocky Linux, OpenSUSE.
- **Others:** Alpine Linux.

> [!NOTE]
> For a complete and updated list, please consult
> [SUPPORTED-DISTROS](https://github.com/pieroproietti/fresh-eggs/blob/main/SUPPORTED-DISTROS.md).

---

# Links & Documentation

- **Official Website:** [penguins-eggs.net](https://penguins-eggs.net)
- **Blog & News:**
  [The Triple Somersault](https://penguins-eggs.net/blog/triple-somersault)
- **SourceForge ISOs:**
  [Download Examples](https://sourceforge.net/projects/penguins-eggs/files/ISOS/)
- **User Guide:**
  [Wardrobe User Guide](https://penguins-eggs.net/docs/Tutorial/wardrobe-users-guide)

# Commands

<!-- commands -->
* [`eggs autocomplete [SHELL]`](#eggs-autocomplete-shell)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs version`](#eggs-version)

## `eggs autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ eggs autocomplete [SHELL] [-r]

ARGUMENTS
  [SHELL]  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ eggs autocomplete

  $ eggs autocomplete bash

  $ eggs autocomplete zsh

  $ eggs autocomplete powershell

  $ eggs autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.2.40/src/commands/autocomplete/index.ts)_

## `eggs help [COMMAND]`

Display help for eggs.

```
USAGE
  $ eggs help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for eggs.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.37/src/commands/help.ts)_

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

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v2.2.36/src/commands/version.ts)_
<!-- commandsstop -->

# GUI

There are two GUIs for penguins-eggs at the moment: eggsmaker and penGUI.

## eggsmaker

### A project by [Jorge Luis Endres](https://github.com/jlendres/eggsmaker).

![eggsmaker](https://github.com/jlendres/eggsmaker/raw/main/images/eggsmaker-running.png)

eggsmaker is a graphical interface for penguins-eggs.

Written by my friend Jorge Luis Endres, it is essential and functional. It
doesn’t cover all the possibilities of penguins-eggs, but in the end, a GUI
should be simple and intuitive.

I like it, I hope you like it too, and I thank Jorge for his daring.

eggsmaker packages are available on
[Jorge gdrive](https://drive.google.com/drive/folders/1hK8OB3e5sM2M9Z_vy1uR3_X7gPdNFYdO).

# Book

My friend [Hosein Seilany](https://predator-store.com/about-us/) founder of
[predator-os](https://predator-os.ir/), has written a book on Penguins's eggs,
with my partecipation. It's a remarkable work - even in size and weight - so
it's a great honor to
[announce](https://predator-store.com/product/penguins-eggs-tool) it here!

[![book](https://predator-store.com/wp-content/uploads/2025/05/final1-copy-2-1450x2048.jpg?raw=true)](https://predator-store.com/product/penguins-eggs-tool/)

## That's all, Folks!

One of the standout features of Penguins Eggs' is its hassle-free setup. It
comes with all the necessary configurations, making it a convenient choice for
users. Just like in real life, the magic of Penguins Eggs' lies within - no
additional setup required!

## More Information

In addition to the official guide, there are other resources available for
Penguins Eggs' users, particularly developers. These resources can be found in
the [penguins-eggs repository](https://github.com/pieroproietti/penguins-eggs)
under the
[documents](https://github.com/pieroproietti/penguins-eggs/tree/master/documents)
section.

Some noteworthy documents include:

- [Hens: Different Species](https://github.com/pieroproietti/penguins-eggs/blob/master//hens-different-species.md):
  A brief guide on using Penguins Eggs' in Debian, Arch, and Manjaro.
- [Arch-naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html): A
  blog post detailing how to create an Arch naked live, install it, and
  customize the resulting system into a graphics development station.

If you have any questions or need further assistance, feel free to contact me
via email at pieroproietti@gmail.com. You can also stay updated by following my
[blog](https://penguins-eggs.net) or connecting with me on ,
[Telegram](https://t.me/penguins_eggs),
[Mastodom](https://social.treehouse.systems/@artisan),
[Facebook](https://www.facebook.com/groups/128861437762355/),
[GitHub](https://github.com/pieroproietti/penguins-krill),
[Jitsi](https://meet.jit.si/PenguinsEggsMeeting),
[Reddit](https://www.reddit.com/user/Artisan61) or
[Twitter](https://twitter.com/pieroproietti),
[Mastodom](https://social.treehouse.systems/@artisan).

## A word of thanks

- This README would not be so well cared for if not for the work of
  [Hosein Seilain](https://github.com/hosseinseilani) who spent his time
  revising and supplementing the text;
- The eggs icon was designed by
  [Charlie Martinez](https://github.com/quirinux-so);
- and a word of thanks to all of you who are using it and providing feedback and
  motivation to continue it.

Thank you!

## Star History

This project collects stars, look to the sky... contribute!

[![Star History Chart](https://api.star-history.com/svg?repos=pieroproietti/penguins-eggs&type=Date)](https://star-history.com/#pieroproietti/penguins-eggs&Date)

# Copyright and licenses

Copyright (c) 2017, 2026
[Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under
the MIT or GPL Version 2 licenses.
