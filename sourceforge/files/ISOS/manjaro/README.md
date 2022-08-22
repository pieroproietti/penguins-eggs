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

# Penguin's eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

All ISOs include eggs, you can udate it with: ```sudo eggs update```.

# Manjaro Linux

[Manjaro](https://manjaro.org/) is a professionally made operating system that is a suitable replacement for Windows or MacOS. Multiple Desktop Environments are available through our Official and Community editions.

* **egg-of-manjarolinux-ruah-naked**
* **egg-of-manjarolinux-ruah-colibri** (1,5G compression fast)

**naked** can be usefull to start everything: just add that you want, **colibri** is more a tool to hack with eggs than a real customization and perhaps can be used to test calamares too. 

NOTE: While waiting to complete the wardrobe for manjaro, it is still possible to switch from the naked configuration to colibri by running the following commands:

* ```eggs wardrobe get```
* ```cd .wardrobe/costumes/colibri```
* ```sudo ./manjaro-colibri.sh```


Following versions are just unchanged remastered versions of originals, but can be used to start a own customization.

* **egg-of-manjarolinux-ruah-xfce-minimal**
* **egg-of-manjarolinux-ruah-kde-minimal**
* **egg-of-manjarolinux-ruah-gnome-minimal**

All this isos, was created installing the original stable and:

```
git clone https://github.com/pieroproietti/penguins-eggs-manjaro
cd penguins-eggs-manjaro
makepkg -srcCi
```
then:
* ```sudo eggs calamares --install```
* ```sudo eggs produce --fast```

and You will get your remasterd iso.

## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [manjaro](https://manjaro.org/).


Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
