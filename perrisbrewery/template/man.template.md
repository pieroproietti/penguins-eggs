eggs(1) -- the reproductive system of penguins: eggs v{{{packageVersion}}}
==========================================================================

{{toc}}

# SYNOPSIS
Install Debian families (debian/devuan/ubuntu)
```
$ sudo dpkg -i {{{packageNameVersioned}}}.deb
```

Install Arch families (Arch, manjaro Linux)

Arch from AUR
```
$ git clone https://aur.archlinux.org/penguins-eggs.git
$ cd penguins-eggs.git
$ makepkg -si
```

Arch from development repo
```
$ git clone https://github.com/pieroproietti/penguins-eggs-arch
$ cd penguins-eggs-arch
$ makepkg -si
```

Manjaro from development repo
```
$ git clone https://github.com/pieroproietti/penguins-eggs-manjaro
$ cd penguins-eggs-manjaro
$ makepkg -si
```

# USAGE

```
$ eggs (-v|--version|version)

penguins-eggs/{{{packageVersion}}} {{{linuxVersion}}} {{{nodeVersion}}}
$ eggs --help [COMMAND]

USAGE
$ eggs COMMAND
```

Most of the commands of eggs need sudo, but there are exceptions for export, info and mom.

examples:

```
sudo eggs produce
sudo eggs produce --max
sudo eggs produce --clone
sudo eggs kill
```

There are too two interactive helpers:

```
eggs mom
sudo eggs dad
sudo eggs dad -d
```

Help yorself signing on telegram https://t.me/penguins_eggs or in facebook group page or asking me.


# DESCRIPTION

eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso image.

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb key to boot your system. You can easily install your live system with gui installer (calamares)  or eggs CLI installer (krill).

# COMMANDS

{{{commands}}}

# FILES
      /etc/penguins-eggs.d
        all eggs configurations are here

      /etc/penguins-eggs.d/exclude.list
        exclude.list rsync

      /usr/lib/penguins-eggs (deb package)
        here eggs is installed

# TROUBLES

## BUGS

Report problems o new ideas in: <https://github.com/pieroproietti/penguins-eggs/issues>

# RESOURCES AND DOCUMENTATION
Consult website to find  documentation

* website: **https://penguins-eggs.net**
* gitHub repository: **https://github.com/pieroproietti/penguins-eggs**
* telegram: **https://t.me/penguins_eggs**

# AUTHOR

Piero Proietti <piero.proietti@gmail.com>
