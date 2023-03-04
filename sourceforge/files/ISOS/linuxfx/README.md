penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-cyan)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-cyan)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.net/sources-documentation/index.html)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-cyan)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![pkgbuild](https://img.shields.io/badge/pkgbuild-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD)[![iso](https://img.shields.io/badge/iso-images-cyan)](https://sourceforge.net/projects/penguins-eggs/files/ISOS)

# Penguin's eggs remastered ISOs

# user/password
* ```live/evolution```
* ```root/evolution```

All ISOs include eggs, you can udate it with: ```sudo eggs update```.

# LinuxFX

[LunuxFX](https://www.windowsfx.org/) LinuxFX is a Brazilian distribution, currently based on Ubuntu jammy and, therefore, very up-to-date. What characterizes it is mainly the graphics in full Windows 11 style, but the capabilities should not be underestimated - to run Windows applications. It is currently ranked 22 on distrowatch, and for this kind of distribution it is certainly a good position. Without thinking too much about it I come to suggest it for facilitating the transition of users from Windows to Linux in companies, remastered with eggs it naturally allows installation via PXE and unattended and, for that may be even more interesting.

I lack information about real compatibility with Windows programs, generally many vertical applications developed with Visual Basic 6 and using ADO, should not work, I hope to be proven wrong.

* **egg-of-linuxfx-jammy-plasma** A remastered version of LinuxFX theme plasma
* **egg-of-linuxfx-jammy-cinnamon** A remastered version of LinuxFX theme cinnamon

# Installing LinuxFX via PXE

One feature of ISO images made with eggs is the ability to be used for network installation . All you have to do is boot the ISO to be installed, open a terminal window and type the command: 

```sudo eggs cuckoo```.

Then all you have to do is boot from the network the machines to be installed and start the calamares or krill installer.

You can also perform an unattended installation with krill, see the [manual](https://penguins-eggs.net/book/) or, find assistance in the [telegram penguin's eggs](https://t.me/penguins_eggs) group.


## More informations:

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [LinuxFX](https://www.linuxfx.org/).


Disclaim

__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__


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

Una volta spostata /home/linuxfx /etc/skel, il file .first va rimosso, altrimenti cerca di copiare /home/linuxfx nella home dell'utente e quindi riavvia il sistema. Il file .linuxfx, invece bisogna crearlo, sempre per le stesse ragioni. 
