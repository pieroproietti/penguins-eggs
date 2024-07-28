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

### nodejs, npm e pnpm
```
zypper install nodejs pnpm

```


## customize colibri from wardrobe
We just copy customization from penguins-wardrobe, on the folder `dirs` under `penguins-wardrobe/costumes/colibri/` and `/home/artisan` my user.

```
git  clone https://github.com/pieroproietti/penguins-wardrobe

doas rsync -avx  penguins-wardrobe/costumes/colibri/dirs/ /

```

Then copy `/etc/skel/` in ${HOME}:
```
rm -rf ${HOME}/.[^.]* ${HOME}/.??*
rm -r ${HOME}/.[^.]* ${HOME}/.??*
rsync -avx /etc/skel/ "${HOME}/" --include=".*" --exclude="*"

```

## eggs development tools

### Visual studio code
```
zypper ar obs://devel:tools:ide:vscode devel_tools_ide_vscode
zypper in code

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

## Create a link to ${HOME}/penguins-eggs/eggs
It is tedious to always put ./eggs to start eggs from source, we can create a symbolic link to avoid the hassle:
```
sudo ln -s ${HOME}/penguins-eggs/eggs /usr/bin/eggs`
```

## Configuration eggs

```
sudo ./eggs dad -d
./eggs status
sudo ./eggs produce --pendrive

```

The result at the moment is a **NOT bootable ISO**.

# openSUSE peoples, someone can help? 
This is my end for now... but in same way can be an usefull starting point to someone more expert than me on Fedora, please help.

# Links
[dracut manual](https://github.com/dracutdevs/dracut/blob/master/man/dracut.usage.asc)