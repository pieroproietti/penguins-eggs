# eggs-9.5.26_i386
This is a **great news**, I thought will be not possible, and initially I worked to restore eggs-8.17.17, but with more than same tricks, it is possible to get eggs x32, aligned with the x64 version. 

It was tested on Debian bookworm, Devuan daedalus, LMDE6. This are the instructions to install it:

* download the package `eggs-9.5.26_i386.deb`
* `sudo gdebi eggs_9.5.26_i386.deb`
* `sudo rm /usr/lib/penguins-eggs/bin/node`
* `sudo ln -s /usr/bin/node /usr/lib/penguins-eggs/bin/node`
* `sudo eggs dad -d`


# eggs-9.5.26
I have been working on extending support for penguins-eggs compatibility regarding derivatives, in particular:
* the file `derivatives.yaml` has been modified.
* the file `archiso.yaml` was introduced.

Additional distributions that are compatible with:

* Debian (buster, bullseye, bookworm and trixie);
* Devuan (beowulf, chimaera and daedalus);
* Ubuntu (bionic, focal, jammy, devel);
* Arch rolling
 
can be added to `derivatives.yaml`

In case of adding an Arch rolling compatible distribution, you must also include it in the file: `archiso.yaml`.

# eggs-9.5.25
we have another catch in the hunting bag: [ArcoLinux](https://arcolinux.com/). 

It happened that, looking for a solution for calamares - the version on [aur](https://aur.archlinux.org/packages/calamares) is unusable - I found [arcolinux-pkgbuild-calamares](https://github.com/arcolinux/arcolinux-pkgbuild-calamares) and, from this I had taken the PKGBUILD I used to build my previous calamares-eggs. 

However, with the latest updates, this version also does not work and I had to restart from the original.

At this point therefore, it was a must to invite [ArcoLinux](https://www.arcolinux.info/) on board and accommodate it, also to get familiar with it: remastering it - at last - it's just my way of studying it.

# eggs-9.5.24
* Just put a bit order inside the code, cutted some not-more-used parts and rewriting of all file headers;
* I started a new project [denos'eggs](https://github.com/pieroproietti/denos-eggs) replacing [nodejs](https://nodejs.org/it) with [deno](https://deno.com/). This is not necessarily a definitive path, I am just looking around and seeking cooperation. Given the absolutely early state of the project it should be easier to come together and collaborate.

# eggs-9.5.23
* ovary: solved problems mounting local partition;
* ovary: solved problems mounting sshfs;
* ovary: rewrote makeDotDisk;
* ovary: lot of bugfixes;
* revisited again killMeSotly;
* dad: suggests commands for producing a public live system or a private one (clone) and shows how to add free space - if needed - by remote or local mounting.

We thank for cooperation the user @unibox who made his equipment and time available for the necessary usage test.

# eggs-9.5.22
* first positive remaster and reinstall Arch on btrfs;
* ovary: actually `/boot`` is copied not more merged to let the use of `/boot`` on vfat possibile;
* calamares: updated `calamares-eggs-3.3.0.r10707.4b3278058-1-x86_64.pkg.tar.zstì on Arch.

# eggs-9.5.21
* general refactoring: mostly on settings, ovary, i-workdir, i-eggs-config;
* produce: a check was added in ovary after launch `mkiso`, if the generation of the iso fail, eggs will exit showing error;
* added a mountpoint on `/home/eggs/mnt`. This is usefull to can clone/remaster systems without sufficient free space. We need about 2 x filesystem.squashfs size free to can build the iso. Just mount your free partition inside `/home/eggs/mnt`, example: `sudo mount /dev/sdb1 /home/eggs/mnt`, then run `sudo produce`. It is also possible to mount free space from a remote computer using sshfs as in the following example: `sudo sshfs root@192.168.1.2:/home/artisan/destination /home/eggs/mnt`;
* rewrote and checked routines for available and used space, in light of the ability to mount free partition under `/home/eggs/mnt`;
* a function named `killMeSoftly()` - hopefully safe - was created. The function check presence of binded dirs eventually mounted inside `/home/eggs/mnt/filesystem.squashfs` and mounted partition on`/home/eggs/mnt` before to rqqemove `/home/eggs`.

# eggs-9.5.20
* calamares: I added in the calamares configuration the possibility to detect the filesystem types supported by the system. By default and as the first option we always have ext4, then btrfs, xfs and f2fs.

Of course it's not eggs job to check if the support is complete or not, if the installed system includes it the btrfs installation will be done and work.

At the moment I've only been able to get btrfs-installable images using the garuda distribution, probably because garuda is configured by default to support it.

I hope I get suggestions from the user community on how to build ISOs with btrfs for Debian, Devuan, Ubuntu and Arch.

use pnpm 8.6.8

# eggs-9.5.19
* kill: check for mountpoints presence under `ovarium/filesystem.squashfs` before to kill. 

# eggs-9.5.18
* yolk: now yolk download the same packages on UEFI and BIOS, without exclude installed packages.

# eggs-9.5.17
* calamares: added module welcome.conf, this allows calamares to work properly on disks with multiple partitions and systems.

# eggs-9.5.16
* manjaro: added codename Uranos;
* arch: we now download and install [calamares-eggs](https://github.com/pieroproietti/eggs-pkgbuilds/tree/master/aur/calamares-eggs) from [sourceforge](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD/). This solve the problems of calamares on AUR and is a temporary workaround.

# eggs-9.5.15
* skel: added `await rsyncIfExist(`/home/${user}/.config/lxqt`, '/etc/skel', verbose)` to lxqt;
* ovary: cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} getent group autologin || chroot ${this.settings.work_dir.merged} groupadd autologin`, this.verbose))

## eggs-9.5.14
* skel:`rm -f /etc/skel/.config/user-dirs.*`, `rm -f /etc/skel/.config/bookmarks` as suggested Emer Chen;
* pacman: removed echo on `commandIsInstalled()`;
* changed the way to test cinnamon DE, from `cinnamon-core` to `cinnamon-common`;
* added `Debian 13 trixie` to support Sparky 8 rolling.

## eggs-9.5.13
Added Sparky linux, and solved issued with derivatives installation on UEFI and BIOS;
* UEFI: Linuxmint LMDE, Sparky and others Debian based distros, need to have the field `efiBootloaderId: "Debian"` to can boot correctly on UEFI;
* BIOS: added `chroot $CHROOT dpkg --configure -a` before install bootloader;

**NOTE:** Sparky linux came in two version: stable and semi-rolling. On same version field `VERSION_CODENAME` on `/etc/os-release` is not configurated, this lead eggs to assume the version is `rolling` but this is wrong. Add on `/etc/os-release` the line `VERSION_CODENAME=bookworm` to can remaster it with penguins-eggs;

## eggs-9.5.12
After having problems with calamares in Arch, you can read more [here](https://penguins-eggs.net/blog/arch-calamares-icu) I had to provide a new version of calamares for Arch, also there were many fixes also to get krill working in the new mode. 

Really a lot of effort, which should be rewarded by being able to start distributing Arch ISOs and derivatives installable with calamares again.

## eggs-9.5.11
**krill**: since it is possible for both krill and calamares to use themes not only for aesthetic purposes but also for special configurations, I modified krill to accept themes even in the absence of calamares. This also comes in handy for another reason: I am interested in jade-gui, the crystal-linux and blendOS installer. In time, I would like to make jade-gui available in eggs, somewhat as is the case with calamares.

I have already made a few attempts using blendos and the jade-gui version of it and it seems to work perfectly even on live images created with penguins-eggs.

## eggs-9.5.10
* debian: grub-efi-amd64-bin now is included in dependencies, so it's automatically addded and is always possible to produce system for BIOS and EFI;

## eggs-9.5.9
* krill now respect autologin on Arch;
* no more need to create symbolic link on the root for `/boot/vmlinuz-linux` or `/boot/vmlinuz-linux-zen` on blendOS;
* system installation (krill or calamares) remove entirely `/etc/calamares` using option `--release` in produce.

### eggs-9.5.8
* remove `user-dirs.dir` in `/etc/skel/.config/` to not lock building of canonical directory;
* introduced flag `noicons` in `eggs produce` to remove penguins-eggs icons from desktop and skip calamares control for systems live only;
* fixed bugs introduced by deprecated `v9.5.6` and `v9.6.7`, sometimes adding small features can be less easy than you think.

### eggs-9.5.5
* added Garuda Raptor to the compatibility list, see [README.md](https://sourceforge.net/projects/penguins-eggs/files/ISOS/garuda/) for limits.


### eggs-9.5.4
* added `eggs sudo tools ppa` on Arch, here we set repository `chaotic-aur`;
* removed `rolling-` on the default prefix for Arch amd derivated, die all Arch versions are rolling;
* passed to calamares 3.3 for Arch and derivates, created rolling/calamares-3.2 for manjaro.

### eggs-9.5.3
* solved issues [Krill installer fails on actual hardware #245](https://github.com/pieroproietti/penguins-eggs/issues/245);

### eggs-9.5.2
I switched to Debian bookworm as a development station, using node v18.16.0 and pnpm v8.6.2

* added the new Manjaro UltimaThule;
* live boot menu on UEFI architecture - previously invisible - has been fixed;

### eggs-9.5.1
Just little bugfix to let eggs to work again on CLI systems, solved a configuration on krill for Arch.
