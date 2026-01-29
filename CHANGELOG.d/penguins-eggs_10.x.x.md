## penguins-eggs_10.1.1-26

* wardrobe: tailor class extended to all the families: alpine, arch, debian, fedora, opensuse, a new opensuse colibri is born and we can start to prepare others.
* cuckoo: works fine on BIOS and UEFI on Arch, Debian, Devuan, Ubuntu and derivatives (Linuxmint, LMDE, etc), now also on Fedora (almalinux, rocky), Manjaro and derivatives (BigLinux). I am working on making it available on alpine and opensuse too.
* alpine: Linux Alpine is back on penguins-eggs, look to [penguins-alpine](https://github.com/pieroproietti/penguins-alpine/). In addition, I was able to create the calamares 3.3 packages for Alpine.
* arch: seem to work now nicefully on btrfs, I just changed a bit [live.conf](./mkinitcpio/arch/live.conf), and the previous problem ```premature end of file @/boot/vmlinux-linux.``` vanished. **Note:** at the moment you can install on btrfs just with calamares, we must to solve same problems on our `krill` using btrfs.

Sometime, again  don't understand why and when, the problem arise again. To fix it:

- reboot with ISO
- sudo mount -o subvol=@ /dev/sdx /mnt
- sudo arch-chroot /mnt
- ln -sf /proc/self/mounts /etc/mtab
- pacman -S linux
- reboot

After that our installed btrfs system will work nicelly.

* debian: seem to work now nicefully on btrfs using both: calamares GUI installer or krill (internal TUI installer).
* fedora: updated calamares configuration, not yet working (same error on bootloader to fix), not tested with btrfs. Remain installable using `sudo eggs install` on ext4.
* opensuse: now install using calamares on UEFI with ext4, EFI and btrfs must to be solved. It's installable using `sudo eggs install` on ext4.
* opensuse: trying to remaster btrfs, at the moment we have a problem with dracut, when used with ext4 all works, using it on btrfs dracut ignome `--no-hostonly` option. To try to understand, I added a log `/var/log/penguins-eggs-dracut-output.log`, to let to check the results.
* dracut: when is used dracut to build the live initramfs (Fedora, OpenSUSE), a dracut-debug.log is created on the resulting ISO.
* Added `lmde 7 gigi` and `linuxmint 22.2 zara` Thanks to [rreyn331](https://github.com/rreyn331).
* `krill`: now krill takes user's default groups from calamares users module template. This avoids errors and simplifies the code, making the behavior of krill and calamares similar.
* `fresh-eggs`: I have included in [fresh-eggs](https://github.com/pieroproietti/fresh-eggs) and removed from [penguins-packs](https://github.com/pieroproietti/penguins-packs) the procedure for installing tarballs packages to be used for Almalinux, Fedora, OpenSUSE and Rocky;
* `ISOs`: I remake Almalinux10, Fedora42, openSUSE and rocky9.5 [ISOs](https://drive.google.com/drive/folders/19M7fDEebPZjEY4yHD79zSMWFndCPishN?dmr=1&ec=wgc-drive-globalnav-goto).

## penguins-eggs_10.1.1
I started using Artificial Intelligence intensively on the penguins-eggs code. Beyond any “philosophical” considerations I performed a deep refactoring of `src/classes/utils.tsx`, it worked on the first hit. Such work, which manually would have cost at least a week, I did in one evening with the help of claude.ai.

Taken with gusto I refactored `src/krill/classes/prepare.ts` and `src/krill/classes/sequence.ts`.

Tested on Debian and Arch no errors appeared to me so I decided to release the version.

## penguins-eggs_10.1.0-4
The creation of the live user for the ISO, and that of the main user during installation with krill, is now done using the configuration of the yaml users.conf file.

## penguins-eggs_10.1.0-2
Added a new command: `pods` to create minimal live ISO images starting from containers. To use it, give the command: 

```eggs pods [almalinux/ archlinux/ debian/ devuan /fedora /opensuse /ubuntu]```

This command is experimental and, of course you need `podman` installed, I would appreciate your feedback.

## penguins-eggs_10.1.0-1
There are many changes to eggs in this update, but most of them are let's say: “underground,” you won't realize it!

Thanks to the help of [gnuhub](https://github.com/gnuhub), I have discovered or rediscovered containers and the possibility of using these as a basis for building live images of various distributions.

This allows, in theory-but also in practice-to build an Arch image on a Debian system, create an Ubuntu from an Arch installation, and so on.

In fact, using podman we can create complete and installable Debian, Devuan and Ubuntu systems from containers running on a host of any possible distribution.

The problem is that after so much work, I had a doubt about its actual usefulness. 

Yes, it is all very interesting, but substantially impossible to test seriously: considering six distributions, each of which can act as both host and container, to test everything we would have as many as 36 tests to run. 

I have not included Openmamba and Opensuse in the count. Adding them brings us to 8 possible combinations and, therefore to 64 tests for each modification. Practically impossible to develop.

Let us turn to the new features introduced on the "surface":
* `eggs love` now accepts the `--verbose` and `nointeractive` flags, convenient if you are in a hurry, for debugging and using eggs in a script;
* numerous bugs fixed.

For more information, see the [blog](https://penguins-eggs.net/blog/containers)

## penguins-eggs_10.0.61
Thanks to [Jorge Luis Endres](mailto://jlecomputer04@gmail.com) we have a new GUI for eggs: [eggsmaker](https://github.com/jlendres/eggsmaker).

Jorge has succeeded in what I have not succeeded in myself, which is to create a usable GUI.

Although still to be perfected, I believe the inclusion of this GUI will be good for eggs users.

To use it - on your Debian/Devuan/Ubuntu system - enable `penguins-eggs-ppa` and install it with `apt install eggsmker`.

## penguins-eggs_10.0.60
* introduced a new installation mode replacing a single partition;
* completely removed the LVM2 installation mode;
* At this point we have 3 installation modes: Erase disk, Erase disk/Encrypted and Replace partition.

I hope to reintroduce an Erase disk/LVM2 mode in the future.

## penguins-eggs_10.0.59
* I’ve been focusing primarily on krill, adding support for encrypted installations and LVM2. 
* the LVM2 and LUKS installations are functioning well, but I’m still troubleshooting a delay on the installed system. So far, I haven’t identified the cause of this issue;
* alongside this, I’m working to ensure ISOs generated with eggs can boot with Secure Boot enabled on UEFI systems;
* for Debian bookworm, Secure Boot support was successfully added, thanks to suggestions from [karltestano](https://github.com/karltestano) (see [Issue: 456](https://github.com/pieroproietti/penguins-eggs/issues/456));
* for Ubuntu and Linux Mint, the process requires copying the original `/boot/grub/efi.img` from the source ISO to `/home/eggs/iso/boot/grub/efi.img` and then running:
```
sudo /home/eggs/ovarium/mkiso
```
just to rebuild the ISO. A bit boring, but really fast;
* bugfix: deletion of the live user after installation is complete.

## penguins-eggs_10.0.58-6 (Testing)
All the changes are penguins-eggs_10.0.59.

## penguins-eggs_10.0.57
Completely removed for all the distros `lsb_release` package.

## penguins-eggs_10.0.56
One more step forward with fedora, openmamba, openSuSE and RHEL distributions in general:

* `krill`: module bootloader, inserted a `--force` for fedora family, on grub2 installation because otherwise it refuses to install itself on UEFI unsigned;
* `krill`: module bootloader. on fedora familly/RHEL derived distros (AlmaLinux and RockyLinux) but not on fedora, I need to replace from code the boot loader entries, since the ones generated during installation carried the UUIDs of the parent system.
* `krill`: fixed the installation issue on disks with a pre-existing Software RAID configuration created by Intel Rapid Storage Device Array. Thanks to [Marco Mancino](https://github.com/markoceri);
* `live`: updated kernel parameters on the live image. Thanks to [Silvan Calarco](https://openmamba.org/en/) for suggestions and [Hosein Seilany](https://predator-os.ir/) for implementation;
* `archlinux`: we have a new calamares version: `calamares-eggs-3.3.12-1-x86_64.pkg.tar.zst`.

## penguins-eggs_10.0.55
- tested penguins-eggs-tarballs on almalinux, biglinux, debian. devuan, fedora, linuxmint (no lmde), opensuse, rockylinux;
- krill: bugfix - during the production of a naked, there was an error on copyng same calamares modules;


## penguins-eggs_10.0.54
* great news for rpm based distributions: almalinux, fedora, opensuse and rocklinux: we are finally able to  bootable ISO images on UEFI systems;
* openmamba, thanks the collaboration from [Silvan Calarco](https://openmamba.org/en/), have it's own rpm package;
* almalinux, fedora, rocklinux can install penguins-eggs with [penguins-eggs-tarball](https://sourceforge.net/projects/penguins-eggs/files/Packages/TARBALLS/);
* Manjaro-based bigLinux and bigCommunity distributions are now managed separately and properly;

This version, although working, must condider itself still experimental, I had the bad idea to boot almalinux, fedora and rockylinux on UEFI with systemd-boot instead of the canonical grub2. Let's consider it, precisely an experiment.

## penguins-eggs_10.0.53
* we are adding rpm packages for openmamba and various, with the occasion it became necessary to rewrite the package export function, used by the developer. In addiction I'm trying to bring penguins-eggs to ALDOS, there is something to do yet. 
* added Manjaro Yonada

## penguins-eggs_10.0.52
One more phase of code reorganization without adding new features. 

I intervened mainly on [pacman.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/classes/pacman.ts) by restructuring it and renaming [pacman.d](https://github.com/pieroproietti/penguins-eggs/tree/master/src/classes/pacman.d) the folder for various distributions; on [bleach.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/classes/bleach.ts). [distro.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/classes/distro.ts), [ovary.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/classes/ovary.ts),  and created [diversions.ts](https://github.com/pieroproietti/penguins-eggs/blob/master/src/classes/diversions.ts) class in which I tried to collect what I could.

Later, I reorganize again pacman method   [distroTemplateInstall](https://github.com/pieroproietti/penguins-eggs/blob/9b559f05e726546b20ef5b67be67fcd40da0254b/src/classes/pacman.ts#L312) and tested on Ubuntu noble and Debian bookworm.

It seem not breack, but I need to release.

## penguins-eggs_10.0.51
I am undecided whether to make a new release and I will not, in the sense that this release does not add much for Alpine, Arch, Debian, Devuan, Fedora, Manjaro, openSuSE and Ubuntu. However, in a burst of creativity I am adding three more distributions almost simultaneously: ALDOS, openMamba and VoidLinux. 
This is the current status:

* [ALDOS](https://www.alcancelibre.org/aldos): is being remastered, but so far I have not been able to boot the distro from live, I have asked the author for help;
* [openmamba](https://openmamba.org/it/): it is remastered and installed with krill, calamares - for some reason - still doesn't work for me and generates rather heavy ISOs due probably to some exclusion to do;
* [voidLinux](https://voidlinux.org/): although it is the first one I tried to include, it is still far from being closed, as in the meantime I fell in love with Openmamba and gave it a try on ALDUS.

So no package will be released of this version, but a release will still be done and then start again with a devel branch.

It would be greatly appreciated if experts from these three distributions would like to collaborate, from doing tests to making suggestions or, reviewing the code.

## penguins-eggs_10.0.50
* `krill`: bugfix on module for `machine-id` creation on new installation;
* `RockyLinux` and `AlmaLinux` now work nicelly with penguins-eggs and is 
possible to build  instalable custom servers or desktop.

The result is the two main open-source enterprise operating systems.

## penguins-eggs_10.0.49
* `krill`: trying to add RockyLinux and AlmaLinux to penguins-eggs, we updated our TUI system 
installer to manage `systemd-boot` entries if present;
* added `isohdpfx.bin` as part of syslinux configuration. Actually we use - for all the distros - a subset of [syslinux v6.03](https://wiki.syslinux.org/wiki/index.php?title=Syslinux_6_Changelog#Changes_in_6.03), 
from [kernel.org](https://mirrors.edge.kernel.org/pub/linux/utils/boot/syslinux/) and embedded inside eggs. 

## penguins-eggs_10.0.48
* added `wget` as dependencies on all distros; removed dependencies from syslinux on all distros;
* added warm on eggs calamares if not used with sudo;
* updated calamares templates on alpine, fedora and opensuse (just a copy from updated buster).

## penguins-eggs_10.0.47
In switching from version `v10.0.44` to `v10.0.45`, I removed a class written a long time ago, 
to make eggs compatible with node8.x version and, of course, no longer needed.

Unfortunately, in rewriting it, I went to use the `fs.statSync()` function. 
which for `isSymbolicLink()` return not the value of the `path`, but that of the destination link.

This caused `/bin`, `/sbin`, `/lib` and `/lib64` to be interpreted as directories and
not as symbolic links.

eggs, was correctly performed both in the creation of the ISO and its installation, 
but the system remastered was not 'fertile'. so to speak.  The generated ISO would not boot.

Now I have replaced `fs.statSync()` with `fs.lstatSync()` which gives the correct answer in 
case of symbolic links.

This was a sneaky mistake that was difficult to detect and understand.

## penguins-eggs_10.0.46-2
* `bugfix`: the previous version `penguins-eggs_10.0.46-1` was working only on GUI using calamares, but generate an error - 
due a bug - on CLI systems or GUI system without calamares.

## penguins-eggs_10.0.46
* `calamares`: now, using calamares, the default filesystem selected is the original filesystem of the parent system;
* `calamares`: all modules in `/etc/calamares/modules` and `/etc/calamares/settings.conf` are reformatted, removing
the comments;
* `calamares`: the package `calamares-eggs` for ArchLinux was aligned to the new release `calamares-3.3.10`.

## penguins-eggs_10.0.45
* `eggs love` now not fail if eggs is not configured yet and, configuration is made with `eggs dad --defailt`;
* `eggs ` bugfix, `eggs ` under certain conditions asked for confirmation twice;
* removed package `pxelinux`, `isolinux` dependecies on debian;
* removed compatibility functions for node8, not more necessary.

## penguins-eggs_10.0.44
* `eggs export pkg` and `eggs update` now work also for AlpineLinux. This will let me to publish Alpine packages on sourceforge.
* I revisited [WAY-TO-ALPINE]() in consideration, now there is already an installable package penguins-eggs.

## penguins-eggs_10.0.43
* export deb changed to export pkg: now export packages differents, not only deb, but manjaro and aur packages. (Note: this is more for penguins-eggs developers than users;)
* update: as on export pkg, now update from different packages depending on the distro in use. (Unfortunately was not able to get the list of the packages from sourceforge, this ws the idea)
I hope in this way will be more easy for me to publish new packages on sourceforge.

## penguins-eggs_10.0.42
* Debian/Devuan/Ubuntu: remove dependencies from syslinux;
* Devuan: added Devuan excalibur.

## penguins-eggs_10.0.41
* fixed a lot of things;
* manjarolinux, biglinux fixed;
* introduced - not yet working - VoidLinux.

With the addition of alpinelinux, fedora and opensuse, penguins-eggs is changing - especially from a development perspective.

I have started to intensively use a source-based installation method, which -simulates- the installation of a real package for the distribution.

This saves me a lot of development and testing time. 

On the other hand, having real installation packages allows for better user support and easier upgrades.

I could really use someone to take care of implementing penguins-eggs packages for these three distributions. On Alpine Linux everything is almost ready, basically only Alpine's approval is missing, for fedora and opensuse it is a matter of creating an rpm package from the npm package and adding the dependencies specified in the prerequisites.

## penguins-eggs_10.0.40
* fixed a bug in krill machine-id on alpine;
* calamares on arch have restart checked on close as default;
* removed grubcfg module from arch calamares, seem not more necessary;
* wrote a short README.md for troubles in Arch using an ISO created on btrfs to install ext4 and viceversa;
* renamed NAKED-FARMS to PREREQUISITES - the procedures inside can be used on CLI and GUI systems - so this is more appropriate name;
* wrote simple README.md on how to create a naked on PREREQUISITES.

## penguins-eggs_10.0.39
* bugfix archlinux package;

## penguins-eggs_10.0.38
* krill: revised completely, introduced a spinner during installation and cleaning things;
* OpenSuSE start from live, but can't install;
* Alpine Linux krill is not working in this edition;
* To get penguins-eggs on fedora, follow [WAY-TO-FEDORA](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/WAY-TO-FEDORA.md), again don't have way to create a package, not too expert on Fedora. If someone want help.

## penguins-eggs_10.0.37
* After getting to re fedora using dracut, I tried to do the same job with AlpineLinux and OpenSuSE, unfortunately, I was not successful with either. In any case, on OpenSuSE I went ahead anyway; it remains for me to solve the mystery of why it won't boot from live image, I suspect a problem on syslinux. Cannot find on OpenSuSE the files: `ldlinux.c32`, `libcom32.c32` and `libutil.c32`, they are part of syslinux.
* On the source I check all the cases we must to choose with distros adding OpenSuSE and ordering the others distros: Alpine, Arch, Debian, Fedota and OpenSuSE.
* Tryed to get NobaraLinux working, was possible di install it, add penguins-eggs and  ISO, but there are problems and I was unable to install it with krll or calamares.
* As always if same expert is reading, this project is unique with it's capabilities but It's just an one man show, if possible need help, thanks.

## penguins-eggs_10.0.36
* fedora: this is a great addiction to penguins-eggs, from now we are able to remaster and reinstall fedora 40 too. It was a great effort I hope people will like and start to collaborate.

This project it the only solution  capable to remaster multiple distos, there is nothing similar around. It'a little an inverse of a fork, we trying joining distros and get all together.

Good, bad? I don't know: time will answer. I suggest to use eggs to learn a different distro too, at last is that I do wnen try to extend eggs.

## penguins-eggs_10.0.35
* fedora/suse: all seem solved, except creation of initramfs with dracut. I renew [WAY-OF-FEDORE]() and [WAY-TO-SUSE]() and hope someone jump on to finish this hard work. The choice to build an almost universal remastering tool was a great challenge, if not to win it I hope at least to tie it;

## penguins-eggs_10.0.34
* Alpine Linux: you no longer need to boot the “sidecar” to boot from ISO with overlay, just type “exit” from the recovery shell.

The next step should be to remove the need to go to recovery shell before mounting.

## penguins-eggs_10.0.33
* xfce: finally links on the desktop are automatically enabled;

Thanks to Eric Bradshaw for the advice.

## penguins-eggs_10.0.32
* krill: fix efi installation, forced use mount -t vfat on UEFI;
* live: introduced bootparameters `alpinelive`, `alpinelivesquashfs` per boot live;
* tests: reintroduced tests, to use with abuild in alpine, to finish.

## penguins-eggs_10.0.31
* krill: continuing the work of the previous release, checked and revisited almost all the tags of krill, now look better and more intuitive;
* krill now is able to install alpine, configuring keyboard, locale and timezone; 
* krill don't show more eventally zram disk.

## penguins-eggs_10.0.30
* removed link adapt - to evitate possible conflicts - created command `eggs adapt`;
* ISOs created from Alpine linux, now have default prefix as `egg-of_alpine`-`release`-` processor`. Example: `egg-of_alpine-3.21.0_alpha20240807-colibri_amd64_2024-08-22_1222.iso` or `egg-of_alpine-3.18.8-naked_amd64_2024-08-22_1400.iso`;
* krill: summary is now better visible and adapted to the view;
I need help and feedback - expecially on Alpine Linux - if someone expert want to collaborate, will be important for this project.

## penguins-eggs_10.0.29
* removed link love - conflict with love package - created command `eggs love`;
* created YAML configuration for `love` in `/etc/penguins-eggs.d/love.yaml`.

## penguins-eggs_10.0.28
* wardrobe: you can now dress a naked alpine as albatros or colibri, just `eggs wardrobe get` and `sudo eggs wardrobe wear albatros`;
* krill: introduced 0.5 sec delay after mount root partifion and before mount vfs, was a need for Alpine.

## penguins-eggs_10.0.27
A bit of work to perfectionate packages: Alpine post-install, post-deinstall and on Debian postinst scripts.

## penguins-eggs_10.0.26
Working again on Alpine, revised man pages, taking experiences. A APKBUILD is ready to be merger, and I need to release to spread and becouse the eggs code is the same for all the distros.

## penguins-eggs_10.0.25
From now we have penguins-eggs on: alpine, arch, debian, devuan, manjaro, ubuntu. Isn't that great?

Alpine is so light, can be remastered on a breeze, It's like to have Lego and can build what you want. 

Start with Alpine naked and add... don't work as you like? change it! Add linux-firmware at last to remain light, or add just that you need in your case.


## penguins-eggs_10.0.24
* Calamares modules configuration it's now the same for: noble, jammy and focal. I get noble configuration working in jammy and focal replacing modules: fstab, mount and users with the previous version.

## penguins-eggs_10.0.23
* bugfix: removed fwsetup and memtests from grub menu of ISO, fixed boot from local hard disk on isolinux menu for live;
* Ubuntu noble: tested calamares installation without internet successfull on BIOS and UEFI.

## penguins-eggs_10.0.22
* Ubuntu noble: thanks to collaboration with Glenn Chugg from Tasmania - the most distant user/collaborator I have - we have Ubuntu noble and Linuxmint 22 working happily with calamares;
* Alpine: Some other steps on the way of [Alpine Linux](https://alpinelinux.org/). Again don't change so much for Arch, Debian, Devuan, Manjaro users, if not the changes are actually included on the sources and need to be released.

You can check the status of Alpine Linux remaster on [On the way of Alpine](https://github.com/pieroproietti/penguins-eggs/discussions/377) discussion, the experimental ISO can be download from [our sourceforge page](https://sourceforge.net/projects/penguins-eggs/files/ISOS/alpine/). Test it, is very light, under 700 MB, about half of the Arch version, and see how to use penguins-eggs from source, there are [video](https://youtu.be/VC4ihHRb1R0).

## penguins-eggs_10.0.21
After a lot of changement to include [Alpine](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/WAY-TO-ALPINE.md), [Fedora](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/WAY-TO-FEDORA.md) and [SuSE](https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/WAY-TO-SUSE.md) on penguins-eggs, I need to release and have a stable start point to continue.

## penguins-eggs_10.0.20
I'm working mostly to bring eggs to AlpineLinux and fedora, the changes are included here, but note **eggs is not yet usable on this distros**. 

* insert changes for AlpineLinux and fedora, not impacting for the others distros;
* cleaning ad revisioning documentation;
* updated oclif and others node modules.

## penguins-eggs_10.0.19
* biglinux: now take just `biglinux` as DISTRO-NAME, not `BigLinux based in Manjaro Linux`;
* alpine: solved creation of live user;
* alpine: we get a corretct `filesystem.squashfs`, a not booting iso image, and laks again to be able to create an `initramfs` to boot from it.

## penguins-eggs_10.0.18
* ``: removed flag `--udf`.

Traditionally eggs use [xorriso](https://www.gnu.org/software/xorriso/) to create ISO images, but this can be a problem, becouse Windows don't support iso9960 larger than 4.7 G.

We can create ISO images more than 4.7 G and be able to use them in windows using [genisoimage](https://linux.die.net/man/1/genisoimage).

Trying to find a compromise, I placed xorriso and genisoimage as alternative dependencies to penguins-eggs. On `/DEBIAN/control` file  of the package:

```
Depends: coreutils,
        ...
        xorriso | genisoimage
Suggests: calamares
...
```
Installing penguins-eggs with xorriso (default) s images in [iso 9660](https://en.wikipedia.org/wiki/ISO_9660) format while installing penguins-eggs on a system where genisoimage is installed s ISOs in [Universal Disk Format](https://en.wikipedia.org/wiki/Universal_Disk_Format).

In each case you can overcome the 4.7 G barrier, but if you want your users to be able to use rufus or similar on Windows to create boot devices, use the UDF format.

At this point the `--udf` flag is no longer necessary and was removed, depending just on the way you installed penguins-eggs.

## penguins-eggs_10.0.16
* `clean`: bleach now don't remove all `/var/lib/apt/list` but just `/var/lib/apt/list/lock`. This must to solve a problem on `sudo apt update`;
* `yolk`: I added a completely new configuration file for command `yoik`. You, editing `/etc/penguins-eggs.d/yolk.yaml` can insert/delete packages to be present on the local repository `/var/local/yolk`.

## penguins-eggs_10.0.15
: added new flag --udf to  ISO in Universal Disk Format with `genisoimage` command. Note: genisoimage must to be installed before.

This is necessary because programs like rufus in Windows, do not correctly read ISO files generated with xorriso, when they are greater than 4.7 G.

## penguins-eggs_10.0.14
* eggs: added/revised support to `linuxmint wilma`, `ubuntu noble`, `ubuntu devel` (rhino).
* Installing with TUI installer krill works: `sudo eggs install`
* Installing with GUI installer calamares, there is still same problem, neither Ubuntu noble nor Linuxmint wilma seems to enable the formatting of the installation disk, this result in a failure. Selecting manual installation or crypted installations seem to work regular, but the installed system don't boot.


## penguins-eggs_10.0.13
* `dad`: bugfix on flag --file;
* `exclude.list.d`: usr.list is now completely - intentionally - empty;
* ``: removed flag --sidecar, not necessary.

## penguins-eggs_10.0.12
``: added the `--sidecar` flag, allows the inclusion of an arbitrary directory within the generated ISO. Uses can be disparate, I leave it to you.

## penguins-eggs_10.0.11-2
The `/usr/bin/penguins-links-add.sh` script called by `/etc/xdg/autostart/penguins-links-add.desktop` now waits for the Desktop folder to be present before copying the links to the desktop, with the result that all links are shown correctly.

## penguins-eggs_10.0.11-1
* ` --excludes`, now accept `static`, `homes` and `home`,

Use:

* `sudo eggs --excludes static` you can use a static exclude.list;
* `sudo eggs --excludes homes` you want to clean all users' homes;
* `sudo eggs --excludes home` don't save my home dir.


## penguins-eggs_10.0.10-1
* dad: added a new flag `--file` to have own configuration defaults.

Configuration defaults are passed with own YAML file, eg: `custom.yaml`

```
# custom.yaml
---
root_passwd: secret
snapshot_basename: columbus
snapshot_prefix: '' # none
user_opt_passwd: secret
user_opt: user 
```
Usage: `sudo eggs dad --file ./custom.yaml`

## penguins-eggs_10.0.9-1
krill: fixed a annoyng problem, when use resolvectl krill was not able to create to link `/etc/resolv.conf` to `/run/systemd/resolve/resolv.conf`, now I fixed this. I'm using krill `sudo eggs install` more than calamares due it's much fast and can be used with flags like `--unattended`, `--nointeractive`, etc.

## penguins-eggs_10.0.8-2
* just a new pratical way to add/remove local repository yolk, during installation.

Yolk was created mostly to let installation without internet connection during the system installation. Before, I decided to remove all repos during installation with calamares/krill and use just `/etc/apt/sources.list.d/yolk.list`, now I changed this strategy: I just add `/etc/apt/sources.list.d/yolk.list` during installation process without remove the others repos. The result is a light slow initializations - when we are not on the net - but the possibility to add every packages during installation when we are connected.

## penguins-eggs_10.0.8-1
* removed the code that allowed `genisoimage` to be used instead of `xorriso` to generate the ISO;
* restored the operation of `eggs  --script` for both: Debian and Ubuntu derivatives (for the moment it has been tested only on Debian bookworm and Linuxmint 21.3 Virginia;
* using `eggs  --script` actually generated a link in `/home/eggs` to the ISO in `.mnt`;
* warning: I checked `eggs  --script` on ArchLinux too, but actually don't work.

I did my best, I hope you find errors but not too many, that's enough for today!

## penguins-eggs_10.0.7-1
For the joy of all respin r who don't like to have my eggs on the desktop, I changed a flag in `sudo eggs `.

I already add flag `--noicons`, equivalent to not create icons at all on the desktop: not eggs, not calamares, and so on, I think too much. So I update it to: `sudo eggs  --noicon` in singular form, and remove just my eggs symbol and my blog link. For someone this can be important.

For others, don't take cure, always is better to have eggs on the fridge!

## penguins-eggs_10.0.6-3
Generate debian packages for all Debian/Devuan/Ubuntu distros plus a specific for Ubuntu bionic, from the same codebase. Thanks to mods in [perrisbrewery](https://github.com/pieroproietti/perrisbrewery). 

Of course Arch and Manjaro are generated aside, thanks his [PKGBUILD](https://github.com/pieroproietti/eggs-pkgbuilds).

### Note about bionic version
To have bionic, and armonize with all the others version, I did:

* package.json: ```"engines": { "node": ">=16.0.0" }, ```

Now we have two template for control file:

* perrisbrewery/template/dependencies.yaml;
* perrisbrewery/template/dependencies-bionic.yaml I removed line: ```live-config-systemd | live-config-sysinitv```, added live `-- live-boot`, and put `nodejs (>= 16);
* live-boot package: on bionic - for same reason - when the system is installed, directory `/lib/live/boot` is erased. The system work, eggs work and can , but the resulting ISO will not boot! To solve this problem, before generate the ISO, give: `sudo apt install live-boot --reinstall`. This will restore `/lib/live/boot` and it's full contents.

## penguins-eggs_10.0.6-1
I received from Glenn Chugg same informations about fixes on README and on `eggs skel` command. 

* README: added link to the important issue [#368](https://github.com/pieroproietti/penguins-eggs/issues/368) regarding nodejs 18, fixes on the text;
* skel: cinnamon desktop. not more copy`./conf/cinnamon` in `/etc/skel`.

## penguins-eggs_10.0.5-2
* : default compression is now `zstd 1M Xcompression-level 3`, fast the same and better in decompression;
* : added flag --pendrive, using `zstd 1M Xcompression-level 15` optimized to use with pendrives.

## penguins-eggs_10.0.4
* calamares: calamares now receive branding's configuration parameters homeUrl, supportUrl and bugReportUrl from /etc/os-release;
* node-proxy-dhcpd: I am trying to restore the operation of `eggs cuckoo`. I have not succeeded yet, you can refer to the related [issue](https://github.com/pieroproietti/penguins-eggs/issues/367).

## penguins-eggs_10.0.3
* krill installaler: `sudo eggs install` now have a new option to chroot on the installed system before reboot. This let you di add/remove last time packages, before your system is rebooted;
* again in krill: krill now respect the calamares module: `packages.conf` or it's own, packages are added/removed after it's configuration. This born becouse of Devuan daedalus amd64 version, I noted it go in kernel panic after installation, if penguins-eggs and it's dependecies are not removed. The problem arise - probably - from the package `live-config-sysvinit`. I solved using the option `--release` in command ``, to configurate calamares/krill to remove penguins-eggs, calamares and it's dependencies before to finish the installation process;
* Other little fixes on wardrobe.

## penguins-eggs_10.0.2
A whole series of tweaks to make the Debian package more standard, a pity not to have been able to generate a single package `-any` for all architectures. 

## penguins-eggs_10.0.0
There would be many ways to change the version number and emphasize an important fact in the code. I don't pretend to be right, but having spent a full morning reintroducing new headers on the sources and, a few days switching from `commonjs` modules to a more modern `node16` to support both CommonJS and ECMAScript modules, I decided this way. Don't hold it against me... :-)

In this version all dependencies have finally been updated. from [oclif](https://oclif.io/), [ink](https://github.com/vadimdemedes/ink), etc.

Another new feature, for those who want to try their hand at penguins-eggs development: you can create your penguins-eggs deb packages with these simple commands, of course after installing nodejs and pnpm.

To make your life easier and save yourself from installation of nodejs and pnpm, you can use any recent version of my live [colibri ISO](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bookworm/amd64/).

- `git clone https://github.com/pieroproietti/penguins-eggs`
- `cd penguins-eggs`
- `pnpm i`
- `pnpm deb`

In short, what I am about to tell you is that it is a good time to get on board!

## penguins-eggs-9.8.3
I consider the cleanup and adjustments resulting from the switch to oclif4 and Debian package name change to be over. I put the new version in the PPA and you can install it with the command: `sudo apt install penguins-eggs`.

## penguins-eggs-9.8.2
Removed a lot of unusefull code, when eggs started I thought to use npm packages to distribuite it, so inside there was the code to install necessary packages. From long time now, we  deb packages and arch packages so there was no need ot that code. I tested it working on i386 Debian Bookworm, amd64 Debian Bookworm, Arch.

## penguins-eggs-9.8.1
Released for i386, arm64 and amd64. Checked on i386 Debian Bookworm, amd64 Debian Bookworm, Arch.

## penguins-eggs-9.8.0
It had been a long time since I was forced to use an outdated version of [oclif](https://oclif.io/) because I had modified it to be able to use [pnpm](https://pnpm.io/it/) instead of [npm]().
Recently, I think in March, with version 4 of oclif it is possible to use oclif with pnpm and I could then try to upgrade the package.
The next step was to put the pieces back together. I do in fact use - in addition to oclif - another mine Debian package building tool called [perrisbrewery](https://github.com/pieroproietti/perrisbrewery) and, of course, I had to update/modify that as well.

Basically this version is different, although on the surface it does not seem too distant to the previous one.

For that reason I decided to highlight the change by changing in addition to the release also the name of the package itself, no longer `eggs` but `penguins-eggs`. Commands and logic remain the same.

I made a little update penGUI too to 0.7.9 to reflect the different package name.

This package I place in testing at the moment, it definitely needs same break-in, but it assures us to stay well anchored in the present.
