# eggs unattended install

Eggs unattended install è basato su semplici script:
* ```eui-create-image.sh``` crea l'immagine;
* ```eui-start.sh``` viene copiato in ```/usr/bin/```
* ```eui-users``` lista degli utenti abilitati a sudo SENZA password, viene copiato in ```/etc/sudoers.d/```;
* ```eui.desktop``` avvia l'installazione automatica al login e viene copiato in ```/etc/xdg/autostart```.

I tre file eui-start.sh, eui-users ed eui.desktop vengono eliminati dalla directory di destinazione non appena completata la produzione dell'immagine.

# Creazione di una ISO eui
Per creare una ISO con possibilità di unattended-install, procedere come segue:

```
cd /usr/lib/penguins-eggs/eui
./eui-create-image.sh
```

Verrà generata una immagine fast, quindi abbastanza veloce, e lanciato il comando cuckoo.


# Modifiche necessarie rispetto ad una normale immagine

Sono coinvolti 3 file:
* /etc/sudoers.d/eui-users
* /etc/xdg/autostart/eui.desktop
* /usr/bin/eui-start.ch

Vediamoli uno ad uno

## /etc/sudoers.d/eui-users

Create a file:
```
sudo nano /etc/sudoers.d/eui-users
```
and copy and past, following code:

```
live ALL=(ALL) NOPASSWD: /usr/bin/eui-start.sh
artisan ALL=(ALL) NOPASSWD: /usr/bin/eui-start.sh
```
Change permissions to /etc/sudoers.d/eui-users
```
chmod 0440 /etc/sudoers.d/eui-users
```

##  /etc/xdg/autostart/eui.desktop

```
[Desktop Entry]
Type=Application
Name=Eggs unattended install
Exec=sudo /usr/bin/eui-start.sh
StartupNotify=false
NoDisplay=true
Terminal=true  #basically will open terminal and people can see the script executing
```

## /usr/bin/eui-start.sh
Al momento, la customizzazione dell'installazione, DEVE essere effettuata modificando questo file:

```
#!/bin/bash
set -Eeuo pipefail

if mountpoint -q "/lib/live/mount"; then 
    # if isLive
    echo "E G G S: the reproductive system of penguins"
    echo
    echo "WARNING: A fully automated system installation is about to start,"
    echo "         ALL data on the hard drive present will be ERASED!"
    echo

    # try to read /etc/hostname from /dev/sda
    sudo mount "/dev/sda2" "/mnt"
    OS_HOSTNAME=$(/usr/bin/cat /mnt/etc/hostname)
    sudo umount "/dev/sda2"

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
    eggs install --custom=it --domain=.local --random --nointeractive
else  
    # isInstalled
    sudo rm -f /etc/sudoers.d/eui-users
    sudo rm -f /usr/bin/eui-start.sh
    sudo rm -f /etc/xdg/autostart/eui.desktop
fi
```