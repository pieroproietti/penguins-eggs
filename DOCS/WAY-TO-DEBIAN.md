# Way to Debian

We start from the `debian-12.6.0-amd64-netinst.iso` image, which is only 621 MB, and go to install Debian bookworm.

When we reache the end of installation, we deselect all except `system standard utilities`, finish the installation, then reboot.

## Install sudo and git
Log in as root and: `apt install sudo git` then `/sbin/adduser artisan sudo` to have sudo and grant to user artisan the rights to use it.

## Installing penguins-eggs
* `git clone https://github.com/get-eggs`
* `cd get-eggs`
* `sudo ./get-eggs`


# Dressing the system
We can "dressing" our penguin manually or with eggs wardrobe,

## dressing our penguins from wardrobe
We are using here eggs wardrobe, costume colibri. 
Colibri have all we need to develop penguins-eggs and more. Here is the wardrobe method:
* `eggs wardrobe get`
* `sudo eggs wardrobe wear colibri`

If you choose this method you are finished.

## dressing our penguins manually
We can choose our desktop, desktop manager and so on, install and configure them continue installing the following tools, we need to develop.

## Install your editor
Download [code](https://code.visualstudio.com/download) and install it. 

## install nodejs, npm and pnpm
```
sudo apt update
sudo apt install git nodejs npm
sudo npm i pnpm -g

```
## eggs dependencies (Debian)
Install this Debian packages if you don't have penguins-eggs already installed. Just copy and paste:


```
sudo apt install \
  coreutils \
  cryptsetup \
  curl \
  dosfstools \
  dpkg-dev \
  git \
  isolinux \
  jq \
  live-boot \
  live-boot-doc \
  live-boot-initramfs-tools \
  live-config-systemd \
  live-tools \
  lsb-release \
  lvm2 \
  nodejs \
  parted \
  rsync \
  squashfs-tools \
  sshfs \
  syslinux \
  xorriso
```

## clone penguins-eggs

```
git clone https://github.com/pieroproietti/penguins-eggs
```

Now we can install node_modules:

```
cd penguins-eggs
pnpm i 
```

Ok, then we can build:
```
pnpm build
```

Now we can use eggs from the source:

## Autocomplete, Desktop icons
It is tedious to always put ./eggs to start eggs from source, we can create a symbolic link to avoid the hassle. 
We want to work with all the conveniences of eggs installed, especially completing commands with TAB, links, etc, so I wrote this script to have all. Just type:
```
./install-eggs-dev
```

# We are ready to test
From `penguins-eggs` now we can test it, simply using `./eggs` to start. eg:

```
sudo eggs dad -d
sudo eggs produce --pendrive
```

## start to change something
We can use code to edit our code, 
```
cd penguins-eggs
code .
```
And use `pnpm build` before to run. 

# build penguins-eggs debian packages

It's also possible to create debian packages, all you need is to type:
```
pnpm deb
```

The `penguins-eggs-x-x-x.deb` package will be created under `/perribrewery/workdir/`, you can install it as usual Debian package `sudo dpkg -i penguins-eggs_10.0.19-1_amd64.deb` it will automatically install it's dependencies, just: `sudo apt install -f`.

Using `pnpm deb -a` will generate packages for all architectures: amd64, i386 and arm64.


# On real hardware
Acer Aspire One ZG8 (Aspire One Serie), Intel Atom N270 1 x 1.6 GHz, DiamondVille, card: Intel Graphics Media Accelerator (GMA) 950

Just installing `sudo apt install firmware-linux`, I get wi-fi, audio and graphics working.

``` 
apt install \
    bluez \
    cheese \
    libreoffice \
    linux-firmware \
    vlc \
```
