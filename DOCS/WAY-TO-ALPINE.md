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
http://dl-cdn.alpinelinux.org/alpine/v3.20/main
http://dl-cdn.alpinelinux.org/alpine/v3.20/community
@testing https://dl-cdn.alpinelinux.org/alpine/edge/testing

```

``` 
apk update
apk add doas

```

 ## sudo as link to doas, shutdown as link to poweroff
To not get crazy, almost me:
```
ln -s /usr/bin/doas /usr/bin/sudo

```

## autocompletion, git, mandoc, etc

Copy and past:
```
apk add \
    bash-completion \
    docs \
    git \
    man-pages \
    mandoc \
    mandoc-apropos \
    musl-locales \
    musl-utils \
    nano \
    rsync \
    shadow  

```

## add user to wheel
add your user to groups `wheel` and others... 

```
adduser artisan audio
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

## install spice-vdagent
spice-vdagent is usefull to have cut and copy beetwhen VM and host and resize the windows of VM:

I added `xrandr` package too to resize the VM window with `eggs adapt`.

```
apk add \
    spice-vdagent \
    spice-vdagent-openrc
    
rc-update add spice-vdagentd
rc-service spice-vdagentd start

```


## Installing grub (BIOS)
penguins-eggs support mainly grub for installing, so we must to install use it. 
Actually I'm playng on Alpine just with BIOS system, I'm postponing UEFI for later.

To install GRUB in BIOS mode, type:

```
apk add grub grub-bios grub-efi efibootmgr
grub-install /dev/sda
```
## Installing firmware-linux
```
apk add linux-firmware

```

# reboot
Reboot, then login as user artisan.

## Change default shell to bash
```
chsh -s /bin/bash

```

## Italian locale or other
```
echo "LANG=it_IT.UTF-8" | doas tee /etc/locale.conf

```
## Italian locale or other X
```
setxkeyboard it

```
## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `dirs/etc/skel` on my user `/home/artisan`.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe
rsync -avx  penguins-wardrobe/costumes/colibri/dirs/etc/skel/ "${HOME}/"
doas rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /

```

## Development tools

### nodejs, npm e pnpm
```
doas apk add nodejs npm

doas npm i pnpm -g

```

### Visual studio code or others
```
doas apk add code-oss@testing

doas ln -s /usr/bin/code-oss /usr/bin/code

```

### Firefox
```
doas apk add firefox

```


## Install dependencies for penguins-eggs on Alpine
This packages will finish in a APKBUILD for penguins-eggs on Alpine.

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

# Enable fuse
```
echo "fuse" | doas tee /etc/modules-load.d/fuse.conf

```

## Clone penguins-eggs
```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
pnpm i
pnpm build

```

Now we can use eggs from the source:

## Autocomplete, Desktop icons
It is tedious to always put ./eggs to start eggs from source, we can create a symbolic link to avoid the hassle. 
We want to work with all the conveniences of eggs installed, especially completing commands with TAB, links, etc, so I wrote this script to have all. Just type:
```
./install-eggs-dev
```

## Configure eggs

```
doas ./eggs dad -d
./eggs status

```
## Produce
```
doas ./eggs produce --pendrive

```

# Actual state 
After 4 weeks from start this project, I was able to remaster and reinstall a customized Alpine Linux (my classical colibri) acting as the various versions on others distros.

You can remaster and reinstall it, we lacks an APKBUILD to create a real package, but I installed it by a script.

I added now firmwares and grub, but until now never tested it on real hardware.

Stay tuned!

# Someone can follow? 
This is my end for now... but in same way can be an usefull starting point to someone more expert than me on AlpineLinux.

I'm looking on [gitlab alpine](https://gitlab.alpinelinux.org/alpine) and on [Alpine Linux](https://alpinelinux.org/), great places... probably too great for me.


# Video
* [Install and building ISO](https://www.youtube.com/watch?v=3MxdBI5fWm8)
* [Testing ISO](https://www.youtube.com/watch?v=3MxdBI5fWm8)
* [remaster and install](https://www.youtube.com/watch?v=zjev4Zg9sHM)

