# Way to Fedora
We start from the `Fedora-Server-netinst-x86_64-40-1.14.iso` image, which is 765M, and go to install Fedora server choosing minumun installation.

We can create root password and our `artisan` user.

Installation is graphical and don't need to describe.


## reboot
The best is, after reboot, to connect via ssh to can copy and past the command. Then:

```
#dnf install @xfce-desktop-environment
dnf install xfce4-terminal xfce4-screensaver xfce4-whiskermenu-plugin lightdm-gtk-greeter
dnf install lightdm-gtk
dnf install spice-vdagent

systemctl set-default graphical.target 
systemctl enable lighdm
systemctl enable spice-vdagent

```

## others
```
dnf install \
    firefox \
    git \
    lsb-release \
    rsync \
    xdg-user-dirs \
    xrandr 

```


### nodejs, npm e pnpm
```
sudo dnf install nodejs npm
sudo npm i pnpm -g

```


## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` on `/`, then copy `/etc/skel` on the home of current user.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe
sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/  /
cp /etc/skel/.* "${HOME}/." -R

```
## eggs development tools

### Visual studio code
Download [code](https://code.visualstudio.com/download) rpm version, and install it:
```
sudo dnf install code-1.91.1-1720564728.el8.x86_64.rpm 

```


## dependencies penguins-eggs on Fedora
this are that we need, almost complete... 

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


