# Way to Fedora

We start from the `Fedora-Everything-netinst-x86_64-40-1.14.iso` image, which is 765M, and go to install Fedora choosing minumun installation, set root password and user. 

On the installion select "minimun installation", button to confirm are alternately up left or down right. 

Select the disk, I used a 32G disk, choose the third option manually: create a bios  boot partition (just 1M), then an ext4 partition. 

We can create user `artisan` and choose a password.

> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## reboot and enable uinput

To use spice-vdagent we need to enable `uinput`:

```
echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf
```

Then, when it exists:

```
sudo chmod 666 /dev/uinput
```
## reboot
We can start, The best is to connect via ssh to can copy and past the command. 

```
sudo su
```

Start to install xfce and spice-vdagent

```
dnf -y install \
    lightdm-gtk-greeter \
    spice-vdagent \
    xfce4-settings \
    xfce4-screensaver \
    xfce4-terminal \
    xfce4-whiskermenu-plugin \
    spice-vdagent

systemctl set-default graphical.target 
systemctl enable lightdm
systemctl enable spice-vdagentd

```
## others
```
dnf -y install \
    bash-completion \
    firefox \
    git \
    lsb-release \
    rsync \
    xdg-user-dirs \
    xrandr 

```

## customize colibri from wardrobe
```
exit
```

We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` on `/`, then copy `/etc/skel` on the home of current user.

```
git clone https://github.com/pieroproietti/penguins-eggs
sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /
rm -rf ${HOME}/.[^.]* ${HOME}/.??*
cp /etc/skel/.* "${HOME}/." -R

```

## eggs development tools

### nodejs, npm e pnpm
```
sudo dnf -y install nodejs pnpm

```

### Visual studio code
```
git  clone https://github.com/pieroproietti/penguins-wardrobesudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" | sudo tee /etc/yum.repos.d/vscode.repo > /dev/null

```
Then: 
```
sudo dnf check-update
sudo dnf -y install code

```

## dependencies penguins-eggs on Fedora
This are that we need, almost complete... 

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
    dracut-live \
    nodejs \
    overlayfs-tools \
    parted \
    pnpm \
    rpcbind \
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

## Autocomplete, Desktop icons
We want to work with all the conveniences of eggs installed, especially completing commands with TAB, links, etc:
```
./install-eggs-dev

```

# Links
[dracut manual](https://github.com/dracutdevs/dracut/blob/master/man/dracut.usage.asc)