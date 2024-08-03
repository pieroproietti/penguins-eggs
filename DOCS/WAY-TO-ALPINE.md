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

# sudo as link to doas, shutdown as link to poweroff
To not get crazy, almost me:
```
ln -s /usr/bin/doas /usr/bin/sudo

```

# autocompletion, git, mandoc, etc

Copy and past:
```
apk add \
    bash-completion \
    docs \
    git \
    nano \
    mandoc \
    mandoc-apropos \
    man-pages  \
    musl-locales \
    musl-utils \
    rsync \
    shadow  

```


add your user to groups `wheel` and others... 

```
adduser artisan cdrom
adduser artisan games
adduser artisan input
adduser artisan users
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
    elogind \
    lightdm-gtk-greeter \
    polkit-elogind \
    xfce4 \
    xfce4-screensaver \
    xfce4-terminal \
    xfce4-whiskermenu-plugin

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
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `dirs/etc/skel` on my user `/home/artisan`.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe
rsync -avx  penguins-wardrobe/costumes/colibri/dirs/etc/skel "${HOME}/"
doas rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /

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


# Installing grub (BIOS)
penguins-eggs support mainly grub for installing, so mu must to install it.
To install GRUB in BIOS mode, remove the Syslinux package and install the required GRUB packages:

```
apk del syslinux
apk add grub grub-bios
grub-install /dev/sda
grub-install /dev/vda
```

# Someone can follow? 
This is my end for now... but in same way can be an usefull starting point to someone more expert than me on AlpineLinux.

I'm looking on [gitlab alpine](https://gitlab.alpinelinux.org/alpine) and on [Alpine Linux](https://alpinelinux.org/), great places... probably too great for me.

# Actual state 
Today, after 3 weeks from start this project, I was able to remaster and reinstall a customized Alpine Linux (my classical colibri) acting as the various versions.

Probably tomorrow I will add a video about that... I need again to build an APKBUILD for penguins-eggs and look if I can use calamare with the last Alpine Linux.

Stay tuned!


# Video
* [Install and building ISO](https://www.youtube.com/watch?v=3MxdBI5fWm8)
* [Testing ISO](https://www.youtube.com/watch?v=3MxdBI5fWm8)