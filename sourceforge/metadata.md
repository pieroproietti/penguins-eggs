# sourceforge/admin/metadata


# Italiano
## full description
Penguin's eggs è una utility da terminale, in attivo sviluppo, che ti permette di rimasterizzare il tuo sistema e redistribuirlo come immagine ISO, su una chiavetta usb o attraverso la rete via boot remoto PXE.

Installate il pacchetto in versione .deb o npm, installate i prerequisiti con il comando: 

sudo eggs prerequisites

Siete pronti a far riprodurre il vostro pinguino:

sudo eggs produce -fv


## Features 

* Creato con Debian stable (buster) supporta pure oldstable (stretch) e testing (bullseye).

* Compatibile con Ubuntu 20.20 LTS, 19.10, 18.04 LTS, 16.04 LTS / Linux Mint 19.x / LMDE4 / Deepin 20.

* Veloce: non esegue la copia del filesystem originale ma viene ottenuta istantaneamente, tramite binding ed overlay. Inoltre, l'opzione --fast, crea la iso utilizzando lz4, riducendo i tempi di compressione durante lo sviluppo della vostra remix sino a 10 volte.

* Sicuro: utilizza solamente pacchetti .deb originali, senza alcuna modifica alle repo standard.
 
# English

Penguin's eggs is a terminal utility, in active development, which allows you to remaster your system and redistribute it as an ISO image, on a USB stick or through the network via PXE remote boot.

Install the package in .deb or npm version, install the prerequisites with the command:

sudo eggs prerequisites

You are ready to re-produce your penguin:

sudo eggs produce -fv

## Features 
* Created on Debian stable (buster) support oldstable (stretch) and testing (bullseye) too.

* Compatible Ubuntu 20.20 LTS, 19.10, 18.04 LTS, 16.04 LTS / Linux Mint 19.x / LMDE4 / Deepin 20.

* Fast: does not copy the original filesystem but is obtained instantly, through binding and overlay. In addition, the --fast option creates the ISO using lz4, reducing compression times during the development of your remix up to 10 times

* Safe: only use original .deb packages, without any modification to the standard repo.