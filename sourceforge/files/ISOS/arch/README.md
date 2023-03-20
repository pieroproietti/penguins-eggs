penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)
s
# Penguins' eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

All ISOs include eggs, you can udate it with: ```sudo eggs update```.

# Arch

[Arch](https://archlinux.org/) a simple, lightweight distribution.

# Important note

I am putting arch and manjaro back on line, it had been two months that I had been having problems and, busy with other development, I had stopped dealing with these two important distributions.

At the moment I have made images with the --clone option, this is because it allows me to use eggs both in production of the iso and in installation from the sources, without having to go through the creation of a PKGBUILD.

### install the live 
* boot the machine from the image;
* login;
* ```cd penguins-eggs```
* ```sudo ./eggs install -un```

### Replicate 
* ```cd penguins-eggs```
* ```pnpm i```
* ```sudo ./eggs dad -d```
* ```sudo ./eggs produce --clone```


Arch and Manjaro share the same PKGBUILD packages, reviewed by Stefano Capitali of Manjaro.

* [AUR penguins-eggs](https://aur.archlinux.org/packages/penguins-eggs) (Arch Linux/manjaro) stable
* [github penguins-eggs-arch](https://github.com/pieroproietti/penguins-eggs-arch) (Arch Linux/manjaro) Developing
* [github penguins-calamares-arch](https://github.com/pieroproietti/penguins-calamares-arch)  (Arch Linux) Here I have troubles, help if You can!

### Have fun!

* **egg-of-arch-rolling-naked** Just the juice, without GUI. You can start here to build your revolution!
* **egg-of-arch-rolling-colibri** A light xfce4 for developers you can easily start to improve eggs installing colibri.

# USE

**naked** can be usefull to start everything: just add that you want, **colibri** is more a tool to hack with eggs than a real customization and perhaps can be used to test calamares too. 

NOTE: While waiting to complete the wardrobe for arch, it is still possible to switch from the naked configuration to colibri by running the following commands:

* ```eggs wardrobe get```
* ```cd .wardrobe/costumes/colibri```
* ```sudo ./arch-colibri.sh```

# Installing eggs and producing an iso 

```
git clone https://aur.archlinux.org/packages/penguins-eggs
cd penguins-eggs-manjaro
makepkg -srcCi
```

Eggs, is installed!

We can autoconfigure it, with the help of dad:

```
sudo eggs dad -d
```

And produce our iso:

```
sudo eggs produce --fast
```

and You will get your remasterd iso installable with krill.

# Installing calamares

## prerequisites
We need: ttf-comfortaa, ckbcomp and mkinitcpio-openswap as they are dependencies.

Let's install them.

### ttf-comfortaa
```
git clone https://aur.archlinux.org/ttf-comfortaa.git

cd ttf-comfortaa

makepkg -srcCi
```

### ckbcomp
```
git clone https://aur.archlinux.org/ckbcomp.git

cd ckbcomp

makepkg -srcCi
```

### mkinitcpio-openswap

```
git clone https://aur.archlinux.org/mkinitcpio-openswap.git

cd mkinitcpio-openswap

makepkg -srcCi
```

## build calamares
```
git clone https://gitlab.manjaro.org/packages/extra/calamares

cd calamares

makepkg -srcCi
```

At this point we need to reconfigure eggs:

```
sudo eggs dad -d
```

and let eggs to configure calamares to get used without password:

```
sudo eggs calamares --install
```

At this point we are ready to create our iso:

```
sudo eggs produce --fast
```

If you want calamares and eggs to be removed during installation, simply use:

```
sudo eggs produce --fast --release
```

# Creating naked starting from archiso
See [arch-naked](https://penguins--eggs-net.translate.goog/book/arch-naked?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en)


# Installing Arch Linux via PXE

One feature of ISO images made with eggs is the ability to be used for network installation . All you have to do is boot the ISO to be installed, open a terminal window and type the command: 

```sudo eggs cuckoo```.

Then all you have to do is boot from the network the machines to be installed and start the calamares or krill installer.

You can also perform an unattended installation with krill, see the [manual](https://penguins-eggs.net/book/) or, find assistance in the [telegram Penguins' eggs](https://t.me/penguins_eggs) group.

## Note
In Arch - at the moment - I was able to boot via PXE just on BIOS system not UEFI. I hope someone can suggest a way to fix that and boot via PXE on UEFI machines too.


## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [Arch](https://archlinux.org/).


Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
