# Way to Fedora
We start from the `Fedora-Server-netinst-x86_64-40-1.14.iso` image, which is 765M, and go to install Fedora server choosing minumun installation.

We can create root password and our `artisan` user.

Installation is graphical and don't need to describe.

> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## reboot
The best is, after reboot, to connect via ssh to can copy and past the command. Then:

```
dnf install \
    lightdm-gtk-greeter \
    spice-vdagent \
    xfce4-screensaver \
    xfce4-terminal \
    xfce4-whiskermenu-plugin 

systemctl set-default graphical.target 
systemctl enable lightdm
systemctl enable spice-vdagentd

```

## others
```
dnf install \
    bash-completion \
    firefox \
    git \
    lsb-release \
    rsync \
    xdg-user-dirs \
    xrandr 

```

### nodejs, npm e pnpm
```
dnf install nodejs npm
npm i pnpm -g

```


## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` on `/`, then copy `/etc/skel` on the home of current user.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe

sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /
rm "${HOME}/." -R
cp /etc/skel/.* "${HOME}/." -R

```
## eggs development tools

### Visual studio code
Download [code](https://code.visualstudio.com/download) rpm version, and install it:
```
sudo dnf install ./code-1.91.1-1720564728.el8.x86_64.rpm 

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

## Autocomplete eggs
Create a dummy eggs in `/usr/bin/`
```
echo \"just a dummy eggs\" | sudo tee /usr/bin/eggs
sudo chmod +x /usr/bin/eggs

```

Copy `eggs.bash` on `/etc/bash_completion.d/`

```
sudo cp scripts/eggs.bash /etc/bash_completion.d/

```

## Configuration eggs

```
sudo ./eggs dad -d
./eggs status
sudo ./eggs produce --pendrive

```

The result at the moment is a not bootable ISO. 
During `sudo eggs produce` I'm getting this error:
```
eggs >>> error on command: chroot /home/eggs/.mnt/filesystem.squashfs echo live:evolution | chroot /home/eggs/.mnt/filesystem.squashfs chpasswd, code: 127
eggs >>> error on command: chroot /home/eggs/.mnt/filesystem.squashfs echo root:evolution | chroot /home/eggs/.mnt/filesystem.squashfs chpasswd, code: 127
```

We get a `filesystem.squasfs` of 1.3 G and an ISO file 1.5 G.

The ISO is not bootable, must to check why, and there is to check dependencies too.

I have an annoying problem with `spice-vdagent`, work just the first time I install it, later not. 

Of course, before to produce a real ISO we must prepare an `initramfs` capable to load `filesystem.squashfs` and chroot on it.

# Actual state 

After the experience with AlpineLinux, I realized that I must to work on the main branch and check Debian, Arch and Alpine not became broken.

I was able to create a `filesystem.squashfs` that should work and an ISO file booting on BIOS systems. We are about at the same point of Alpine, so we need again:
- create an `initramfs` file, to loads and mount as new_root `/live/filesystem.squashfs`;
- fix boot on UEFI for live image, fix something in BIOS too.

# Fedora peoples, someone can help? 
This is my end for now... but in same way can be an usefull starting point to someone more expert than me on Fedora, please help.

# Links
[dracut manual](https://github.com/dracutdevs/dracut/blob/master/man/dracut.usage.asc)