penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/docs/Tutorial/eggs-users-guide)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![Packages](https://img.shields.io/badge/packages-binary-blue)](https://sourceforge.net/projects/penguins-eggs/files/Packages)
[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)


# Penguins' eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

# EndeavourOS

[EndeavourOS](https://endeavouros.com/) a terminal-centric distro with a vibrant and friendly community at its core

* **egg-of-endeavouros-xfce** xfce4 desktop
* **egg-of-endeavouros-cinnamon**  cinnamon desktop

# Calamares

Installing calamares from EndeavourOS repository will not work with `penguins-eggs`, I excluded it from upload in `/etc/pacman.conf` 

```
# Pacman won't upgrade packages listed in IgnorePkg and members of IgnoreGroup
IgnorePkg   = calamares
```

Then I added [chaotic-aur](https://aur.chaotic.cx/) (follow the instrtuction on the site) and installed calamares with `yay calamares`.

At this point we need now to reconfigure eggs:

```
sudo eggs dad -d
```

Then we are ready to create our first iso:

```
sudo eggs produce
```

**NOTE**: If you want calamares and eggs to be removed after the system installation finish, simply use:

```
sudo eggs produce --release
```

# Installing EndeavourOS via PXE

One feature of ISO images made with eggs is the ability to be used for network installation . All you have to do is boot the ISO to be installed, open a terminal window and type the command: 

```sudo eggs cuckoo```.

Then all you have to do is boot from the network the machines to be installed and start the calamares or krill installer.

You can also perform an unattended installation with krill, see the [manual](https://penguins-eggs.net/docs/Tutorial/english) or, find assistance in the [telegram Penguins' eggs](https://t.me/penguins_eggs) group.

## Note
In EndeavourOS - at the moment - I was able to boot via PXE just on BIOS system not UEFI. I hope someone can suggest a way to fix it to can boot via PXE on UEFI machines too.

# Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
