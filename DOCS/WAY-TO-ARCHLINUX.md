# Way to Archlinux

We start from the `archlinux-2024.07.01-x86_64.iso` image and go to install archlinux.

We are logged automatically as root, then run: `archinstall`.

just follow the instructions.

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
pacman -S spice-vdagent xorg-xrandr xdg-user-dirs rsync

```

## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `/home/artisan` my user.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe

sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /
rm -rf "${HOME}/.*"
rsync -avx /etc/skel/ "${HOME}/" --include=".*" --exclude="*"

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

### nodejs, pnpm
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

# Clone penguins-eggs
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
sudo ln -s ${HOME}/penguins-eggs/eggs /usr/bin/eggs`
```

## Configure eggs

```
sudo ./eggs dad -d
./eggs status

sudo ./eggs produce --pendrive

```

