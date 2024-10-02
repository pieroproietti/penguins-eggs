# Way to Void Linux
We start from the `void-live-x86_64-20240314-xfce.iso` image, use `void-installer` to install the system. Sencerelly I started before with musl version, I will retry, but had problems with code, I will retry it later.

> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## reboot
We can immidiatly update all our system with:
``` 
sudo  xbps-install -Su
```

Then we add same packages
``` 
sudo  xbps-install \
    bash-completion \
    git \
    nano \
    nodejs \
    pnpm \
    rsync \
    spice-vdagent \
    xrandr 
``` 

After that we can enable spice-vdagent with
``` 
sudo ln -s /etc/sv/spice-vdagentd /var/service/
``` 
I need to use `spice-vdagent` becouse I'm in a VM, the same is for `xrandr` who let me to resize the display to the windows. 

For xfce4 we need to add `xfce4-whiskermenu-plugin` too to work with my favourite theme colibri.
``` 
sudo  xbps-install xfce4-whiskermenu-plugin
``` 

## Italian keyboard
Italian keyboard is not selected from `void-installer` for X11, so I configure it in this way:

```
sudo mkdir /etc/X11/xorg.conf.d -p
sudo nano /etc/X11/xorg.conf.d/00-keyboard.conf
```

Copy and paste:
```
Section "InputClass"
    Identifier "system-keyboard"
    MatchIsKeyboard "on"
    Option "XkbLayout" "it"
EndSection
```

## just a symlink
becouse for other we have bash-completion configuration on `/etc/bash_completion.d` we just create it as a link to the real place:

```
sudo ln -s /usr/share/bash-completion/completions/ /etc/bash_completion.d
```

## autocompletion, git, fuse, etc

Copy and past:
```
sudo xbps-install  \
    bash-completion \
    dracut-crypt-ssh \
    dracut-network \
    dracut-uefi \
    fuse \
    fuse-sshfs \
    git \
    man-pages \
    nano \
    nodejs \
    pnpm \
    rsync \
    spice-vdagent \
    vscode \
    xrandr 
```

# reboot
Reboot, then login as user artisan.


## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `sysroot` under `penguins-wardrobe/costumes/colibri/` and `sysroot/etc/skel` on my user `/home/artisan`.

```
xdg-user-dirs-update
git  clone https://github.com/pieroproietti/penguins-wardrobe
rsync -avx  penguins-wardrobe/costumes/colibri/sysroot/etc/skel/ "${HOME}/"
doas rsync -avx  penguins-wardrobe/costumes/colibri/sysroot/ /

```

## Clone penguins-eggs
```
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
pnpm i
pnpm build

```

Now we can use eggs:

## Autocomplete, Desktop icons
It is tedious to always put ./eggs to start eggs from source, we can create a symbolic link to avoid the hassle.  We want to work with all the conveniences of eggs installed, especially completing commands with TAB, links, etc, so I wrote this script to have all. Just type:

```
./install-eggs-dev

```

# Well now is time to start to change penguins-eggs
The first thing to do is to add the new distro: VoidLinux

Is a `rolling` so we don't have to do so much here, just add the distro in `/src/classes/distro.ts`.

We create a folder unde `/conf/distros/` for our distro:
```
mkdir conf/distros/void
```
and a `README.md` inside it, for now empty, jkust the title `# VoidLinux`.


We need to see that is the software used to build `initramfs` and create a configuration for our live. Here we used `dracut` already present becouse of fedora and opensuse.

I removed dmsquash-live-ntfs, added dracut-network to get an initramfs valid.


# Someone can follow? 
This is my end for now... but in same way can be an usefull starting point to someone more expert than me on VoidLinux. The biggest problem actually are: 

> [!NOTE]
> Penguins eggs already support: alpine, arch, debian, devuan, manjaro and ubuntu


