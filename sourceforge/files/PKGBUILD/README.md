# penguins-eggs-pkgbuilds
 
This is my [penguins-eggs-pkgbuilds](https://github.com/pieroproietti/penguins-eggs-pkgbuilds) repository, and here I am collecting my PKGBUILDs. Once tested, pkgbuilds are published to the [Archlinux User Repository](https://aur.archlinux.org/packages/penguins-eggs) and [Manjaro Community Repository](https://gitlab.manjaro.org/packages/community/penguins-eggs).

# Installation
On Arch you can use yay to install penguins-eggs: ```yay penguins-eggs```, while in Manjaro you can install penguins-eggs directly with pamac and pacman.

# Configuration
You can configure eggs with the default settings, simply with the command:

```sudo eggs dad -d```

# add calamares installer (optional)
To add the calamares GUI installer, type:

```sudo eggs calamares --install```

## Note for Arch
It's possible to install [calamares](https://aur.archlinux.org/packages/calamares-git) by yay, but at the moment there is a problem with package [ckbcomp](https://aur.archlinux.org/packages/ckbcomp), so to install calamares, you will have to:
```
git clone https://github.com/pieroproietti/penguins-eggs-pkgbuilds
cd penguins-eggs-pkgbuilds/aur/cbkcomp
makepkg -si
```

At this point you can properly install calamares with the command: 

```yay calamares```

## Create your first iso
All the users will be removed from your live system.

```sudo eggs produce```

### Create a live system including all users
You can use the flag --clone, all users will be saved uncrypted on the live.

```sudo eggs produce --clone```

### Create a live system including all users crypted
Or you can use the --cryptedclone flag, all users will be saved encrypted in a LUKS volume within the live image. The user data will not be available in live mode, but can be reinstalled using the CLI installer.

```sudo eggs produce ----cryptedclone```

### Would you like a more compressed image?
Just add flag --max:

```sudo eggs produce --max``` 

### Do you want eggs and calamares removed after installation?
Just add flag --release:

```sudo eggs produce --max --release``` 

# Boot the image
You can use: [Ventoy](https://www.ventoy.net/en/index.html), Balena etcher, Rufus or similar on USB key, or use the iso file with [Proxmox VE](https://www.proxmox.com/en/proxmox-ve), Virtualbox, vmware, etc.

# Binaries
It would be very useful to have the binaries for penguins-eggs and calamares freely created and shared by the community from the PKGBUILDs in AUR, if anyone wants to help can contact [me](https://t.me/penguins_eggs).

# More informations
There is a [Penguins' eggs official guide](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide) and same other documentation - mostly for developers - on the repository [penguins-eggs](https://github.com/pieroproietti/penguins-eggs) under [documents](https://github.com/pieroproietti/penguins-eggs/tree/master/documents). I want to point out [hens, differents species](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/hens-different-species.md) a brief how to use eggs in Debian. Arch and Manjaro, and the post [Arch-naked](https://penguins-eggs.net/docs/Tutorial/archlinux-naked.html) on the blog which describes how to create an Arch naked live, install it, then dress the resulting system with a graphics development station.

You can contact me by [mail](mailto://pieroproietti@gmail.com) or follow me on 
[blog](https://penguins-eggs.net), 
[facebook](https://www.facebook.com/groups/128861437762355/), 
[github](https://github.com/pieroproietti/penguins-krill), 
[jtsi](https://meet.jit.si/PenguinsEggsMeeting), 
[reddit](https://www.reddit.com/user/Artisan61), 
[telegram](https://t.me/penguins_eggs), 
[twitter](https://twitter.com/pieroproietti).

# Copyright and licenses
Copyright (c) 2017, 2023 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.