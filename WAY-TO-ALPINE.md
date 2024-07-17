# Way to Alpine
We start from the `alpine-standard-3.20.1-x86_64.iso` image, which is only 203 MB, and go to install alpine.

Log as root without password, then install it: `setup-alpine`.

just follow the instructions, choose `sys` as disk.

## reboot
```
su
apk add git rsync nano bash-completion
```

## Configuration of the repositories
```
sudo nano /etc/apk/repositories
```

add:
```
#/media/cdrom/apks
http://pkg.adfinis.com/alpine/v3.20/main
http://pkg.adfinis.com/alpine/v3.20/community
http://alpinelinux.mirror.garr.it/v3.20/main
http://alpinelinux.mirror.garr.it/v3.20/community
@testing https://dl-cdn.alpinelinux.org/alpine/edge/testing
```

# sudo
```
apk update
apk add sudo
```

edit /etc/sudoers with `visudo`

```
## Same thing without a password                                                
%wheel ALL=(ALL:ALL) NOPASSWD: ALL                                              
```

add your user to group `wheel`

```
adduser artisan wheel
```


## Install x11
```
setup-xorg-base
```

## xfce4 installation
```
apk add xfce4 xfce4-terminal xfce4-screensaver xfce4-whiskermenu-plugin lightdm-gtk-greeter

rc-update add dbus
rc-service dbus start

rc-update add lightdm
rc-service lightdm start
```

## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `/home/artisan` my user.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe
sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/  /
rsync -avx  penguins-wardrobe/costumes/colibri/dirs/etc/skel/.config /home/artisan/
```

## Location configuration
I added the following lines to `home/artisan/.profile`

```
export LANG="it_IT.utf8"
export LC_COLLATE="C"
```
For the keyboard, I looked on the settings, keyboard and eliminated the US keyboard for the Italian

## keyboard configuration
`
sudo apk add setxkbmap
setxkmap it
`

## spice-vdagent
```
sudo apk add xdg-user-dirs spice-vdagent spice-vdagent-openrc
```


## eggs development tools
### Visual studio code
```
sudo apk add code-oss@testing
```


### nodejs, npm e pnpm
```
sudo apk add nodejs npm
sudo npm i pnpm -g
```

## Packages needed for live creation
```
apk add alpine-conf apk-tools mkinitfs
```

## dependencies penguins-eggs on Alpine (to be completed)
```
sudo apk add \
    alpine-conf \
    apk-tools \
    cryptsetup \
    curl \
    dosfstools \
    git \
    jq \
    lsb-release \
    lvm2 \
    mkinitfs \
    nodejs \
    npm \
    parted \
    pxelinux \
    rsync \
    squashfs-tools \
    sshfs \
    xorriso
```

# Actual state 2024-07-16

I first created a new branch to experiment with Alpine, then, given the fact that modifying the penguins-eggs code to incorporate AlpineLinux involves changes that may impact Debian and Arch as well, I tested them and immediately brought them back to the master branch.

I was able to create a filesystem.squashfs that should work, but it still dwarfs a lot though::
- creation of an initrd that loads it
- creation of the ISO
- modifications, at least in krill for installation


# Giving up
I'm looking on [gitlab alpine](https://gitlab.alpinelinux.org/alpine) and on [Alpine Linux](https://alpinelinux.org/), great places... probably too great for me.

I don't see a way to build a live image, particulary I don't see a way to load an filesystem.squashfs from initrd anche chroot on it. 

Probably exists, but it's not the way the installing ISO is made and don't have any sample.

