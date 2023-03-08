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

```
#!/bin/env bash
if mountpoint -q "/lib/live/mount"; then 
    # isLive

    # try to read /etc/hostname from /dev/sda
    sudo mount "/dev/sda2" "/mnt"
    OS_HOSTNAME=$(/usr/bin/cat /mnt/etc/hostname)
    sudo umount "/dev/sda2"
    sudo echo "I will completely format local system: ${OS_HOSTNAME}"

    # we need to reset connection    
    nmcli networking off
    nmcli networking on

    echo -n "Wait a minute for installation or CTRL-C to abort.";
    for _ in {1..60}; do read -rs -n1 -t1 || printf ".";done;echo
    sudo eggs install -unrd .local
else  
    # isInstalled
    sudo rm /etc/sudoers.d/eui-users
    sudo rm /usr/bin/eui-start.sh
    sudo rm /etc/xdg/autostart/eui.desktop
fi
```