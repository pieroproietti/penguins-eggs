# Develop eggs on various distros

To start hacking with penguins-eggs, you have four ways, one for every family: debian, arch, alpine and fedora. The best is starting with Debian or Arch, where eggs is complete, reproductive and is possible to create packages. Alpine and fedora are unfinished, not reproductive yet and lacks packaging.

Basically you need to have:
- an editor, I use `code`, but it's your choice
- `git`
- `nodejs`
- `pnpm`
- install eggs dependencies

**Note**: While not essential, it is strongly recommended to fork penguins-eggs to have your own repository

## fork penguins-eggs
This operation is not essential but is strongly recommended as it allows us to have our own version of penguins-eggs and save our work in our git repository.

The operation is rather simple, requiring us to log in at https://github.com, so we first register.

In our example we will register with the name `jtburchett`

Then we will go to the project [penguings-eggs](https://github.com/pieroproietti/penguins-eggs) and click on the `fork` button.

We will get our version of penguins-eggs at https://github.com/jtburchett/penguins-eggs.

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

# Differents ways

## [Way to Debian](#way-to-debian)
## [Way to ArchLinux](./WAY-TO-ARCHLINUX.md)
## [Way to AlpineLinux](./WAY-TO-ALPINE.md)
## [Way to Fedora](./WAY-TO-FEDORA.md)


# Way to Debian

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

## start to change something
We can use code to edit our code, 
```
cd penguins-eggs
code .
```
And use `pnpm build` before to run. 

## build penguins-eggs debian packages

It's also possible to create debian packages, all you need is to type:
```
pnpm deb
```

The `penguins-eggs-x-x-x.deb` package will be created under `/perribrewery/workdir/`, you can install it as usual Debian package `sudo dpkg -i penguins-eggs_10.0.19-1_amd64.deb` it will automatically install it's dependencies, just: `sudo apt install -f`.

Using `pnpm deb -a` will generate packages for all architectures: amd64, i386 and arm64.

