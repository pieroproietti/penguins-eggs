# WAY TO ARCH

We start from the `archlinux-2024.07.01-x86_64.iso` image, which is only 203 MB, and go to install arch.

We are logged automatically as as root without password, then install it: `archinstall`.

just follow the instructions, add `lsb-release` and `git` to the additional packages.

## openssh installation
We can add openssh to connect to remote:
```
pacman -S openssh
systemctl enable sshd
systemctl start sshd

```

## xfce install
```
pacman -S xfce4 xfce4-terminal xfce4-screensaver xfce4-whiskermenu-plugin lightdm-gtk-greeter
systemctl enable lightdm

```

## spice-vdagent
spice-vdagent is usefull to have cut and copy beetwhen VM and host and resize the windows of VM:

I added `xrandr` package too to resize the VM window with `eggs adapt`.

```
pacman spice-vdagent xorg-xrandr xdg-user-dirs

```

## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `/home/artisan` my user.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe

sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /
rm -rf "${HOME}/.*"
cp /etc/skel/.* "${HOME}/." -R

```

## eggs development tools

### Visual studio code
```
sudo pacman -S code

```

### Firefox
```
sudo pacman -S firefox

```

### nodejs, npm e pnpm
```
sudo pacman -S nodejs pnpm


```

## dependencies penguins-eggs on ArchLinux
This are the actual dependencies on Archlinux

```
pacman -S \
    arch-install-scripts \
    dosfstools \
    erofs-utils \
    findutils \
    git \
    grub \
    jq \
    libarchive \
    libisoburn \
    lsb-release \
    lvm2 \
    mkinitcpio-archiso \
    mkinitcpio-nfs-utils \
    mtools \
    nbd \
    nodejs \
    pacman-contrib \
    parted \
    procps-ng \
    pv \
    python \
    rsync \
    squashfs-tools \
    sshfs \
    syslinux \
    xdg-utils \
    bash-completion

```


