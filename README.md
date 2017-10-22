# penguins-eggs

![penguins-eggs](https://github.com/pieroproietti/penguins-eggs/blob/master/src/assets/penguins-eggs.png?raw=true)

penguins-eggs is a console utility, still in development, who let you to remaster your system and redistrribuite it with iso images or by the net with PXE.
It include all the necessary service dhcp, dhcp-proxy, tftp and http to realize a fast PXE server who can work alone or in a preesistent architecture LAN.
it is written in nodejs, so ideally can be used with different Linux distro, at the moment it work well with Debian 8 Jessie and Debian 9 Stretch, soon
will include Ubuntu and derivates. For others distros we need to find collaboratores.

The scope of this project is to implement the process of remastering your version of Linux, generate the ISO image, burn it on a DVD/install on usb key or
perform a remote boot on your lan.

penguins-eggs, at the moment october 22, is again under construction and can have same troubles for people not in confidence with Linux system administration, but can be
already extremely usefull: imagine to install it on an lan and start to manage the computers with it, You can easily install clonezilla on it, or clamav and
you have a tool to backup/restore/sanityze your entire infrastructure. You can, also easily create your organization version of Linux and deploy it on the lan.

You can test it, is a console utility, but don't be scared, it is easy and battery included! All you need is to have to install [node] (https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)

penguins-eggs is a console command - but really with very simple usage, you have only this commands and an option:
* create
* destroy
* serve
* hatch

### create
Will create an iso image of your system

### destroy
Ad the name, will destroy all the infrastructure created

### serve
Will start a PXE server, serving the eggs created (and others if You want)!

### hatch
Will install the egg, or better will hatch the egg and it will became a penguin!


## Testing penguins-eggs
### Prerequisites
Penguins-eggs on Debian depend from this packages, you need to install it, in this way:
``` bash
sudo apt-get update
sudo apt-get install squashfs-tools xorriso live-boot syslinux syslinux-common isolinux pxelinux
```

To test it, you need a functional installation of Linux Debian version 8 or 9, and download eggs from github:
``` bash
 git clone https://github.com/pieroproietti/penguins-eggs
 cd penguins-eggs
 npm i
```
To launch egg

``` bash
 sudo npm  start
```
or
``` bash
./eggs
```

Soon, but not today,  will be possible also to use it directly from npm
``` bash
sudo npm i penguins-egg -g
sudo eggs
```



Of course, you need NodeJs omstalled.

No need other configurations, penguins-eggs are battery included!

## development
If you want the branch develop, give this command before to try:
```
 git clone http://github.com/pieroproietti/penguins-eggs
 cd penguins-eggs
 git checkout develop
```
## [version](src/lib/README.md)
* master at V.0.4.x

## informations
For other informations, write me.

The author
piero.proietti@gmail.com
