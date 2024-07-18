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
spice-vdagent is usefull to have cut and copy beetwhen VM and host and resize the windows of VM, actually is not working for me, I was able to put it working same day ago, but not now.

I added `xrandr` package too to resize the VM window with `eggs adapt`.

```
sudo apk add xdg-user-dirs spice-vdagent spice-vdagent-openrc xrandr
```


## eggs development tools
### Visual studio code
```
sudo apk add code-oss@testing
sudo ln -s /usr/bin/code-oss /usr/bin/code
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
this are that we need, almost complete... The problem is understand `mkinifs` and in that way can digest `filesystem.squashfs` and chroot on it.

```
sudo apk add \
    alpine-conf \
    apk-tools \
    cryptsetup \
    curl \
    dosfstools \
    fuse \
    git \
    jq \
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
echo "fuse" | sudo tee /etc/modules-load.d/fuse.conf
```

or 

```
modprobe fuse
```

# Clone penguins-eggs
```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
pnpm i
pnpm build
```

Now we can use eggs from the source:

```
sudo ./eggs dad -d
./eggs status
sudo ./eggs produce --pendrive
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
