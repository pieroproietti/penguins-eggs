# eggs-9.6.41
Finally we have `sudo eggs produce --cryptedclone` working and adapting the final LUKS volume to the compressed contents. 

You can safely move your servers from one place to another, using the Internet and not exposing the dates.

To restore the system, use `sudo eggs install -un`.

This is a function designed specifically for servers, but a module for calamares will come.

# eggs-9.6.40
* again on syncto e syncfrom: I am still trying to find a way to reduce the volume LUKS to the bare minimum. With the latest changes it seems to work, the `luks-volume` file actually turns out to be the optimal size, but - for some reason - generating the ISO this comes out as if it was the original size (2 GB). In the end I left it up to the user to choose, also to allow you to experiment.
* I added the ability to pass with the `--size` parameter to `syncto` the size of the luks volume to prepare, also the `--cryptedclone` flag became a string and it is possible use it like this:`eggs produce --cryptedclone 1G` to pass the size of the luks volume to prepare.
* meanwhile, I avoided the introduction of the passphrase three times during the creation and opening of the LUKS volume;
* And if you're wondering why I released 4 eggs_9.6.40 versions on Easter Day, well, let's just say I wanted you to find a surprise in the egg!

# eggs-9.6.39
* again on syncto e syncfrom: this time I decided to create until 2GB luks-volume inside the iso, under `/live`. Within the LUKS volume is created `private.squashfs` containing the data from `/home` and some significant `/etc` files;
* After the `private.squashfs` file has been created, the strict necessary size of the luks-volume file to contain it is determined. At this point `luks-volume` can be truncated to the minimum size. (I have tried many times to truncate the resulting file, sometimes successfully, sometimes not.)
* Using krill for installation, the passfrase will be requested and the existing private data copied;
* I have renamed and reorganized the exclude.lists collected in `/etc/penguins-eggs.d`, and now we have: `clone.list`, `clone.sample` -- just an example --, `custom.list`, `master.list`, and `usr.list`. These lists are compiled under master.list when requested, and they make up the `/etc/penguins-eggs.d/exclude.list` used for ISOs production.

# eggs-9.6.38
* syncto e syncfrom [#347](https://github.com/pieroproietti/penguins-eggs/issues/347) I have rewritten - almost completely - the syncto command, there are again problems I was unable to create a complete ISO filled with luks-eggs-data, but the command work and create it. Waiting suggestions, I decided to release it;
* DNS Settings [#351](https://github.com/pieroproietti/penguins-eggs/issues/351) installing with krill, applied the suggestion from [lyca-knight](https://github.com/lyca-knight);
* Unattended noninteractive installation does not read krill.yaml [#349](https://github.com/pieroproietti/penguins-eggs/issues/349), removed some stuffs intended to get configurations on internet, inside penguins-wardrobe, but really is better to work in plain way. Thanks to [code8buster](https://github.com/code8buster).


# eggs-9.6.37
* One of the features of eggs is to allow the creation of ISOs that also contain sensitive data. It is done via a LUKS volume within the ISO itself, which, upon installation, knowing the password will restore encrypted accounts and user data. On the subject I received a substantial [pull request](https://github.com/pieroproietti/penguins-eggs/pull/344) from [Marco](https://github.com/markoceri), he added an apposite exclude.list for the cryptedclone and corrected some errors. Cryptedclone can be useful for safely transferring an image of a server or desktop system over the Internet. 

* I have changed the behavior for producing the ISO as far as the Arch family is concerned. Previously I used to move the resulting `/live/filesystem.squashfs` to `/arch/x64_amd/airoot.sfs` or, on manjaro: `/manjaro/x86_64/livefs.sfs`, now I just create a hardlink.

* Using this version, I was then able to successfully remaster and reinstall garuda linux, I point out, however, that I had to install the `calamares-garuda` package instead of the `arco-calamares` package from arcolinux. 

* At last I decided to give a try to calamares-garuda, it work on arch too, so in eggs v9.6.37 you will find arco-calamares replaced from calamares-garuda.


# eggs-9.6.36
* others adaptments to get btrfs on eggs krill, added --btrfs option, checks and defaults.

# eggs-9.6.35
* eggs now is capable to work on btrfs, both for mastering and installing both, with krill and calamres.

# eggs-9.6.34
* created another package, based on node16. called `eggs_9.6.34_node16_amd64.deb` to support [Ubuntu bionic](https://ubuntu.com/18-04) and others old distros;
* removed from the exclude.list snapd, so now snaps will be copied of the live and viceversa.

# eggs-9.6.33
The autologin configuration for the live user, depends on the setting of the user running eggs: if the user is configured with autologin then, the live user is also configured with autologin.

This configuration is handled by the various desktop managers, eggs only handles it for the most common ones: lightdm. gnome, sddm and slim.

I simply used regexes to remove spaces in the configuration of these desktop managers, previously using double spaces led to nonrecognition of the line.

The special thing is mostly that - to do this - I used in eggs for the first time Artificial Intelligence, in this case Copilot from github.


# eggs-9.6.32
* added a new distribution [biglinux](https://www.biglinux.com.br/), a really nice manjaro based distro dressiang a wondowful plasma desktop.

# eggs-9.6.31
* just a little bugfix on calamares manjaro configuration; thanks @Unibox

# eggs-9.6.30
* just a little bugfix on derivatives.yaml

# eggs-9.6.29
* completely rewritten [README.md](./README.md) fron [Hosein Seilany](https://github.com/hosseinseilani);
* added Linuxmint victoria and Parrot lory (thanks to [Roy Reynolds](https://github.com/rreyn331)).

# eggs-9.6.28
* calamares: I found another difference on the configuration of calamares on `/etc/calamares/modules/bootloader.conf` now variable `installEFIFallback: true` before was setted to false;
* calamares: changed the colors of the default brand for calamares, now calamares steps remain visible.

# eggs-9.6.27
eggs now correctly configures calamares depending on the version: 3.2.x or 3.3.x, this allows calamares to be used also for Debian trixe, KDE neon and those distributions of the Debian family already upgraded to calamares 3.3.

On Arch it was already possible to use calamares 3.3, while Manjaro currently still uses version 3.2.

# eggs-9.6.26
* added Ubuntu noble;
* because some software, specify their log folders in subfolders of `/var/log` and, these, if not present do not allow them to start, I mofified the filter for `/var/log`` from `var/log/*`` to `var/log/*/*` and added some filter for `var/*.log` and `var/*.log.?`.

# eggs-9.6.25
* Not really a new version, I just added a "press key to continue" to the commands `eggs status`, `eggs wardrobe list`, `eggs wardrobe show` to better integrate eggs and [penGUI](https://sourceforge.net/projects/penguins-eggs/files/penGUI/).

# eggs-9.6.24
Just a small revision of eggs.yaml with removal of some variables no longer used. With the occasion I set by default `ssh_pass: false` previously it was true.

# eggs-9.6.23
Again on the `exclude.list`. 

I received this [issue 325](https://github.com/pieroproietti/penguins-eggs/discussions/325) so I decided to update again the exclude.list, creating a separate `exclude.list.usr` with he actual exclusions for usr.

If you want to continua to filter /usr, just add `--filters usr ` to command `eggs produce`. The default will not filter on /usr more.

With the occasion I removed the conflict with resolvconf as requested on [issue 324](https://github.com/pieroproietti/penguins-eggs/issues/324)


# eggs-9.6.22
To meet the needs of those who use eggs to clone their systems, I varied the exclude.list configuration. With the occasion I have also varied the path of it: the `exclude.list` now  is created in the canonical path `/etc/penguins-eggs.d`. In addition, since the mksquash command allows only one file for the exclude list, I thought of generating it dynamically from a template and others specific exclusions.

So we also have in `/etc/penguins-eggs.d` an `exclude.list.d` directory in which there are currently just three files: `exclude.list.template`, `exclude.list.custom` and `exclude.list.homes`. 

When we launch `sudo eggs produce` the real `exclude.list` file will be generated on `/etc/penguins-eggs.d`from the templates depending on the filters chosen: `custom`, `dev` and `homes`.

So, in this way, by doing a clone, we can decide whether or not to filter user's `homes`, use your own `custom` list, or - as in my case during development - exclude completely the current user's home using `dev`.

Another addition has been made to the [README](https://github.com/pieroproietti/penguins-eggs?tab=readme-ov-file#commands) of penguins-eggs: as you scroll through the various commands, a link to the code for the command itself appears below them. This can be very useful for those who want to try their hand at modifying or integrating penguins-eggs itself or simply have a curiosity to know how it works.

# eggs-9.6.21
* produce: we have a new default with a new **strictly** exclude.list, but you can use the new flag `--unsecure`, to bypass it.
* produce: new string for max compression `xz -Xbcj x86 -b 1M -no-duplicates -no-recovery -always-use-fragments`

Thanks to Hosein Seilany author of [Predator-OS](https://predator-os.ir/) and [Emperor-OS](https://emperor-os.ir/) for the great collaboration.


# eggs-9.6.20
[antiX](https://antixlinux.com/) is a wonderful Linux distribution and shares with [MX Linux](https://mxlinux.org/) everything needed for remastering: `antix-remaster` and `antix-Installer`. I have always envied them the wonderful installer, which is lightweight, graphical and easy to use. 

For those who want to use eggs for their remastering, I have tried to improve compatibility.

So, I added, a better distro recognition - previously both antix and MX linux were recognized as MX - and added a command that makes it possible to use their `minstall` for installation: `sudo /lib/live/mount/medium/antix-mx-installer`

You can of course use again krill for installation: `sudo eggs install` as calamares - strange to discover - work fine on MX Linux but not on antiX.

Note: I was able to remaster `antiX-23_x64-full.iso`, but not the `antiX-23_x64-base.iso` version. Again, to improve compatibility use `demo` as name for the live user and share your ideas/experiences on [penguins-eggs](https://t.me/penguins_eggs).

# eggs-9.6.19
* themes: we now have the ability to customize grub and isolinux themes, not only for graphics but also for menus. Take a look on theme predator on [wardrobe](https://github.com/pieroproietti/penguins-wardrobe). Thanks to Hosein Sellany of [PredatorOS](https://predator-os.ir/). 

# eggs-9.6.18
Again working on `eggs install` aka krill:

* fixed bootloader problems on Arch, Debian, Devuan and Ubuntu.

# eggs-9.6.17
A lot of little adjustments on `eggs install` aka krill:

* added krill alias to command `eggs install`;
* user/password and root/password fixes;
* hostname, domain fixes;
* others.

The only solution to put krill in order it to use it, I always use it with option --unattended to save time, sorry if I forgot some bugs again.

# eggs-9.6.16
I make a bit of refactoring on the nest (`/home/eggs`) - under the hood virtually all remain unchanged - but we get more clear vision:
```
- iso -> .mnt/iso
- livefs -> .mnt/filesystem.squashfs
- ovarium
- README.md
- egg-of_image.iso
- egg-of_image.md5
- egg-of_image.sha256
```
In addiction, there are two hidden dirs too: `./mnt`, `./overlay`, where happen the magic.

* kill: added --isos to force erase of ISOs on remote share;
* dad: changed text in accord;
* info: restored info text file on `.disk` of the ISO created.
 
# eggs-9.6.15
* ovary: added creation checksums .md5 and sha256;
* export iso: added checksums export.

# eggs-9.6.14
* ovary: enable/disable root and users password ssh connnections;
* grub/isolinux: added `ipv6.enable=0` excluded ipv6;
* yolk: typos and fixes;
* exclude.list: again a rewrite of exclude.list. including twallace51@gmail.com updates.

# eggs-9.6.13
* v9.6.12 deprecated: due a bug introduced on the previous version v9.6.12 is unable to produce on i386 and arm64 architectures;
* eggs dad -a: now don't clear more eventually errors from the screen;
* love: an one shot script to get live child systems;
* exclude.list: we get a new, more functional exclude.list, thanks to twallace51@gmail.com.

# eggs-9.6.12
* yolk: removed check and build for local yolk repository on `arm64` and `i386`;
* manjaro: added `vulcan` version.

# eggs-9.6.11
* krill: changed the way to visualize errors on function `rexec()` during installation, without clear and stop the execution;
* krill: hide desktop link to krill on installed systems;
* krill: always set zone/region to local using geoip.

# eggs-9.6.10
* krill: sort of keyboard layouts and fix layout selection in Devuan;
* krill: module network-cfg, removed /etc/resolv.conf build

# eggs-9.6.9
* eggs: a lot of little bugfixes due various tests on arch, arcolinux, bhodi, blendos, debian, deepin, devuan, educaandos, elementary, endeavourOS, garuda, kali, lds, lilidog, linuxfx, linuxlite, linuxmint, luberri, manjaro, mx-linux, neon,  neptune, netrunner, parrotos, plastilinux, pop-os, rebornos, rhino, siduction, sparkylinux, spirallinux, syslinuxos, ubuntu and waydroid;
 
# eggs-9.6.8
* krill: a lot of work on krill to reestablish its functionality, especially the detection and selection of languages, keyboards, etc. that had skipped in recent versions;
* calamares: given the work to introduce plasma 6 on Arch linux, some packages were renamed and involved calamares. The affected packages are: kdbusaddons5, kconfig5, kcoreaddons5, kiconthemes5, ki18n5, kio5, solid5 and plasma-framework5. It was necessary, therefore to update calamares.

# eggs-9.6.7
A lot of work on compatibility with [Proxmox-VE](https://www.proxmox.com/en/proxmox-virtual-environment/overview), we now have two different ISOs for amd64 and arm64. The new [eagles](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bookworm/) come with xfce4, virt-viewer and proxmox-ve installed; they can be tested either live or installed. The version for arm64, is build with [Proxmox-Port](https://github.com/jiangcuo/Proxmox-Port) repository by [jiangcuo](https://github.com/jiangcuo), a great work!

# eggs-9.6.6
* patch for humans: users tend to set `user_opt` as real username, this is NOT NECESSARY AT ALL and in cases of `--clone` will create problems. To prevent that, eggs reset `user_opt` to standard when a `-clone` is request;
* added distrobution Ubuntu mantic.

# eggs-9.6.5
* changed ln node from /bin/node to /usr/bin/node to solve problem in Devuan i386;
* added grub-efi-arm64-bin to dependencies for arm64.

# eggs-9.6.4
* introduced yolk for arm64 architecture;
* using  `-processor 2` and `-mem 1024M` limit on mksquashfs on arm64 for Raspberry;
* naming changed to: egg-of_distro-codename-name_arch_data-time;
* need confirm for installation, remastering and production on RPi 4.

# eggs-9.6.3
* calamares: just a fix on a bug in calamares configuration introduced with version 9.6.2.

# eggs-9.6.2
This is the first version, working and producing installable ISOs for the system on: amd64, i386 and arm64 architecture.

To test on arm64 - just on Debian bookworm - I used a simple VM not real hardware, I'm not too expert of such architecture, but I hope can work on real hardware too, if it is compatible UEFI and grub.

# eggs-9.6.1
Nicelly working on amd64 and i386 with the same - aligned - version. 

No more differences for installation and usage beetwhen the two versions.

arm version is installable too and can run, but will not produce a regular ISO. If you are interested in support arm I need your help.

