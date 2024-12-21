penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![www](https://img.shields.io/badge/www-blog-cyan)](https://penguins-eggs.net)
[![telegram](https://img.shields.io/badge/telegram-group-cyan)](https://t.me/penguins_eggs)
[![basket](https://img.shields.io/badge/basket-naked-blue)](https://penguins-eggs.net/basket/)
[![gdrive](https://img.shields.io/badge/gdrive-all-blue)](https://drive.google.com/drive/folders/19fwjvsZiW0Dspu2Iq-fQN0J-PDbKBlYY)
[![sourceforge](https://img.shields.io/badge/sourceforge-all-blue)](https://sourceforge.net/projects/penguins-eggs/files/)
[![ver](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)


# Penguins' eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

# blendOS

[blendOS](https://blendos.co/) the only operating system you'll ever need. A seamless blend of all Linux distributions, Android apps and web apps.

blendOS ships the latest-and-greatest desktop environments, including GNOME 43.4 and KDE Plasma 5.27 without any modifications, giving you a vanilla experience, thanks to the Arch base!

# blendOS re-created by assemble
This ISOs are created using [assemble](https://github.com/blend-os/assemble) and the standard procedure described on [blendOS Documentation](https://docs.blendos.co/docs/build-blend/building_blendos)

* **blendOS-xfce** 
* **blendOS-cinnamon** 
* **blendOS-deepin** 
* **blendOS-gnome** 
* **blendOS-plasma**

![gnome](https://www.gnome.org/wp-content/uploads/2023/02/wgo-splash-40.webp)

# blendOS remastered with penguins-eggs
This ISOs are created using [penguins-eggs](https://github.com/pieroproietti/penguins-eggs) as described on [penguins-blog](https://penguins-eggs.net/blog/build-blendos-image).

## **egg-of-blendos-colibri**
A light xfce4 for developers you can easily start to improve eggs by installing colibri.

![colibri](https://a.fsdn.com/con/app/proj/penguins-eggs/screenshots/colibri.png/245/183)

## **egg-of-blendos-duck**
cinnamon, office, multimedia and all that is needed for most users

![duck](https://a.fsdn.com/con/app/proj/penguins-eggs/screenshots/duck.png/245/183)


## Notes about penguins-eggs way
At the moment I'm doing a job of "adapting" penguins-eggs to [blendOS](https://blendos.co/), being a rather particular distribution, especially for immutability.

This, as I understand it, is handled by the [`akshara`](https://github.com/blend-os/akshara) hook which I then simply remove it, before I remove it and replaced with [`blend`](https://github.com/blend-os/blend) hook as was the case for the first versions. 

It's right? It's not right? I don't know really, also I wrote a simple theme in [penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe) called `blendos` That reintroduces the akshara hook during the installation of the system.

I use to create this remaster [chaotic-aur](https://aur.chaotic.cx/) where I get calamares and also penguins-eggs. Recently, given a problem with the [calamares-git](https://aur.archlinux.org/packages/calamares-git) package on [AUR](https://aur.archlinux.org/), I switched to a personal [calamares-eggs](https://github.com/pieroproietti/eggs-pkgbuilds/tree/master/aur/calamares-eggs) not yet on chaotic-aur.

That said, in a nutshell, **this way to remaster blendOS is absolutely not the original**. Rather, it is my attempt to keep up with the times and include compatibility with this - in some ways revolutionary - distribution.

# Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
