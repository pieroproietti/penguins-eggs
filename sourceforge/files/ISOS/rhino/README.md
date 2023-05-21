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

All ISOs are based on Rhino Linux 

# user/password
* ```live/evolution```
* ```root/evolution```

# Rhino Linux
Rhino Linux re-invents the Ubuntu experience as a rolling release distribution atop a stable Desktop Environment. Pacstall is at the very heart of the distribution, providing essential packages such as the Linux kernel, Firefox, Rhino Linux specific applications and theming.

All ISOs include eggs, you can udate it with: ```sudo eggs update```.

* **egg-of-ubuntu-devel-xfce** - a remaster of [Rhino Linu x86_64](https://github.com/rhino-linux/os/releases/download/2023.1-beta5/Rhino-Linux-2023.1-beta5-amd64.iso)


# Calamares note
At this stage there is a problem with Rhino Linux remastering regarding calamares: the installation proceeds normally until localization, after which it terminates.

I tryed to change this two modules:
* `shellprocess_bug-LP#1829805.yml`
* `before_bootloader_mkdirs_context.yml`
* `after_bootloader_context.yml`

After that, reconfigure eggs:
`sudo eggs dad -d`

But again there are problems in bootloader phase and calamares exit.

If you want to use for theme, the original rhino adapted to eggs, use the following commands:
`eggs wardrobe get`
`sudo eggs produce --max --theme .wardrobe/themes/rhino`

While waiting to solve the problem, I would be grateful if someone could give suggestions, it is still possible to install this version, by opening a terminal window and proceeding with the installe CLI, with the command: `sudo eggs install`.

## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [Rhino Linux](https://rhinolinux.org/).

# Disclaim
__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__

