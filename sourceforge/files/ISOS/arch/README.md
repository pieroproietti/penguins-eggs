penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguins' eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

# Arch

[Arch](https://archlinux.org/) a simple, lightweight distribution.

* **egg-of-arch-rolling-naked** Just the juice, without GUI. You can start here to build your revolution!
* **egg-of-arch-rolling-colibri** A light xfce4 for developers you can easily start to improve eggs installing colibri.

# USE

**naked** can be usefull to start everything: just add that you want, **colibri** is more a tool to hack with eggs than a real customization and perhaps can be used to test calamares too. 

NOTE: While waiting to complete the wardrobe for arch, it is still possible to switch from the naked configuration to colibri by running the following commands:

* ```eggs wardrobe get```
* ```cd .wardrobe/costumes/colibri```
* ```sudo ./arch-colibri.sh```

# Installing eggs and producing an iso 
On Arch, You can use yay to install penguins-eggs:

```
yay penguins-eggs
```
or, more traditionally:

```
git clone https://aur.archlinux.org/penguins-eggs.git
cd penguins-eggs
makepkg -srcCi
```

eggs, is installed!

# Calamares
It's possible to install [calamares](https://aur.archlinux.org/packages/calamares-git) by yay, but at the moment there is a problem with package [ckbcomp](https://aur.archlinux.org/packages/ckbcomp), so to install calamares, you will have to:
```
git clone https://github.com/pieroproietti/penguins-eggs-pkgbuilds
cd penguins-eggs-pkgbuilds/aur/cbkcomp
makepkg -si
```

At this point you can properly install calamares with the command: 

```
yay calamares
```

We need now to reconfigure eggs:

```
sudo eggs dad -d
```

and let eggs configure it to allow the use of calamares without entering the root password:

```
sudo eggs calamares --install
```

We are ready to create our first iso:

```
sudo eggs produce
```

If you want calamares and eggs to be removed during system installation, simply use:

```
sudo eggs produce --release
```

# Creating naked starting from archiso

See [arch-naked](https://penguins--eggs-net.translate.goog/book/arch-naked?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en)


# Installing Arch Linux via PXE

One feature of ISO images made with eggs is the ability to be used for network installation . All you have to do is boot the ISO to be installed, open a terminal window and type the command: 

```sudo eggs cuckoo```.

Then all you have to do is boot from the network the machines to be installed and start the calamares or krill installer.

You can also perform an unattended installation with krill, see the [manual](https://penguins-eggs.net/docs/Tutorial/english) or, find assistance in the [telegram Penguins' eggs](https://t.me/penguins_eggs) group.

## Note
In Arch - at the moment - I was able to boot via PXE just on BIOS system not UEFI. I hope someone can suggest a way to fix it to can boot via PXE on UEFI machines too.

# Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
