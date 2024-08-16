penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguins' eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

![](https://alpinelinux.org/alpinelinux-logo.svg)

# AlpineLinux Small. Simple. Secure.

[AlpineLinux](https://alpinelinux.org/), is a security-oriented, lightweight Linux distribution based on musl libc and busybox.

* **egg-of-alpine-colibri** An experimental version from Alpine standard. Look on discussion [Way to Alpine](https://github.com/pieroproietti/penguins-eggs/discussions/377).

NOTE: Yuo can add `linux-firmware` to use on real hardware.

* You can find more informations on this Linux distro at: [AlpineLinux](https://alpinelinux.org/).

# Important notes 
This image will boot only on BIOS systems and will go on `emergency shell`. From the emergency shell:

  * `mkdir /mnt`
  * `mount /dev/sr0 /mnt`
  * type `exit`
  * `/mnt/live/sidecar.sh`
  * type `exit`

The system will boot normally. Remember, user: `artisan` password: `evolution`.

You can safety install it using krill, and once installed, it's possible to update, install firmware, change it and remaster again.

The main limits, are: my Alpine remastered is not yet able to boot from ISO on UEFI, I wrote a [package for Alpine](https://gitlab.alpinelinux.org/pieroproietti/aports/-/tree/master/testing/penguins-eggs) on testing.

Extend penguins-eggs to Alpine Linux is a work in progress, please help!

## Video
I did a video: produce an ISO from Alpine Linux, boot another system with the live and install it using krill a CLI system installer.

* [A new penguin](https://youtu.be/VC4ihHRb1R0)

## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

# Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
