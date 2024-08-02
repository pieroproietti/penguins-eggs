# Way to Alpine
We start from the `alpine-standard-3.20.1-x86_64.iso` image, which is only 203 MB, and go to install alpine.

Log as root without password, then install it: `setup-alpine`.

just follow the instructions, choose `sys` as disk.

> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## reboot
The best is, after reboot, to connect via ssh to can copy and past the command. Then:

```
su
```

Now, from root we give the following commands:

We add nano 
```
apk add nano
```

## Configuration of the repositories
```
rm /etc/apk/repositories
nano /etc/apk/repositories

```

copy and past:
```
#/media/cdrom/apks
http://pkg.adfinis.com/alpine/v3.20/main
http://pkg.adfinis.com/alpine/v3.20/community
http://alpinelinux.mirror.garr.it/v3.20/main
http://alpinelinux.mirror.garr.it/v3.20/community
@testing https://dl-cdn.alpinelinux.org/alpine/edge/testing

```

``` 
apk update
apk add doas

```

Copy and past:
```
apk add \
    bash-completion \
    git \
    mandoc \
    nano \
    mandoc \
    mandoc-apropos \
    rsync \
    shadow  

```


add your user to groups `wheel` and others... 

```
adduser artisan adm
adduser artisan bin
adduser artisan daemon
adduser artisan dialout
adduser artisan disk
adduser artisan floppy
adduser artisan sys
adduser artisan tape
adduser artisan video
adduser artisan wheel

```


## Install x11
```
setup-xorg-base

```

## xfce4 installation
```
apk add \
    xfce4 \
    xfce4-terminal \
    xfce4-screensaver \
    xfce4-whiskermenu-plugin \
    lightdm-gtk-greeter 

apk add \
    setxkbmap \
    xdg-user-dirs \
    xrandr 

rc-update add dbus
rc-service dbus start

rc-update add lightdm
rc-service lightdm start

```

## spice-vdagent
spice-vdagent is usefull to have cut and copy beetwhen VM and host and resize the windows of VM:

I added `xrandr` package too to resize the VM window with `eggs adapt`.

```
apk add \
    spice-vdagent \
    spice-vdagent-openrc
    
rc-update add spice-vdagentd
rc-service spice-vdagentd start

```
## Change default shell to bash
We come back as user:

```
exit

```

Change the default shell to bash:

```
chsh -s /bin/bash

```

## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `/home/artisan` my user.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe

doas rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /

```

Then copy `/etc/skel/` in ${HOME}:
```
rm -rf ${HOME}/.[^.]* ${HOME}/.??*
rsync -avx /etc/skel/ "${HOME}/" --include=".*" --exclude="*"

```

## Location configuration
I added the following lines to `home/artisan/.profile`

```
# Lingua italiana
LANG=it_IT.UTF-8
export LANG="it_IT.utf8"
export LC_COLLATE="C"

```
For the keyboard, I looked on the settings, keyboard and eliminated the US keyboard for the Italian

## eggs development tools

### Visual studio code
```
doas apk add code-oss@testing

doas ln -s /usr/bin/code-oss /usr/bin/code

```

### Firefox
```
doas apk add firefox

```

### nodejs, npm e pnpm
```
doas apk add nodejs npm

doas npm i pnpm -g

```

## dependencies penguins-eggs on Alpine (to be completed)
this are that we need, almost complete... The problem is understand `mkinifs` and in that way can digest `filesystem.squashfs` and chroot on it.

```
doas apk add \
    alpine-conf \
    apk-tools \
    cryptsetup \
    curl \
    dosfstools \
    fuse \
    git \
    jq \
    lsblk \
    lsb-release \
    lvm2 \
    mkinitfs \
    nodejs \
    npm \
    parted \
    rsync \
    syslinux \
    squashfs-tools \
    sshfs \
    xorriso

```

```
echo "fuse" | doas tee /etc/modules-load.d/fuse.conf

```

## reboot

## Clone penguins-eggs
```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
pnpm i
pnpm build

```

Now we can use eggs from the source:

## Autocomplete, Desktop icons
We want to work with all the conveniences of eggs installed, especially completing commands with TAB, links, etc:
```
./install-eggs-dev
```

## Create a link to ${HOME}/penguins-eggs/eggs
It is tedious to always put ./eggs to start eggs from source, we can create a symbolic link to avoid the hassle:
```
doas ln -s ${HOME}/penguins-eggs/eggs /usr/bin/eggs
```

## Configure eggs

```
doas ./eggs dad -d
./eggs status
doas ./eggs produce --pendrive

```

It don't produce an `initramfs-lts` but create correctly the `filesystem.squashfs`. 

```
ls /home/eggs/.mnt/iso/live/ -hs
total 496M   
 483.8M filesystem.squashfs   11.8M vmlinuz-lts
```

in my case about 500 M.

Removed the problem of users creation and introducing `syslinux` package to get `isolinux.bin` for the ISO, I was able to create both a `filesystem.squashfs` which should work, an ISO image starting on BIOS - I put inside `/live` the current `initramfs-lts` without try to adapt it. The ISO boot correctly, on BIOS, but of course don't load `filesystem.squashfs` and the system go in emergency mode.

Resulting ISO file size is under 600M, with xfce, code-oss, and all the materials for eggs.


# Someone can follow? 
This is my end for now... but in same way can be an usefull starting point to someone more expert than me on AlpineLinux.

I'm looking on [gitlab alpine](https://gitlab.alpinelinux.org/alpine) and on [Alpine Linux](https://alpinelinux.org/), great places... probably too great for me.

I don't see a way to build a live image, particulary I don't kwow how to load `filesystem.squashfs` from initram and chroot on it. Of course it's possible, but it's not the way the installing ISO is made and I don't have any sample to look.

I think that we lacks more, is an "Angel" able to use [mkinitfs](https://gitlab.alpinelinux.org/alpine/mkinitfs) to build an initramfs able to mount this `filesystem.squashfs` and mount it as new_root. 

# Actual state 

I first created a new branch to experiment with Alpine, then, given the fact that modifying the penguins-eggs code to incorporate AlpineLinux involves changes that may impact Debian and Arch as well, I tested them and immediately brought them back to the master branch.

I was able to create a `filesystem.squashfs` that should work and an ISO file booting on BIOS systems.
We need again:
- create an `initramfs-lts` file, to loads and mount as new_root `/live/filesystem.squashfs`;
- fix boot on UEFI for live image, on BIOS already work.

At this point we can "reproduce", but we need to install and create a package:
- adapt krill to work installing Alpine;
- see if it's possible to use calamares with Alpine;
- create an APKBUILD for the package;
- tests, tests, tests.

## Studyng the problem

I'm trying to find a way on [README](../mkinitfs/README.md). 

There is a tool to create ISO images: [mkimage](https://wiki.alpinelinux.org/wiki/How_to_make_a_custom_ISO_image_with_mkimage)

# Video
* [Install and building ISO](https://www.youtube.com/watch?v=3MxdBI5fWm8)
* [Testing ISO](https://www.youtube.com/watch?v=3MxdBI5fWm8)