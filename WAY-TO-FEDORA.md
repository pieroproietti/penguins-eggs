# Way to Fedora
We start from the `Fedora-Server-netinst-x86_64-40-1.14.iso` image, which is 765M, and go to install Fedora server choosing minumun installation.

We can create root password and our `artisan` user.

Installation is graphical and don't need to describe.


## reboot
The best is, after reboot, to connect via ssh to can copy and past the command. Then:

```
dnf install @xfce-desktop-environment

dnf install lightdm-gtk
systemctl enable lighdm

systemctl set-default graphical.target 
systemctl enable spice-vdagent

```

## Configuration of the repositories



## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `/home/artisan` my user.



```
git  clone https://github.com/pieroproietti/penguins-wardrobe
sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/  /
rsync -avx  penguins-wardrobe/costumes/colibri/dirs/etc/skel/.config /home/artisan/

```
## eggs development tools

### Visual studio code
Download [code]() and install it, just a click.

### Firefox
```
sudo dnf install firefox

```

### nodejs, npm e pnpm
```
sudo dnf install nodejs npm
sudo npm i pnpm -g

```
# FOLLOW MUST TO BE WRITTEN 

## dependencies penguins-eggs on Alpine (to be completed)
this are that we need, almost complete... The problem is understand `mkinifs` and in that way can digest `filesystem.squashfs` and chroot on it.

```
sudo dnf install \
    cryptsetup \
    curl \
    dosfstools \
    fuse \
    git \
    jq \
    lsb-release \
    lvm2 \
    dracut \
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

## Studyng the problem

I'm trying to find a way on [mkinirfs/README.md](./mkinitfs/README.md).