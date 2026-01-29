eggs(1) -- the reproductive system of penguins: eggs v{{{packageVersion}}}
==========================================================================

{{toc}}

# SYNOPSIS
eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as live ISO image.

# INSTALL

penguins-eggs as an AppImage, it can be installed on all supported distributions. Download it from https://github.com/pieroproietti/penguins-eggs/releases, then run the following commands:
```
$ chmod +x {{{packageNameVersioned}}}-x86_64.AppImage
$ sudo mv /usr/local/bin
$ sudo eggs setup
```

AlpineLinux
```
$ doas apk add penguins-eggs@testing
```
AlmaLinux/RockyLinux
```
$ sudo dnf install ./{{{packageNameVersioned}}}-1rocky9.5..x86_64.rpm

```
Arch
```
$ sudo pacman -S penguins-eggs
$ sudo pacman -U {{{packageNameVersioned}}}-1-x86_64.pkg.tar.zst
```

Debian/Devuan/Ubuntu
```
$ sudo apt install penguins-eggs
$ sudo dpkg -i {{{packageNameVersioned}}}.deb
```
Fedora
```
$ sudo dnf install ./{{{packageNameVersioned}}}-1fedora.x86_64.rpm
```

Manjaro
```
$ sudo pamac install penguins-eggs
```

OpenMamba
```
$ sudo dnf install ./{{{packageNameVersioned}}}-1mamba.x86_64.rpm
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
sudo eggs produce --pendrive --clone
sudo eggs kill
```

There are too two interactive helpers, probably you already know:

```
eggs mom
sudo eggs dad
```
We have a comprehensive guide at https://penguins-eggs.net, help yorself signing on telegram https://t.me/penguins_eggs on  facebook group, or writing me.


# DESCRIPTION

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO image, to burn on a CD/DVD or copy to a usb key, to boot your system live. Of course, You can easily install your live image using GUI installer (calamares)  or CLI installer (krill) always included.

# COMMANDS

{{{commands}}}

# FILES
      /etc/penguins-eggs.d
        all eggs configurations are here

      /etc/penguins-eggs.d/exclude.list
        exclude.list

      /usr/lib/penguins-eggs
        where eggs is installed

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
