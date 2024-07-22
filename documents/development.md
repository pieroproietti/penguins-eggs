# Development on Debian bookworm

Basically you need to install:
- code
- git
- nodejs
- npm

## Install code
Download [code](https://code.visualstudio.com/download) and install it. 

## install nodejs, npm and pnpm
```
sudo apt update
sudo apt install git nodejs npm
sudo npm i pnpm -g
```

## fork penguins-eggs
This operation is not essential but is strongly recommended as it allows us to have our own version of penguins-eggs and save our work in our git repository.

The operation is rather simple, requiring us to log in at https://github.com, so we first register.

In our example we will register with the name `jtburchett`

Then we will go to the project [penguings-eggs](https://github.com/pieroproietti/penguins-eggs) and click on the `fork` button.

We will get our version of penguins-eggs at https://github.com/jtburchett/penguins-eggs.


## clone penguins-eggs

```
git clone https://github.com/piero-proietti/penguins-eggs
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

single command have flags, examples and descriptions, and under `async run()` start their action. using generally one or more classes, or alone.

## classes
There are a lot of classes, we now go to see pacman.ts a crucial one.

### pacman.ts
pacman.ts from `package manager` is not for Arch, or Debian, it's for all the distro. `pacman` import classes for all the distros from `./familes`: `alpine.ts`, `arclinux.ts`, `debian.ts`, `fedora.ts` and depending on that distro is running on, realize it's operation with the system commands: `apk, `pacman`, `apt`. `dnf`.

### distro.ts
We call often distro during our work, becouse contai a lot of values we use, regarding the distro really runnig.

I divided distros, in four families: `debian`, `archlinux`, `alpine` and `fedora`. 

Every distro has it's `distroId` and `codenameId`, eg: `debian`, `bookwork`. Associated where are various values for paths etc.

It's a bit a kaos actully, I'm restructuring it, becouse with the inclusions of `alpine` and `fedora` it's larger than I like to have, for now work and can stay.
