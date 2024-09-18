# Alpine naked

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
@edge https://dl-cdn.alpinelinux.org/alpine/edge/community

```

## sudo as link to doas
To not get crazy:
```
ln -s /usr/bin/doas /usr/bin/sudo

```

## Install prerequisites
```
apk add \
    alpine-conf \
    apk-tools \
    bash-completion \
    cryptsetup \
    curl \
    docs \
    dosfstools \
    fuse \
    git \
    jq \
    lsb-release \
    lsblk \
    lvm2 \
    man-pages \
    mandoc \
    mandoc-apropos \
    mkinitfs \
    musl-locales \
    musl-utils \
    nano \
    nodejs \
    npm \
    parted \
    rsync \
    shadow \
    squashfs-tools \
    sshfs \
    syslinux \
    xorriso

echo "fuse" | tee /etc/modules-load.d/fuse.conf

npm i pnpm -g
```

## Clone penguins-eggs

```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
pnpm i
./install-eggs-dev

```

