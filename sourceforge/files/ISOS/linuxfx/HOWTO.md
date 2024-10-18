penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![www](https://img.shields.io/badge/www-blog-cyan)](https://penguins-eggs.net)
[![telegram](https://img.shields.io/badge/telegram-group-cyan)](https://t.me/penguins_eggs)
[![isos](https://img.shields.io/badge/images-ISO-blue)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)
[![pkg](https://img.shields.io/badge/packages-bin-blue)](https://sourceforge.net/projects/penguins-eggs/files/Packages)
[![ver](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)

# LinuxFx

LinuxFx esiste in due versioni, una denominata win10-theme-cinnamon e l'altra win11-theme-plasma.

Le due versioni differiscono per la parte grafica, la prima utilizza principalmente cinnamon mentre la seconda utilizza plasma.

Rispetto allo standard delle distribuzioni Linux vi è il fatto di avere impostata una directory sotto /home/linuxfx che viene usata come skel dei nuovi utenti al posto della più canonica /etc/skel.

La versione cinnamon è ad ogni modo più standard, rimuove correttamente calamares dopo l'installazione - anche se ha qualche problema su dischi già formattati - e non presenta particolari directory sulla radice del disco. Anch'essa presenta una directory /home/linuxfx utilizzata come skel e necessaria, ma questa non ha impostati i diritti 777 come la corrispettiva in plasma.

# Linuxfx cinnamon
installo linuxfx-11.2.22.04.7-win10-theme-cinnamon-wxd-13.0.iso scelgo come utente: artisan/evolution ;
* reboot
* login e si riavvia da solo per copiare il contenuto di /home/linuxfx in /home/artisan
* riavvio, scarico eggs e lo installo: sudo dpkg -i eggs_9.3.30_amd64.deb | apt install -f
* sudo nano /etc/os-release (cambio ID=ubuntu ad ID=linuxfx. per praticità altrimenti mi segnala sempre Ubuntu jammy)
* sudo eggs dad -d
* sudo eggs calamares --install
* sudo eggs tools clean
* sudo rm /etc/skel -rf # rimuovo /etc/skel
* sudo mv /home/linuxfx /etc/skel # e ci metto linuxfx
* sudo rm /etc/skel/.first 
* sudo touch /etc/skel/.linuxfx
* sudo eggs produce --max 
oppure, se voglio la rimozione di eggs e calamares una volta installato:
* sudo eggs produce --max --release

La reinstallazione è eseguita correttamente, si può impostare un nome utente ed un nome macchina diverso, etc.

# Linuxfx plasma
Installo linuxfx-11.2.22.04.7-win11-theme-plasma-wxd-13.0.iso, scelgo come utente: artisan/evolution ;
* reboot;
* login e si riavvia da solo per copiare il contenuto di /home/linuxfx in /home/artisan;
* apro il terminale ed effettuo un apt update, apt full-upgrade
* sudo apt purge calameres
* rm /calamares -rf # contiene la configurazione di calamares
* rm /developers -rf # contiene solo un file deb
* scarico eggs e lo installo: sudo dpkg -i eggs_9.3.30_amd64.deb | apt install -f
* sudo nano /etc/os-release (cambio ID=ubuntu ad ID=linuxfx. per praticità altrimenti mi segnala sempre Ubuntu jammy)
* installo calamares: sudo eggs calamares --install
* sudo eggs dad -d  # mi restituisce correttamente egg-of-linuxfx-jammy-plasma... 
* sudo rm /etc/skel -rf # rimuovo /etc/skel
* sudo mv /home/linuxfx /etc/skel # e ci metto linuxfx
* sudo rm /etc/skel/.first 
* sudo touch /etc/skel/.linuxfx
* sudo eggs tools clean # rimuove la cache di apt e varie 
* ho rimosso anche i vecchi kernel, ce ne era uno... si individuano con un ls /boot
* sudo eggs produce --max --release

# Considerazioni

Il "trucco", sta in /home/linuxfx che è la skel di linuxfx, e nei file .first e .linuxfx. 

Una volta ridenominata /home/linuxfx come /etc/skel, il file .first va rimosso, altrimenti cerca di copiare /home/linuxfx nella home dell'utente e quindi riavvia il sistema. Il file .linuxfx, invece bisogna crearlo, sempre per le stesse ragioni. 

Ovviamente, per le stesse ragioni, rimasterizzando una linuxfx, non va assolutamente utilizzato il comando ```sudo eggs tools skel```.

Questa guida vale per la prima rimasterizzazione, una volta ottenuta questa le rimasterizzazioni successive non avranno bisogno delle medesime operazioni.
