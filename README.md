# penguins-eggs

![penguins-eggs](https://github.com/pieroproietti/penguins-eggs/blob/master/src/assets/penguins-eggs.png?raw=true)

penguins-eggs is a console utility, still in development, who let you to remaster your system and redistrribuite it with iso images or by the net with PXE,
it include all the necessary service dhcp, dhcp-proxy, tftp and http to realize a fast PXE server who can work alone or in a preesistent architecture LAN.
it is written in nodejs, so ideally can be used with different Linux distro, at the moment it work well with Debian 8 Jessie and Debian 9 Stretch, soon
will include Ubuntu and derivates, for other distro we need to find collaboratores to do it.

In the future, at moment non defined, penguins-eggs will be the package back  to [incubator](http://github.com/pieroproietti/incubator) the project to implement the GUI for the process of remastering your version of Linux, generate an ISO image, burn it on a DVD/install on usb key or performing remote boot from the net.

eggs, at the moment october 22, is again under construction and can have same troubles for people not in confidence with Linux system administration, but in same ways it is already usefull: imagine to install it on an lan and start to manage the computers with it, You can easily deploy your system on the lan or use it to deploy itself or other systems.

You can test it!

penguins-eggs is a console command, but with a very simple use, you have only 5 commands and an option:
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



## Prerequisites
``` bash
sudo apt-get update
sudo apt-get install squashfs-tools xorriso live-boot syslinux syslinux-common isolinux pxelinux

```
Of course, you need NodeJs omstalled.

No need other configurations, or better, all the necessary configurations will be created from the application.

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
