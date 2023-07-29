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

All ISOs include eggs, you can udate it with: ```sudo eggs update```.

# Sparkylinux

This is a remaster - made with eggs - of Sparkylinux.

I just downloaded the original ISO, installed it, give a general update and installed penguins-eggs.

After that, just:

`sudo eggs dad -d`
`sudo eggs calamares --install`
`sudo eggs produce --max`

From their site:

SparkyLinux is a GNU/Linux distribution based on the Debian GNU/Linux operating system.

Sparky is a fast, lightweight and fully customizable operating system which offers several versions for different use cases. [Read more…](https://sparkylinux.org/about/)


NOTE: Sparkly linux provides its own version of calamares, unfortunately this one has incompatibilities with eggs, so you'd better install the debian version.

```
apt-cache policy calamares

 Installed: 3.2.61-1+b1
  Candidate: 3.2.61~sparky7~3-1
  Version table:
 *** 3.2.61-1+b1 500
        500 http://deb.debian.org/debian bookworm/main amd64 Packages
        100 /var/lib/dpkg/status
     3.2.61~sparky7~3-1 1001
       1001 https://repo.sparkylinux.org orion/main amd64 Packages
```

We can proceed in this way:

```sudo apt install calamares=3.2.61-1+b1```

After that is better to look apt upgrade of calamares, just use:

```
sudo apt-mark hold calamares
```

More informations:

* [Sparkylinux](https://sparkylinux.org/) 


## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [Sparkylinux](https://sparkylinux.org/) 


Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__
