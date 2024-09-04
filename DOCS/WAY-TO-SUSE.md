# Way to openSuSE
We start from the `openSUSE-Tumbleweed-NET-x86_64-Snapshot20240725-Media.iso` image, which is 269M, and go to install openSUSE server, set root password and user. 


> [!NOTE]
> This is tested just on BIOS, under a VM on Proxmox VE.

## enable sshd

The best is, after reboot, to connect via ssh to can copy and past the command. Then:

```
ip a
```
To get the ip of our VM, then:

```
ssh -Y artisan@192.168.1.23
```

Became root:
```
su
```

# install xfce

```
zypper in -t pattern xfce

```

## others
```
zypper install \
    bash-completion \
    firefox \
    git \
    lsb-release \
    rsync \
    xdg-user-dirs \
    xrandr 

```
## spice-vdagent

We need to enable uinput:

```
echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf

```

then

```
sudo zypper install spice-vdagent

```


## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `/home/artisan` my user.

```
git clone https://github.com/pieroproietti/penguins-wardrobe
sudo rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /
rm -rf ${HOME}/.[^.]* ${HOME}/.??*
cp /etc/skel/.* "${HOME}/." -R

```

## eggs development tools

### nodejs, npm e pnpm
```
zypper install nodejs pnpm

```

### Visual studio code
```
sudo zypper ar obs://devel:tools:ide:vscode devel_tools_ide_vscode
sudo zypper install code

```

## dependencies penguins-eggs on openSuSE
This are that we need, almost complete... 

```
sudo zypper install \
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
    squashfs \
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

# openSUSE peoples, someone can help? 
This is my end for now... and same way can be an usefull starting point to someone more expert than me on OpenSuSE, please help.

# Links
[dracut manual](https://github.com/dracutdevs/dracut/blob/master/man/dracut.usage.asc)
