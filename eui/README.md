# eggs unattended install

Eggs unattended install Is based on simple scripts:
* ```eui-create-image.sh``` creates the image;
* ```eui-start.sh``` is copied into ```/usr/bin/```
* ```eui-users``` contains the list of users enabled to sudo WITHOUT password, it is copied to ```/etc/sudoers.d/```;
* ```eui-autostart-[xfce/cinnamon].desktop``` starts automatic installation at login and is copied to ```/etc/xdg/autostart```.

The three files `eui-start.sh`, `eui-users` and `eui-*.desktop` are deleted from the destination directory as soon as the production of the image is completed

# Creation of an EUI image
To create an ISO with unattended-install capability, proceed as follows:

```
cd /usr/lib/penguins-eggs/eui
```
If necessary, modify the `eui-start.sh` file `sudo nano eui-start.sh` to select the desired language, swap configuration, and other possible configurations given in the source. 

Save and start the image creation:
```
./eui-create-image.sh
```

An image with fast compression will be generated, and the cuckoo command will be started to distribute it.

**Note:** once the image is created. simply start 'eggs cuckoo' to distribute it, no need to regenerate it


# Differences of a UEI image versus a normal image

Self-starting of the installer is done through the following files:

* /etc/sudoers.d/eui-users
* /etc/xdg/autostart/eui-[xfce/cinnamon].desktop
* /usr/bin/eui-start.ch

You can select a particular customization or create your own, at the moment I am trying to adapt the customization to the various languages and we have:

* bg (Bulgarian)
* br (Brazilian Portuguese)
* de (German)
* es (Spanish)
* fr (French)
* it (Italian)
* nl (Dutch)
* pe (Spanish Peru)
* ru (Russian)
* uk (ukrainian)

## /etc/sudoers.d/eui-users

It is copied inside `/etc/sudoers.d`, MUST be owned by root and have rights 0440

```
live ALL=(ALL) NOPASSWD: ALL
artisan ALL=(ALL) NOPASSWD: ALL
```

##  /etc/xdg/autostart/eui-autostart-[xdce/cinnamon].desktop
It is the file that makes it possible to auto-start the installer: there are currently two working versions, one for XFCE and one for cinnamon;

```
[Desktop Entry]
Encoding=UTF-8
Name=Eggs unattended install
Comment=Start unattended installation
Icon=cinnamon-symbolic
Type=Application
Categories=
X-GNOME-Autostart-Phase=Initialization
X-KDE-autostart-phase=1
X-KDE-AutostartScript=true
# XFCE working
Exec=/usr/bin/sudo /usr/bin/eui-start.sh
Terminal=true
```

## /usr/bin/eui-start.sh
Currently, customization of the installation, MUST be done by editing this file.

```
set -Eeuo pipefail

if mountpoint -q "/lib/live/mount"; then 
    # if isLive
    echo "E G G S: the reproductive system of penguins"
    echo
    echo "WARNING: A fully automated system installation is about to start,"
    echo "         ALL data on the hard drive present will be ERASED!"
    echo


    OS_HOSTNAME="NOT-CHECKED"
    # we must to check in same wat that we are formatting

    # TO DO

    # we need to reset connection    
    nmcli networking off
    nmcli networking on
    
    echo "I will completely format local system: ${OS_HOSTNAME}"
    echo
    echo "Installation will start in one minute, press CTRL-C to abort!"
    echo 
    echo -n "Waiting...";
    for _ in {1..59}; do read -rs -n1 -t1 || printf ".";done;echo

    ##################################################
    # At the moment we need to configure manually here
    ##################################################
    # USAGE
    #
    # $ eggs install [-k] [-c <value>] [-d <value>] [-h] [-i] [-n] [-N] [-p] [-r] [-s] [-S] [-u] [-v]
    #
    # FLAGS
    # -H, --halt            Halt the system after installation
    # -N, --none            Swap none: 256M
    # -S, --suspend         Swap suspend: RAM x 2
    # -c, --custom=<value>  custom unattended configuration
    # -d, --domain=<value>  Domain name, defult: .local
    # -h, --help            Show CLI help.
    # -i, --ip              hostname as ip, eg: ip-192-168-1-33
    # -k, --crypted         Crypted CLI installation
    # -n, --nointeractive   no user interaction
    # -p, --pve             Proxmox VE install
    # -r, --random          Add random to hostname, eg: colibri-ay420dt
    # -s, --small           Swap small: RAM
    # -u, --unattended      Unattended installation
    # -v, --verbose         Verbose
    eggs install --custom=it --domain=.local --random --nointeractive --halt
else  
    # isInstalled
    sudo rm -f /etc/sudoers.d/eui-users
    sudo rm -f /usr/bin/eui-start.sh
    sudo rm -f /etc/xdg/autostart/eui.desktop
fi
```
**Note:** look at the new `--halt` flag, introduced to shut down the machine after installation and avoid. thus, further attempts in the case of PXE-enabled computers and with first PXE boot device.

# Video
I am not very skilled at producing movies, even less so as an actor, I made this videos, I hope it will help you.

* [using PXE and EUI from ISO](https://youtu.be/rYvCzGO3V6k)
* [Create a Live EUI - Eggs Unattended Installation](https://youtu.be/QBjkxxoc8ho) 


