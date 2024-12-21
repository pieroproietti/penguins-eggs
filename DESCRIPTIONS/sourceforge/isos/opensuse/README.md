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

# OpenSuSE

OpenSuSE needs no introduction, in [“Musica ribelle”](https://www.youtube.com/watch?v=KwQ_BqUCB4E) [Eugenio Finardi](https://it.wikipedia.org/wiki/Eugenio_Finardi) sang about the “gates of the cosmos that are up in Germany”, it is still like that!

As with Fedora we are in our beginnings, but another door has opened, the gates of the cosmos!

The configurations for dracut are in the [dracut](https://github.com/pieroproietti/penguins-eggs/tree/master/dracut) folder.

Boot params for our ISO are created on ovary.ts, this is a sample:
```
ppend initrd=/live/initrd-6.10.8-1-default root=live:CDLABEL=colibri rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs
```
It's now full functional, can be installed with `sudo eggs install -u`, the installed system can be customized and remesterized again.




