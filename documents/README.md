# Develop eggs on Debian bookworm

Basically you need to install:
- code
- git
- nodejs
- pnpm
- eggs dependencies

**Note**: While not essential, it is strongly recommended to fork penguins-eggs to have your own repository

## fork penguins-eggs
This operation is not essential but is strongly recommended as it allows us to have our own version of penguins-eggs and save our work in our git repository.

The operation is rather simple, requiring us to log in at https://github.com, so we first register.

In our example we will register with the name `jtburchett`

Then we will go to the project [penguings-eggs](https://github.com/pieroproietti/penguins-eggs) and click on the `fork` button.

We will get our version of penguins-eggs at https://github.com/jtburchett/penguins-eggs.

# [Way to Debian](#way-to-debian)
# [Way to ArchLinux](./WAY-TO-ARCHLINUX.md)
# [Way to AlpineLinux](./WAY-TO-ALPINE.md)
# [Way to Fedora](./WAY-TO-FEDORA.md)


# Way to Debian
Download [code](https://code.visualstudio.com/download) and install it. 


## - eggs dependencies - Debian amd64 packages
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

## install nodejs, npm and pnpm
```
sudo apt update
sudo apt install git nodejs npm
sudo npm i pnpm -g
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

## Autocomplete, Desktop icons
```
./install-eggs-dev
```

# We are ready to test
From `penguins-eggs` now we can test it, simply using `./eggs` to start. eg:

```
sudo ./eggs dad -d
sudo ./eggs produce --pendrive
```

# start to change something
We can use code to edit our code, 
```
cd penguins-eggs
code .
```
And use `pnpm build` before to run. 

It's also possible to create debian package, all you need is to type:
```
pnpm deb
```

The `penguins-eggs-x-x-x.deb` package will be created under `/perribrewery/workdir/`, you can install it as usual Debian package `sudo dpkg -i penguins-eggs_10.0.19-1_amd64.deb` it will automatically install it's dependencies, just: `sudo apt install -f`.


# source

All the source is under `/src`, and is divided on:
* classes
* commands
* components
* interfaces
* krill
* lib

## commands
`commands` contain all eggs commands we use, eg: `dad`

open `dad.ts` to get a look.

Single command have flags, examples and descriptions, and under `async run()` start their action. using generally one or more classes, or alone.

## classes
There are a lot of classes, we now go to see pacman.ts a crucial one.

### pacman.ts
pacman.ts from `package manager` is not for Arch, or Debian, it's for all the distro. `pacman` import classes for all the distros from `./familes`: `alpine.ts`, `arclinux.ts`, `debian.ts`, `fedora.ts` and depending on that distro is running on, realize it's operation with the system commands: `apk, `pacman`, `apt`. `dnf`.

### distro.ts
We call often distro during our work, becouse contai a lot of values we use, regarding the currens distro.

I divided distros in four families: `debian`, `archlinux`, `alpine` and `fedora`. 

Family `debian` don't have just Debian, but Devuan, Ubuntu and all their derivatives, eg `Linuxmint`.

Every distro has it's `distroId` and `codenameId`, eg: `debian`, `bookwork`. Associated where are various values for paths, defaults, etc.

`distro.ts` it's a bit a kaos actually, I'm restructuring it, becouse with the inclusions of `alpine` and `fedora` it's larger than I like to have, but it work and `Primum vivere deinde philosophari` say the old latins.


### incubation/incubator.ts
The same approach is for `/incubation/incubator.ts`, it take from `/incubation/distros/` the varius differents code for every distro running.

Incubation stands for eggs configuration, it's funny name came from the idea of eggs and something to hatch eggs.

### ovary.ts
This is the main eggs class, it's long, and it's the central part of eggs. When we give: `eggs produce` we are calling ovary.

### xdg
All the things more or less related to xdg, eg: autologin, skel, etc.

### others classes
Generally are simpler and understandable, of course this is my idea.

# Historical perspective
I suggest to think how this is a software grow up with time, so think the history of it to understand a reason.

I started just with Debian and remastering Debian, then extend to Ubuntu and Devuan. In origin I have not `deb` package but produce `npm` packages for node, so inside eggs where was the code to install all the packages dependencies.

With time, I passed to create deb packages more pratical for users and at last also for me. I started to create deb packages using [oclif](/incubation/incubator.ts`), but oclif don't manage dependencies nor pre and post install scripts.

To exit to this impasse, I wrote [perrisbrewery](https://github.com/pieroproietti/perrisbrewery), so I can insert dependecies and scripts inside the package. This lead me to remove same code I had inside the sources about install dependencies.

Removing dependencies from code free me a bit: in this way I can manage them in the package not in the sources.

Then was more easy to extend eggs to Arch, where the dependeces are included in the PKGBUILD scrips. Of course, was not so short step, involved initramfs, different paths, differents packages names and so on.

After that where was a time of relative stability, nodejs was included in the package eggs from oclif.

With version 10.x.x come the decision to not include more nodejs inside eggs, but to have it as dependence.

Actually, I started to extend eggs to [AlpineLinux](https://alpinelinux.org/) and [fedora](https://fedoraproject.org/it/).

Get a look to [WAY_TO_ALPINE](./WAY-TO-ALPINE.md) and [WAY_TO_FEDORA](./WAY-TO-FEDORA.md), are similar to this document, but not yet completely working.


