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
```
Modificare eventualmente il file eui-start.sh ```sudo nano eui-start.sh``` per selezionare la lingua desiderata, la configurazione di swap e le altre possibili configurazioni riportate nel sorgente. 

Salvate ed avviare la creazione dell'immagine:

```
./eui-create-image.sh
```

Verrà generata una immagine fast, quindi abbastanza veloce, ed avviato il comando cuckoo.


# Modifiche necessarie rispetto ad una normale immagine

Sono coinvolti 3 file:

* /etc/sudoers.d/eui-users
* /etc/xdg/autostart/eui.desktop
* /usr/bin/eui-start.ch

E' possibile selezionare una particolare customizzazione o crearne una propria, al momento sto cercando di adattare la customizzazione alle varie lingue ed abbiamo:

* bg (bulgaro)
* br (portoghese brasiliano)
* de (tedesco)
* es (spagnolo)
* fr (francese)
* it (italiano)
* nl (olandese)
* pe (spagnolo perù)
* ru (russo)
* uk (ucraino)

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
Serve per avviare l'installazione non appena effettuato il login. Al momento funziona su XFCE, per qualche motivo non avvia l'installazione con cinnamon. Gli altri DE sono da testare.

```
[Desktop Entry]
Encoding=UTF-8
Name=Eggs unattended install
Comment=Start unattended installation
Icon=cinnamon-symbolic
Exec=/usr/bin/eui-start.sh
Terminal=true
Type=Application
Categories=
X-GNOME-Autostart-Phase=Initialization
X-KDE-autostart-phase=1
X-KDE-AutostartScript=true
```

## /usr/bin/eui-start.sh
Al momento, la customizzazione dell'installazione, DEVE essere effettuata modificando questo file:

Si noti il nuovo flag --halt, introdotto per spegnere la macchina dopo l'installazione ed evitare. quindi, ulteriori tentativi nel caso di computer abilitati PXE e con primo dispositivo di boot PXE.

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
