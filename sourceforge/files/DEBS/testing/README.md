Penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguin's eggs Debian TESTING packages

Please, don't use this package for installations, they have just the pourpouse to be TESTED and can be extremally BUGGED!!!

# Discussion

You can partecipate to discussion joining on [telegram channel](https://t.me/penguins_eggs).

# EducaAndDOS theme

Work in progress... 

To: [aosucas499](https://github.com/aosucas499)

# EducaAndOS

First tempt to build a template external to eggs.

## usage:

```
sudo eggs produce --fast --theme ../path/to/theme
```
## example

Clone this theme:

```
git clone https://github.com/pieroproietti/theme-educaandos-plus```
```

And produce your iso:

```
sudo eggs produce --fast  --theme ../educaandos-pluc
```


## theme modifications:
* started with your guadalinex
* added:
  * livecd/grub.theme.cfg (please take cure to adapt the colors)
  * livecd/isolinux.theme.cfg (please take cure to adapt the colors)

* updated applications/install-debian.desktop (you don't need to use sudo with calamares it you installed it with ```sudo eggs calaamres --install```. This command not only install calamares and dependencies but also configure policy for it.

 ## general modifications:
* I use to configure my user with autologin, simply edit /etc/gdm/custom.conf

```
[daemon]
AutomaticLoginEnable=true
AutomaticLogin=artisan
```

In this way You will get the live user to autologin too.

* Note: I call just a sed command, so don't use spaces: AutomaticLogin=artisan



* copied your ```users.yml``` to /usr/lib/penguins-eggs/conf/distros/focal/calamares/modules/users.yml

I think to place your ```users.yml``` inside the theme under calamares/modules, but this will happen in future.
