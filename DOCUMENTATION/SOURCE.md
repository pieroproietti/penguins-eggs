# SOURCE

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
There are a lot of classes, we now go to see the most importants.

### distro.ts
We call often distro during our work, becouse contai a lot of values we use, regarding the currens distro.

I divided distros in four families: `debian`, `archlinux`, `alpine` and `fedora`. 

Family `debian` don't have just Debian, but Devuan, Ubuntu and all their derivatives, eg `Linuxmint`.

Every distro has it's `distroId` and `codenameId`, eg: `debian`, `bookwork`. Associated where are various values for paths, defaults, etc.

`distro.ts` it's a bit a kaos actually, I'm restructuring it, becouse with the inclusions of `alpine` and `fedora` it's larger than I like to have, but it work and `Primum vivere deinde philosophari` say the old latins.

### incubation/incubator.ts
The same approach is for `/incubation/incubator.ts`, it take from `/incubation/distros/` the varius differents code for every distro running.

Incubation stands for eggs installation, it's funny name came from the idea of eggs and something to hatch eggs.

### ovary.ts
This is the main eggs class, it's long, and it's the central part of eggs. When we give: `eggs produce` we are calling ovary.

### pacman.ts
pacman.ts from `package manager` is not for Arch, or Debian, it's for all the distro. `pacman` import classes for all the distros from `./familes`: `alpine.ts`, `arclinux.ts`, `debian.ts`, `fedora.ts` and depending on that distro is running on, realize it's operation with the system commands: `apk, `pacman`, `apt`. `dnf`.

### utils.ts
It contain general methods large used on the code.

### xdg
All the things more or less related to xdg, eg: autologin, skel, etc.

### others classes
Generally are simpler and understandable, of course this is my idea.

