# sourceforge/admin/metadata


# full description
Penguin's eggs è una utility da terminale, in attivo sviluppo, che ti permette di rimasterizzare il tuo sistema e redistribuirlo come immagine ISO, su una chiavetta usb o attraverso la rete via boot remoto PXE.

Installate il pacchetto in versione .deb o npm, installate i prerequisiti con il comando: 

sudo eggs prerequisites

Siete pronti a far riprodurre il vostro pinguino:

sudo eggs produce -fv


# Features 

* Creato con Debian stable (buster) supporta pure oldstable (stretch) e testing (bullseye).

* Compatibile con Ubuntu 20.20 LTS, 19.10, 18.04 LTS, 16.04 LTS / Linux Mint 19.x / LMDE4 / Deepin 20.

* Veloce: non esegue la copia del filesystem originale ma viene ottenuta istantaneamente, tramite binding ed overlay. Inoltre, l'opzione --fast, crea la iso utilizzando lz4, riducendo i tempi di compressione durante lo sviluppo della vostra remix sino a 10 volte.

* Sicuro: utilizza solamente pacchetti .deb originali, senza alcuna modifica alle repo standard.
 
# Inglese
