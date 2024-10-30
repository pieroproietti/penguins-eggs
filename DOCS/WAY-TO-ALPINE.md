# Way to Alpine

We start from the `alpine-standard-3.20.3-x86_64.iso` image, which is only 203 MB, and go to install alpine.

Log as root without password, then install it: `setup-alpine`.

just follow the instructions, choose `sys` as disk.

> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## reboot
Now, from root we give the following commands:

We add nano 
```
su
apk add nano
```

## Configuration of the repositories
```
doas nano /etc/apk/repositories
```
And remove the comment on the community repo:

```
#/media/cdrom/apks
http://dl-cdn.alpinelinux.org/alpine/v3.20/main
http://dl-cdn.alpinelinux.org/alpine/v3.20/community

```

### Adding git and lsb-relese

``` 
apk update
apk add git lsb-relese

```

## Clone penguins-eggs
```
git clone https://github.com/pieroproietti/penguins-eggs
```

## Adding prerequisites
```
cd penguins-eggs/PREREQUISITES/alpine
doas ./install.sh

```

This will install penguins-eggs dependecies and add some utilities, fuse and and links.

## install penguins-eggs
We can add our penguins-eggs. Download the binary packages for AlpineLinux from [sourceforge](https://sourceforge.net/projects/penguins-eggs/files/Packages/ALPINE/). Penguins-eggs is noarch, so you will find just x86_64 folder, but the package can be installed on others architecture.

```
doas penguins-eggs-10.0.44-r0.apk penguins-eggs-bash-completion-10.0.44-r0.apk penguins-eggs-doc-10.0.44-r0.apk

```

## Installing firmware-linux
Eventually, for usage in real world...

```
apk add linux-firmware

```
# Install package tools
If we are developers, and want to create packages:

```
apk add \
     abuild \
     alpine-sdk \
     atools

adduser artisan abuild

```

# add user to wheel
add your user to groups wheel and others...
```
adduser artisan wheel
adduser artisan floppy

```
# reboot
Reboot, then login as user artisan.

## Change default shell to bash
```
chsh -s /bin/bash

```

## customize colibri using wardrobe
We already have penguins-eggs installed, so dressing using wardrobe is just a question of a two commands:
```
eggs wardrobe get
doas eggs wasrrobe wear colibri
```

### Visual studio code or others
```
doas apk add code-oss@testing

doas ln -s /usr/bin/code-oss /usr/bin/code

```

## Configure eggs

```
doas eggs dad -d
eggs status

```
## Produce live ISO
```
doas eggs produce --pendrive

```

# create keys

```
abuild-keygen -n

```
Insert on `~/.abuild/abuild.conf`:

```
PACKAGER_PRIVKEY="/home/artisan/.abuild/piero.proietti@gmail.com-66b8815d.rsa"

```
copy `piero.proietti@gmail.com-66b8815d.rsa.pub` on `/etc/apk/keys`.

## Create the package
```
git clone https://github.com/pieroproietti/eggs-pkgbuilds
cd eggs-pkgbuilds/alpine/penguins-eggs
./clean 

```

# Actual state 
After a mounth from start this project, I'm able to remaster and reinstall a customized Alpine Linux (my classical colibri and a naked version) acting as the various versions on others distros.

You can remaster and reinstall it, I did an APKBUILD to create a real package, again not merged in aports.

You can add  firmwares: `apk add linux-firmware`, personally never tested it on real hardware.


Stay tuned!

# Someone can follow? 
This is my end for now... but in same way can be an usefull starting point to someone more expert than me on AlpineLinux. The biggest problem actually are: 
* find a way to get an initrd working with my remastered ISOs, without need my [sidecar.sh](https://github.com/pieroproietti/penguins-eggs/blob/master/mkinitfs/sidecar.sh) (a temporary solution);
* package calamares on Alpine 3.20 to use with eggs, there is a version on [branch=v3.18](https://pkgs.alpinelinux.org/packages?name=calamares&branch=v3.18&repo=&arch=&maintainer=), probably it's just question to actualize.

> [!NOTE]
> Penguins eggs already support: arch, debian, devuan, manjaro and ubuntu, there are [WAy-TO-FEDORA](./WAY-TO-FEDORA.md) and [WAY-TO-SUSE](./WAY-TO-SUSE.md) you can follow and improve.

# Video
* [Install and building ISO](https://www.youtube.com/watch?v=3MxdBI5fWm8)
* [Testing ISO](https://www.youtube.com/watch?v=3MxdBI5fWm8)
* [remaster and install](https://www.youtube.com/watch?v=zjev4Zg9sHM)

# dracut
* https://fedoraproject.org/wiki/LiveOS_image

