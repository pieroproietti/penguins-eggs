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

# AlpineLinux

I have not yet been able to get my [packages](https://gitlab.alpinelinux.org/pieroproietti/aports/) accepted on AlpineLinux, pending approval, you can find them here.

copy `piero.proietti@gmail.com-68452915.rsa.pub` on `/etc/apk/keys/`.

## penguins-sidecar

The idea for [penguins-sidecar](https://github.com/pieroproietti/penguins-sidecar) came from the first tempts to get Alpine working with eggs. I added to script on initram-fs to let Alpine to welcome the new way to boot, from that come `sidecar`.


Actually the script is included on initramfs-init, and - before to produce ISOs, copy it on the right posistion:  ```
doas cp main/sidecar/initramfs-init /usr/share/mkinitfs/initramfs-init


```

![](https://www.alpinelinux.org/alpinelinux-logo.svg)