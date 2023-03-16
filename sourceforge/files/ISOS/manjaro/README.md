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

# Penguins' eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

All ISOs include eggs, you can udate it with: ```sudo eggs update```.

# Manjaro Linux

[Manjaro](https://manjaro.org/) is a professionally made operating system that is a suitable replacement for Windows or MacOS. Multiple Desktop Environments are available through our Official and Community editions.


I am putting arch and manjaro back on line, it had been two months that I had been having problems and, busy with other development, I had stopped dealing with these two important distributions.

At the moment I have made images with the --clone option, this is because it allows me to use eggs both in production of the iso and in installation of it without having to go through the creation of a PKGBUILD.

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

### Have fun!

* **egg-of-manjarolinux-sikaris-colibri_clone**

**naked** can be usefull to start everything: just add that you want, **colibri** is more a tool to hack with eggs than a real customization and perhaps can be used to test calamares too. 

# Installing eggs and producing an iso
```
git clone https://github.com/pieroproietti/penguins-eggs-manjaro
cd penguins-eggs-manjaro
makepkg -srcCi
```
then:
* ```sudo eggs calamares --install```
* ```sudo eggs produce --fast```

and You will get your remasterd iso.


# Installing manjaro Linux via PXE

One feature of ISO images made with eggs is the ability to be used for network installation . All you have to do is boot the ISO to be installed, open a terminal window and type the command: 

```sudo eggs cuckoo```.

Then all you have to do is boot from the network the machines to be installed and start the calamares or krill installer.

You can also perform an unattended installation with krill, see the [manual](https://penguins-eggs.net/book/) or, find assistance in the [telegram Penguins' eggs](https://t.me/penguins_eggs) group.


## Note
In manjaro - at the moment - I was able to boot via PXE just on BIOS system not UEFI. I hope someone can suggest a way to fix that and boot via PXE on UEFI machines too.

## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [manjaro](https://manjaro.org/).


Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
