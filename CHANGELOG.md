# CHANGELOG
## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![www](https://img.shields.io/badge/www-blog-cyan)](https://penguins-eggs.net)
[![telegram](https://img.shields.io/badge/telegram-group-cyan)](https://t.me/penguins_eggs)
[![basket](https://img.shields.io/badge/basket-packages-blue)](https://penguins-eggs.net/basket/)
[![drive](https://img.shields.io/badge/drive-isos-blue)](https://penguins-eggs.net/drive)
[![sourceforge](https://img.shields.io/badge/sourceforge-all-blue)](https://sourgeforge.net/project/penguins-eggs)
[![ver](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![Get it as AppImage](https://img.shields.io/badge/Get%20it%20as-AppImage-important.svg)](https://github.com/pieroproietti/penguins-eggs/releases)

<a href="https://drive.google.com/drive/folders/19fwjvsZiW0Dspu2Iq-fQN0J-PDbKBlYY">
  <img src="https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/images/penguins-eggs-300x300.png" width="280" height="300" alt="CD-ROM">
</a>

It took years of work to create the penguins-eggs, and I also incurred expenses for renting the site and subscribing to Google Gemini, for the artificial intelligence that is now indispensable.

[![donate](https://img.shields.io/badge/Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/penguinseggs)

# CHANGELOG
The version is based on the year, month, day, and release number. They are listed in reverse order, with the first being the most recent.

# v26.1.24
* **Snap**: Resolved compatibility issues with snap applications;
* **Manjaro/Arch**: Fixed package creation workflow;
* **AppImage**: Added check for Node.js version;
* **Debian**: Enforced dependency on Node.js >= 22.

# v26.1.21
* **Refactoring nest**: `iso` directory was moved inside `mnt/iso` to free more space for remastering, (look [here](https://github.com/pieroproietti/penguins-eggs/blob/master/conf/README.md));
* **Refactoring**: Use `path.join` for safer path concatenation in `src/classes/incubation/installer.ts`;

# v26.1.20
This is the first version of penguins-eggs heavily modified with [Google Antigravity](https://gemini.google/antigravity).
* **Refactoring nest**: Major cleanup of the working directory structure. Renamed hidden directories `.mnt` to `mnt` as mount point for addictional space, moved `.mnt/filesystem.squashfs` to `liveroot`, move `./mnt/iso` to `iso`, renamed `ovarium` to `bin`, removed previous symlinks (look [here](https://github.com/pieroproietti/penguins-eggs/blob/master/conf/README.md));
* **Core**: General dependency updates, ESM improvements, and internal refactoring (`dotMnt` -> `mnt`, `dotLiveFs` -> `liveRoot`, `xorriso` fixes).
* **Cleanup**: Removed unused variables `machine_id` and `pmount_fixed` from `eggs.yaml` and internal structures.
* **LightDM**: Restored autologin functionality for live sessions by ensuring correct `autologin-user` configuration in `lightdm.conf`;
* **UX/UI**: Refactored interactive prompts (Krill, confirmations) to use `@inquirer/prompts`, allowing arrow key navigation;
* **CachyOS**: Fixed boot issues related to disk detection and corrected initrd configuration;
* **Full-Crypt**: Fixed `mkinitramfs` failure during full-encrypted ISO generation;

# v26.1.15
* added Parrot 7.0 (echo) on [`derivarives.yaml`](./conf/derivatives.yaml);
* uniformated all the extensions of YAML files to `.yaml`
* uniformated all the extensions of YAML files to `.yaml` on [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe).

# v26.1.11
## New Features & Architecture Support:

- **RISC-V Native Support**: Full recursive remastering capability on riscv64.

- **Ubuntu Resolute (26.04) Ready**: Verified support for the upcoming Ubuntu LTS on RISC-V.

- **Smart Kernel Detection**: Implemented logic to automatically detect compressed (vmlinuz, Ubuntu-style) vs uncompressed (vmlinux, Debian-style) kernels in the generated ISO. No more manual GRUB edits needed.

Fixes:

- **GRUB/UEFI**: Fixed bootloader path issues on RISC-V boards and QEMU. Now correctly installs to the fallback path (/EFI/BOOT/BOOTRISCV64.EFI) ensuring bootability on generic UEFI implementations (U-Boot).

- **Krill Installer**: Solved ENOENT issues for sudoers configuration on minimal systems.

# v26.1.9
feat: add native support for RISC-V UEFI installation and fix sudoers creation

- Bootloader: Added detection for `riscv64` architecture in the installation sequence.
- Bootloader: Implemented `--removable` flag for `grub-install` on RISC-V targets. This ensures the bootloader is written to the default fallback path (/EFI/BOOT/BOOTRISCV64.EFI), fixing boot issues on QEMU and boards without persistent NVRAM.
- Sudoers: Fixed `ENOENT` error during `99-eggs-calamares` creation. The code now checks and recursively creates the `/etc/sudoers.d/` directory if it is missing on minimal systems.

Look this [article](https://penguins-eggs.net/blog/the-recursive-egg-native-and-bootable-remastering-on-risc-v.md) on penguins-eggs.net.

# v26.1.8
## 🚀 New Features & Improvements

### 🦒 RISC-V Support (Experimental)
This release marks a significant milestone: **penguins-eggs now successfully builds and boots live systems on RISC-V (riscv64)!**
tested on QEMU with Debian `sid`/`trixie`.

* **Kernel Handling:** Added smart detection for uncompressed kernels (`vmlinux`), which are standard in many RISC-V boot scenarios, alongside the traditional `vmlinuz`.
* **Cross-Build Masquerading:** Improved `uname` spoofing detection allowing seamless ISO creation for RISC-V from x86_64 hosts (via QEMU user static).

### 🛠️ Core Fixes

* **Usr Merge Compatibility (The "Golden Fix"):**
    * Fixed a critical issue where the live filesystem layout caused Kernel Panics (`Attempted to kill init`) on modern Debian bases (Bookworm+).
    * The build process now forcibly ensures the correct creation of `Usr Merge` symbolic links (`/bin`, `/sbin`, `/lib` → `/usr/...`) within the squashfs, ensuring `systemd` and `init` are correctly located by the kernel.
    * Updated `uBindLiveFs` to intelligently handle cleanup of custom-created links that might not exist on the host system.

### 🐧 Naked / Server Edition
* Confirmed successful boot to login prompt on `naked` (CLI) editions for RISC-V. GUI editions are next!

# v26.1.3

### Added
* **Experimental RISC-V support** (riscv64): We can now build native packages for the RISC-V architecture.
* **Tested on Ubuntu Noble** (riscv64) using a chroot environment on a Debian Trixie workstation.
* **Warning**: This is highly experimental. The .deb package is created successfully, but we haven't tested if it actually boots or runs on real hardware yet.

### Fixed
* **Export filters refactoring:** Fixed a bug in export:pkg that caused exports to fail during months or days with a single digit (e.g., January 4th).
* **Improved globbing patterns (+([0-9.]))** for all distributions (Debian, Arch, Manjaro, Fedora, Alpine, Opensuse, etc).

# v25.12.22-1
## Fixed
**Live User Autologin**: Resolved an issue preventing automatic login for the live user on POP_OS Noble COSMIC. The environment now correctly initializes the graphical session without requiring manual credentials.

## Known Issues & Workarounds
**AppImage**: On pop_up! cosmic AppImage is not working, use native package.

**Calamares Installer Compatibility**: Identified a critical bug where Calamares fails to detect storage devices (reporting 0 devices detected). This is due to a conflict between the KPMCore backend and the Wayland security protocols/runtime directory permissions in the COSMIC desktop environment.

**Symptoms**: Calamares recognizes partitions via blkid but labels them as "unsuitable," preventing installation.

**Solution**: Calamares has been deprecated for this release. Please use Krill (the CLI-based installer) for a reliable installation experience.

**Recommended Installation Method**

Switch to Krill: Users should now use the Krill installer, which bypasses Wayland graphical restrictions by operating directly through the terminal.

How to run: Open the terminal and execute:
```
sudo eggs krill
```
# v25.12.16-6
- **Improved Live Access**: Added auto-login functionality for live sessions as default to provide a seamless user experience.
- **just a fix on RHEL**. Thanks to [davidlevenstein](https://github.com/davidlevenstein).
- **Fixed Calamares launching**: on Wayland (Pop!_OS 24.04). Replaced pkexec with a custom sudo -E wrapper and added specific SETENV sudoers rules to correctly handle graphical display permissions in live sessions.
- **krill**: the correspondence between ‘what is your name’ assigned to fullname and ‘what name do you want to use to log in’ assigned to username has been resolved.
- **Password consistency fix**: tesolved an issue where the root and live user passwords in the live environment did not match the values set in /etc/penguins-eggs.d/eggs.yaml.
- **krill** improved detection of disks suitable for installation on physical hardware;
- **devuan**: finally `sysvinit` has also been configured to allow ISO production with `--homecrypt`;
- **krill**: added routine to remove the --homecrypt configuration on the installed system.

Currently, clones encrypted with the `--homecrypt` option can only be reinstalled with `eggs krill`, while clones created with `--fullcrypt` can only be reinstalled with calamares.

# v25.12.15
With some reluctance, I am releasing a new version, which is important for a number of reasons mainly related to `--homecrypt` and `--fullcrypt`, where I have completely recalculated the size of the encrypted partitions and moved their creation from /tmp to /var/tmp to avoid the 2 GB limit. A problem with `eggs dad` has also been fixed, which did not save all the data completely.

Consider `--fullcrypt` and `--homecrypt` still in development. Feel free to use them to securely “carry around” all your data, but don't consider them a backup tool yet: `--fullscript` can be reinstalled with calamares, but not with krill, while the exact opposite is true for `--homecrypt`, reinstall it with krill.

Please excuse me, eggs is running away everywhere, rebelling against its author. I will have to try to resize it a bit to make it more manageable on the developer side.

# v25.12.8
- **Smart Shrinking for LUKS**: Implemented a "shrink phase" for `home.img` creation. The system now allocates a 
  generous container, fills it with data, minimizes the internal filesystem using `resize2fs -M`, and finally truncates the image file to the exact size required (plus a safety margin). This guarantees the smallest possible ISO size for encrypted clones;

- **CLI Login with Homecrypt**: Currently, logging into CLI-only systems (headless/server) generated with `--homecrypt` fails, whereas Desktop environments work perfectly. I am aware of this limitation and promise to investigate and address it in future releases.

 
# v25.12.7
* Refactored for AppImage compatibility: Completely removed the shelljs dependency and ensured all external calls are purged of AppImage environment variables;
* Reintroduced `--fullcrypt`: This option is now enabled exclusively for native installations on Debian Trixie or Devuan Excalibur;
* Reintroduced `--homecrypt`: Unlike `--fullcrypt`, this option is available for use on AppImages and across other distributions.

# v25.12.3
This release introduces a direct user provisioning strategy, replacing high-level commands with direct manipulation of system database files (`/etc/passwd`, `/etc/shadow`) to ensure deterministic and host-independent user creation. We resolved critical boot freezes on Devuan (SysVinit) by hardening init scripts against race conditions and implementing self-healing for dbus and machine-id. Fedora 43 (Rawhide) compatibility has also been verified.

**IMPORTANT**: For Devuan and Fedora 43, usage of native packages (.deb/.rpm) is strongly recommended to avoid AppImage environment leakage. If using AppImage on Fedora, setting enforcing=0 may be required during the build.

## v25.11.29
I am continuing the transition to adopting AppImages as the standard release method for penguins-eggs.

The reason is simple: a single package works for everything, and using native meta-packages within the AppImage for dependencies we work always with original packages on every distro.

I have tested it extensively on Arch, Debian, Fedora, Manjaro, and Opesuse, leaving out Alpine for the moment, which has some peculiarities.

I also tested AppImage for the `eggs cuckoo` command. It works great on Debian, the same cannot be said for the other distributions. We'll just have to live with that for now.

I decided to remove the label “AppImage” from the AppImage version and introduced a new label “native” next to the version for the native packages (the traditional one), to highlight that we will continue along this path.

The installation and updating of AppImage has been improved. Just download it from GitHub and run it with sudo. The executable is copied to `/usr/bin/eggs` and is automatically configured. 

After that, just type: `eggs love` to get the ISO of the installed system.

The AppImage is updated with the command: `sudo eggs update`. just select internet and the latest release available on GitHub will be downloaded and installed.

The AppImage must be removed using the command: `sudo eggs setup remove`, which will remove all dependencies, the manual page, desktop icon and autocomplete.

Manuals and information would need to be rewritten, but fortunately the README.md, autocompletion (bash and zsh) and eggs man page are constantly updated.


## v25.11.27
I spent a couple of days trying to create an even more generic appimage, using Debian bookwork and trixie bootloaders as a basis. The result was far from satisfactory, with long AppImage build times and limited portability: specifically, it worked on Debian and Arch, but I couldn't get it to work on Fedora and Opensuse.

At this point, I realized that the method for obtaining a lightweight and portable AppImage was precisely this: put the bare minimum in the AppImage—nodejs—and delegate the installation/removal of dependencies to native meta-packages.

This way, you get the best of both worlds.


## v25.11.24
* on the command: `sudo eggs setup`, I corrected the abbreviations for the flags `--install` and `--uninstall` to `-i` and `-u`, respectively;
* added Linuxmint 22.3 code name zena. Thanks to [@rreyn331](https://github.com/rreyn331);
* I modified `penguins-eggs-deps.spec` - for creating rpm meta-packages for Fedora, El9, and Opensuse. Opensuse slowroll, in the latest installed version, only uses `sshfs` and no longer `fuse-sshfs`. There was also a duplication, as the dependency for `nodejs`, which is not necessary for AppImage, had been left by mistake;
* all official ISOs have been updated and created with the AppImage version. I would say that the experiment on the possibility of AppImage has been amply demonstrated, and therefore I will continue along this path.
* added the release number to the appimage in addition to the version number, so today's version will be `penguins-eggs-25.11.24-1-x86_64.AppImage`. This gives me more freedom, as I often notice an error immediately after publication. This way, I can correct it by simply changing the release number;
* while rebuilding all naked and colibri ISOs for ALL supported distributions, I encountered a problem in Devuan excalibut: I cannot boot the generated ISO. It freezes when starting dbus. As always in my Devuan naked images, I chose `sysvinit`. I tried modifying `/src/classes/ovary.d/edit-live-fs.ts` to remove `/etc/machine-id` and `/var/lib/dbus/machine-id`, but so far without success. 

## v25.11.23
I have introduced dependency management in the AppImage version using native meta-packages for each supported distribution. This resolves any incompatibilities at the root and has the advantage of allowing easy removal of dependencies installed by penguins-eggs AppImage, without the risk of removing pre-existing packages.

Essentially, at this point, using native penguins-eggs or penguins-eggs AppImage should give exactly the same results and behave in exactly the same way.

The meta-packages incorporated into the AppImage were built on specific distributions, while my tests - so far - are mainly related to Debian and - in particular - to the trixie version, but it should reasonably apply to all supported distributions. 

Conceptually, I am even thinking of discontinuing the native packages altogether and releasing only the AppImage for all distributions, then perhaps trying to extend support to others.

However, proving this takes time, so I am relying heavily on your opinions and the results of your suggestions.

## v25.11.22
Minor tweaks to the sudo eggs setup command, with the definition of two new flags: --install and --uninstall, necessary for installing and removing the AppImage, autocomplete scripts, and the egs man page.

## v25.11.21
Starting with this version, penguins-eggs is also released as an AppImage in addition to being a native package for various distributions.

The source is the same, as are the features. I had to add a new `setup` command that is only used for the AppImage version and tweaked or removed other minor commands that are no longer used.

The AppImage is perfectly equivalent to the native package.

There is nothing particularly magical about this; I used a well-known technique and continue to use the package managers of the various distributions, but this will probably make it easier both to create your own packages and — for those who wish to do so — to extend penguins-eggs to make it compatible with other original distributions or even help create new ones.

### AppImage requisites
Before to try AppImage depending on your distro, you need this packages installed:
* Alpine: `sudo apk add fuse`
* Arch/Manjaro: `sudo pacman -S fuse2`
* Debian/Devuan/Ubuntu: `sudo apt-get install fuse libfuse2`
* Fedora/RHEL: `sudo dnf install fuse fuse-libs`
* Opensuse: `sudo zypper install fuse fuse-libs`

### AppImage installation
penguins-eggs as an AppImage, it can be installed on all supported distributions. Download it from https://github.com/pieroproietti/penguins-eggs/releases, then run the following commands:
```
$ chmod +x penguins-eggs-25.11.21-x86_64.AppImage
$ sudo mv /usr/bin
$ sudo eggs setup
```

## v25.11.14
* Almalinux, Fedora, Opensuse, Rocky Linux: rewrote the code to add or remove the repository for pre-compiled penguins-eggs packages;
* Ubuntu focal and Ubuntu jammy goes back to calamares 3.2.x configuration;
* updated all the official ISOS (naked + colibri);
* Almalinux, Fedora, Opensuse, Rocky Linux re-configured for penguins-eggs-repos.

## v25.11.12
Testing, mainly restructuring and correction of the new CI for release (birthday edition).

## v25.11.10
Testing, mainly restructuring and correction of the new CI for release.

## v25.11.8
### Repository Update and Instructions
We have completed an important transition to improve the distribution and updating of penguins-eggs.

### New Unified Repository
All packages have been moved to our new centralized repository: https://penguins-eggs.net/repos/

This change simplifies maintenance and ensures faster and more reliable access to new versions for all supported distributions.

### Simplified Repository Add Command
To facilitate the transition to the new repository (and for new installations), we have introduced a new command:
```
sudo eggs tools repo --add
```
This command automatically detects your distribution (Debian, Ubuntu, Arch, Manjaro, Fedora, etc.) and adds the correct repository to your package manager configuration (apt, pacman, dnf).

### Updated Instructions
As a result, the official installation and update instructions on our website and in the documentation have been updated to reflect this new method. 

### What to do:

**For new users**: Follow the updated instructions on the website, which now use the commands ```eggs tools repo --add``` and ```eggs tools repo --remove```.

**For existing users**: We recommend running ```sudo eggs tools repo --add``` to ensure you are connected to the new repository and will receive future updates. You may need to manually remove old repository entries (e.g., the old PPA or GitHub entries).

### Important for Arch, Manjaro and Manjaro derivatives (BigLinux/BigCommunity)
In addition to our official repository, penguins-eggs will continue to be **available** in [Chaotic-AUR](https://aur.chaotic.cx/) and [Manjaro](https://manjaro.org/).

## v25.11.4
* penguins-eggs now depends on the polkit (pkexec|policykit-1 on Debian/Ubuntu) to allow GUI installation without using a password.
* alpine: it has been realigned with the mainstream distribution of penguins-eggs with changes both within the penguins-eggs package and in the penguins-alpine repository specific to the distribution;
* ubuntu focal/ubuntu jammy:  thanks also to the suggestion of [Cuphead74832](https://github.com/Cuphead74832), both version 20.04 (focal) and version 22.04 (jammy) are available again. I also updated the nodejs version on fresh-eggs from nodejs18 to nodejs20. I was also able to remove a bunch of specific code, using the version written for Ubuntu Noble;
* linuxmint: It should be noted that the reintroduction of compatibility for Ubuntu focal and Ubuntu jammy also ensures renewed compatibility for many derivatives and, specifically, many versions of Linuxmint.
* * Ubuntu questing: thanks to the interest of [Lew-Rockwell-Fan](https://github.com/Lew-Rockwell-Fan), I finally got my hands on Ubuntu 25.10. It was bound to happen sooner or later, but it served as a stimulus and advice.

## v25.10.30
* a new dependency on the `polkit` package has been introduced for all distributions;
* calamares launcher has been adapted to use `pkexec` without requiring a password on live;
* removed previous workaround in `/etc/sudoers.d/calamares`, no need more.

## v25.10.28
* remove all references on the generated ISO image whem produce take `--hidden` mode;
* always force `sector_size = 512` loop devices compatibility and limit;
* using `--homecrypt` is now possible to build LUKS command interactively;
* removed suffix `btrfs-` from eggs standard denomination of ISOs;
- successfull tested on `biglinux_2025-10-27_k612.iso`, installing on BIOS/ext4.

## v25.10.26
* added default and interactive LUKS configuration.
* revision of procedure to produce homecrypt ISOs;

## v25.10.24
Review and check on `--fullcrypt` and `--homecrypt`, addition of the `--hidden` flag, and construction of a generic theme used when `--hidden` is passed.

## v25.10.23
The `--fullcrypt` option in eggs is now fully functional. It creates a fully encrypted image in the `/live/root.img` file, which is a LUKS-formatted volume that is opened at startup ONLY after the passphrase has been entered.

Once the passphrase has been entered and accepted, the ISO starts normally. Please note that the entire system image is allocated in RAM. Once the system has started, the boot device is no longer read.

The idea is that if you lose your USB stick or device, there is no way to trace the contents of the protected system inside it.

Please note that this option is only active for the Debian family (Debian, Devuan, Ubuntu, and derivatives) and - at the moment - successfully tested on Debian trixie,  should be used with caution.

## v25.10.22
Although the `--fullcrypt` option is not yet ready, it has been hard work that I hope will eventually be resolved—perhaps with some advice.

The current situation is this: after discarding the option of a `filesystem.squashfs` acting as a bootstrap for the encrypted system, I moved on to modifying the initramfs by injecting the necessary modules and scripts. Unfortunately - paradoxical but true — I got as far as starting plymouth, but then the system stopped.

At this point, I will make another attempt to finally get the encrypted system to boot, but without using live-boot. This will obviously require removing and modifying what has already been done, but it seems to be the only way forward.

## v25.10.19
The possibility of having encrypted ISOs has been introduced, in two versions:
* `eggs produce --homecrypt` or `eggs love --homecrypt` produces an ISO in which all the contents of `/home/` and user accounts are stored in a LUKS volume within the ISO image `/live/home.img`. If the LUKS passphrase is entered, the volume is mounted and users and data are available on the live system; otherwise, it functions as a standard live system without any user data.
* `eggs produce --fullcrypt` or `eggs love --fullcrypt` works in the same way, completely removing the `filesystem.squashfs`, which is placed in a LUKS volume of the ISO image called `/live/root.img`. This method ensures that ALL the contents of the system are encrypted. Unfortunately, at the moment, the `--fullcrypt` method is not usable, as 
I have not yet managed to fix the live boot issues (See [acqua](https://github.com/pieroproietti/acqua)).

Both homecrypt and rootcrypt have been tested exclusively on Debian Trixie.

## v25.10.9
* variation: `eggs tools ppa` becomes `eggs tools repo` and has also been added for Manjaro. In the future, we will also include it for Fedora, EL9, and Opensuse;
* Debian/Devuan/Ubuntu: [penguins-eggs-ppa](https://github.com/pieroproietti/penguins-eggs-ppa) is now deprecated in favor of [penguins-eggs-repo](https://github.com/pieroproietti/penguins-eggs-repo/deb), the command
`eggs repo --add/remove` installs/remove penguins-eggs repo and not more penguins-eggs-ppa;
* Arch: with the introduction of the penguins-eggs repo repository for Arch, the command `eggs repo --add/remove` installs/remove this one and no longer [chaoticAUR](https://aur.chaotic.cx/);
* Manjaro: although penguins-eggs is present in the Extra repository of the Manjaro distribution, the command `eggs repo --add/remove` enables or removes the penguins-eggs repo for Manjaro.


## v25.10.6
* same little adaptment for CachyOS;
* successfull tested on CachyOS, Linuxmint zara cinnamon and EndeavourOS.

## v25.10.4
* Ubuntu noble: calamares install on ext4, btrfs and LUKS;
* Fedora: calamares install on ext4, btrfs installation work but resulting system is not bootable (grub);
* Opensuse: install with krill. When compiling Calamares, partition and bootloader medules are not created, so Calamares remain unusable, is, however, present in our repository [penguins-eggs-repo](https://github.com/pieroproietti/penguins-eggs-repo/tree/main/rpm/opensuse/leap).
* Debian trixie: calamares install on ext4, btrfs on Debian trixie;
* Manjaro/Biglinux: calamares install on ext4 and on btrfs;
* Arch: calamares install on ext4, btrfs installation fail to bootloader installation, we will solve soon;
* Almalinux, Rocky 9: calamares is not available yet;
* Debian bookworm/Debian bullseye; calamares install on ex4. btrfs not available;


## v25.10.3
* Ubuntu noble: calamares install on ext4, btrfs and LUKS;
* Fedora: fail to install on bootloader;
* Opensuse: calamares is not configurated yet, but it's available in our [repo](https://github.com/pieroproietti/penguins-eggs-repo/tree/main/rpm/opensuse/leap);
* Debian trixie: calamares install on ext4, btrfs on Debian trixie;
* Manjaro/Biglinux: calamares install on ext4 and on btrfs;
* Arch: calamares install on ext4, btrfs installation fail to bootloader installation, we will solve soon;
* Almalinux, Rocky 9: calamares is not available yet;
* Debian bookworm/Debian bullseye; calamares install on ex4. btrfs not available;

I did tons of tests, but I'm just me and a machine (seven years old)... so, I think it's time to release trying to explicit problems.


## v25.9.27
- krill: added `--replace` to replace a partition with the new installation, usefull for peoples wit many installation on a disk. Eg: `sudo eggs install -R /dev/sda3 -u` 
- krill: revised the way LUKS encryption is created, now more standard. Eg: `ubuntu_root`, mappend on `/dev/mapper/ubuntu_root` for Ubuntu.
- calamares: bugfix on modules for arch. After the upgrade will be necessary to remove and recreate `/etc/penguins-eggs.d`;
- probably problems on on Manjaro/Biglinux will persist, use [v25.9.17](https://penguins-eggs.net/basket/index.php/packages/?p=packages%2Fmanjaro%2Fold&view=penguins-eggs-25.9.17-1-any.pkg.tar.zst) for now.

## v25.9.25
* fixed a bug regarding kernel name determination, which occurred in Arch Linux on installations using [systemd-boot](https://wiki.archlinux.org/title/Systemd-boot). issue: [629](https://github.com/pieroproietti/penguins-eggs/issues/629), thanks to [2kpr](https://github.com/2kpr) ;
* the command `eggs tools ppa` on Arch Linux now adds or removes the new repository `https://github.com/pieroproietti/penguins-eggs-repo`.

## v25.9.24
`calamares`: complete rewrite of the calamares/krill configuration for Ubuntu and Debian. It is now possible to perform encrypted installation correctly on both Ubuntu noble and Debian bookworm. On Debian trixe, however, we must wait for the next fixes.

## v25.9.18
Numerous corrections and improvements to the Calamares configuration for Ubuntu Noble and derivatives. 

Unfortunately, so far, I have not been able to resolve the issue of installing with Calamares on encrypted file systems; the problem persists: the installed system is unable to boot up.

Note: using `sudo eggs install`, it is possible to install on encrypted systems and boot up correctly

## v25.9.17
I am mainly consolidating the move to the new repositories specific to each supported distribution: [Debian/Devuan/Ubuntu](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-DEBIAN-DEVUAN-UBUNTU.md), [Fedora](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-FEDORA.md), [Enterprise Linux](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-ENTERPRISE-LINUX.md), [OpenSUSE](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-OPENSUSE.md).

On Manjaro, we are already on the **community repository** and hope to progress to the next stage. Alpine and Arch will be moved to the new repositories later, as will Openmamba. 

For a while I will continue to release on [penguins-eggs-ppa](https://github.com/pieroproietti/penguins-eggs-ppa) for Debian/Devuan/Ubuntu and on [Chaotic-AUR](https://aur.chaotic.cx/) for Arch and finally on [fresh-eggs](https://github.com/pieroproietti/fresh-eggs) for all.


## v25.9.14
Thanks to JT Burchett, I think we definitely solved the error:
```
Error: ENOENT: no such file or directory, stat '/filesystem.squashfs'
Code: ENOENT 
```
I never understood why this error occurred, even though users reported it to me several times. I generally thought it was a configuration error in the reporting system, but finally JT Burchett, whom I thank, suggested the reason to me.

I normally always use `eggs love` for my tests, often with the option `eggs love -n`, creating an ISO is more a way for me to test eggs than to actually create the ISO. but `eggs love` includes `eggs kill`, so I always started from a clean slate. 

The error occurs, however, when giving multiple consecutive `sudo eggs produce` commands.

### Changelog: Build & Distribution Infrastructure
This update overhauls the packaging process, moving from manual builds to a fully automated, secure, multi-distro CI/CD pipeline using GitHub Actions.

✨ Key Features & Improvements
1. Full Automation
Automated Builds: Dedicated workflows automatically build packages for RPM (Fedora, openSUSE, EL9), DEB (Debian/Ubuntu), and Arch Linux families.

Automated Publishing: Built packages are published to signed repositories hosted on GitHub Pages.

Safe Concurrent Deployments: Implemented a concurrency lock to prevent race conditions when deploying to the gh-pages branch.

2. Dynamic & Centralized Versioning
Single Source of Truth: package.json is now the sole source for the software version.

Dynamic Package Updates: Build files (.spec, PKGBUILD) are updated on-the-fly during the CI process, ensuring version consistency and reducing manual errors.

3. Signed Repositories for Enhanced Security
GPG Signing: All packages and repository metadata are now digitally signed, ensuring authenticity and integrity for end-users.

Secure CI Integration: The pipeline uses GitHub Secrets to handle GPG keys and passphrases securely in a non-interactive environment.

4. Structured Multi-Distro Support
RPM Repository: A full-featured, signed RPM repository is available, with packages organized by distribution and version (e.g., /rpm/fedora/42/).

DEB Repository: A standard, signed APT repository is available, following Debian conventions for maximum client compatibility.

**Try the new repos** for [Debian/Devuan/Ubuntu](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-DEBIAN-DEVUAN-UBUNTU.md), [Fedora](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-FEDORA.md), [Enterprise linux](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-ENTERPRISE-LINUX.md) and [OpenSUSE](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-OPENSUSE.md).

> [!NOTE]
> * Alpine, Arch, and Manjaro are not immediately transitioning to the new repositories.
> * changes and adjustments are expected in the coming days, but distribution via penguins-eggs-ppa, get-eggs, and aur will still be ensured.


## v25.9.8
* `eggs export pkg` fixed on Almalinux/Rocky;
* `eggs update` revision.
* removed old critery search initramfs;


## v25.9.7
* bugfix: Manjaro and derivatives initramfs find:
* import/export packages for all the distros ( this is only for developers);
* bugfix: installing penguins-eggs v25.9.6, on Devuan/Debian/Ubuntu results  on this error:
```
Configurazione di penguins-eggs (25.9.6-1)...
 ›   ModuleLoadError: [MODULE_NOT_FOUND] import() failed to load 
 ›   /usr/lib/penguins-eggs/dist/commands/config.js: Cannot find module 
 ›   '/usr/lib/penguins-eggs/dist/commands/config.js' imported from 
 ›   /usr/lib/penguins-eggs/node_modules/.pnpm/@oclif+core@4.5.2/node_modules/@
 ›   oclif/core/lib/module-loader.js
 ›   Code: MODULE_NOT_FOUND
dpkg: errore nell'elaborare il pacchetto penguins-eggs (--configure):
```
## v25.9.6 (deprecated)
* **Multi-distribution initramfs detection:** The logic for searching for the initramfs file has been made more robust and compatible. In addition to dynamic searching based on the kernel version, the static fallback system has been enhanced to recognize distribution-specific file naming conventions such as Arch and Alpine Linux.

## v25.9.5
* BUGFIX on krill: a typo om v25.9.4-1 - from yesterda - was instroduced. I realized that just this morning. krill was able to install on UEFI but became unable to install on BIOS. This version fix krill.

## v25.9.3-2 (amd64)
I introduced the new deb822 format for the penguins-eggs Personal Package Archive (penguins-eggs-ppa).

The deb822 format is the new standard for defining software repositories in Debian, Ubuntu, and derivative systems. It abandons the old single-line format in favor of a much more readable, structured, and error-prone “key-value” system.

Support for using the deb822 format for repository files (.sources) was added to APT in version 1.1, released in 2015. For almost a decade, the feature remained present but was never the default, used only by experienced users or for complex configurations.

**Adoption as Standard (2023-2025)**

Driven by the need to improve readability and security (particularly with the Signed-By option), the Ubuntu and Debian teams decided to make it the default format:

Ubuntu 23.04 began the transition, using it for PPAs.

Ubuntu 24.04 LTS and Debian 13 “Trixie” have adopted it as the standard for new installations, also introducing the apt modernize-sources command to facilitate migration.

## v25.9.3
* krill: this is a significant development; we can finally use krill: `sudo eggs install` to install on UEFI computers and VMs, not just BIOS ones. Tested on: Arch, Debian, Fedora, Manjaro, Openmamba, Opensuse, Rocky and Ubuntu,  remastered Alpine not work on UEFI, Almalinux to be tested;
* bionic: I had problem to release on Ubuntu bionic, same node modules updated breack compatibility with nodejs 16:

## v25.9.2
* krill: fixed user creation for openmamba:
* standardized display of:
  * copying the kernel to (ISO)/live;
  * creating initramfs on (ISO)/live;
  * creating grub.cfg seeker USB on (efi.img)/boot/grub;
  * creating grub.cfg bridge on main. (ISO)/boot/grub/{arch}-efi;
  * creation of grub.cfg seeker ISO/DVD on (ISO)/EFI/{distro} (*);
  * copy (efi.img) to (ISO)/boot/grub;
  * creation of grub.cfg main on (ISO)/boot/grub.

> (*) with the exception of Ubuntu and its derivatives, we use Debian bootloaders to boot live from ISO and via PXE, so it is correct to have `(ISO)/EFI/debian` on different distributions.

## v25.8.31 welcome back Openmamba!

[openmamba](https://openmamba.org/) is an Italian Linux distribution, which originated from [QiLinux](https://openmamba.org/it/), discontinued in 2007.

The author and maintainer: Silvan Calarco, performs the vast majority of updates. It can be installed on i386, x86_64, and arm64 computers or SBCs.

In short, there is an incredible amount of work behind it and a lot of history behind it and... ahead of it. Yes, because it is still constantly updated, not for nothing is it a rolling release and supports version 6 of KDE and LXQT.

* krill: in the generation of the command: grub-install in krill, I introduced the value `--target=<PLATFORM>`, previously omitted;

## penguins-eggs_25.8.28
Another round on the merry-go-round: the ISO boot mechanism has been modified again.
* boot and install with Secure Boot enabled on Debian (trixie, bookworm, bullseye), Devuan and Ubuntu and derivatives;
* You must disable Secure Boot for Almalinux, Alpine, Arch, Fedora, Manjaro, OpenSuse;

## penguins-eggs_25.8.23
Finally, remastering Debian trixie, resulting ISO will boot on UEFI and will be correctly installed using calamares, but you need to DISABLE Secure Boot.

We need to discover more, about this annoying problem. I'm releasing again, becouse need feedback.

## penguins-eggs_25.8.22
* changed the way the image ISO is generated, priority now is xorriso. Only if xorriso is not installed will try genisoimage;
* added Debian 14 forky;
* updated modules;
* work in progress...

> [!NOTE]
> This version on Debian trixie will boot on UEFI, but will not correctly installed using calamares on Debian trixie. 

## penguins-eggs_25.8.10 (San Lorenzo edition)

I have recreated the packages for i386, amd64, and arm64 for Devuan/Debian/Ubuntu distributions and derivatives.

We will continue to use Debian bootloaders to boot the other supported distributions: Alpine, Arch, Fedora, Manjaro, OpenSUSE, Rocky, and Ubuntu. The bootloaders will be collected in a `/bootloaders` folder under penguins-eggs, and will be created from the specific `bootloaders.tag.gz` associated with the current release.

The good news is that I did a complete overhaul of the make-efi.ts and xorriso-command.ts code, including restoring support for arm64 and i386.

The arm64 package need to be tested -  I have no way actually - so please test it and send me feedback.

* `.disk/info` reflect now volid, to support Debian live-boot scripts, which rely on finding the correct Volume ID for device verification;
* introduced a `.disk/README.md` for general informations about the ISO and the tool used.

## penguins-eggs_25.8.6
I spent most of my time compiling a list of [supported distributions](https://github.com/pieroproietti/fresh-eggs/blob/main/SUPPORTED-DISTROS.md), which was a huge task, and I'm only halfway through the 100 distributions I need to test. On the other hand, this experience forced me to review the derivatives.yaml file and make some additions.

I am also considering restoring the package for arm84 and, perhaps, i386, which I had to remove due to the decision to simplify bootloader management, but this step requires time and thought, so we will postpone it until September.

## penguins-eggs_25.7.30
During this time I did a great work on [fresh-eggs](https://github.com/pieroproietti/fresh-eggs) completely rewritten and adding an usefull [SUPPORTED-DISTROS](https://github.com/pieroproietti/fresh-eggs/blob/main/SUPPORTED-DISTROS.md) list. In addiction, same fixes and improvment on penguins-eggs:
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
Copyright (c) 2017, 2026 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.