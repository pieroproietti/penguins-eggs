# Penguin's eggs configurazione

## Cartella penguins-eggs.d

Ho introdotto una nuova versione del file di configurazione, principalmente per cercare di facilitare la vita ai manutentori di distribuzioni custom.

Precedentemente avevamo il file /etc/penguins-eggs.conf che ora è stato ridenominato eggs.conf e spostato in /etc/penguins-eggs.d

In questo modo vi è la possibilità di inserire ulteriori file nella struttura in una posizione fissa dell'albero delle directory. Difatti, eggs
può essere installato in tre modalità:
* sorgente
* pacchetto nodejs
* pacchetto debian

ed ognuna di queste posiziona lo stesso e la struttura di contorno in un punto diverso dell'albero.

Ad esempio, con l'installazione via npm, normalmente il pacchetto viene posizionato in 

```/usr/lib/node_modules/penguins-eggs```

mentre con l'installazione da pacchetto Debian, viene a trovarsi in

```/usr/lib/penguins-eggs```

Ovviamente con l'installazione da sorgente risiederà nella directory dove lo avrete scaricato.

Dato che era mia intenzione fornire la possibilità di una customizzazione, mi è stato facile da codice creare dei link che ne permettano apputo la customizazione.


## file di configurazione di eggs

Il principale file di configurazione di eggs è ```/etc/penguins-eggs.d/eggs.conf``` la sua struttura è di un file ini, facilmente modifiabile dall'utente.

## file di configurazione di tools
penguins-toos, per brevità pt - così come il comando, è uno strumento compagno di eggs dove sono state inserite quelle utilità, non strettamente necessare
ma utili a maneggiare le "uova" e sviluppare eggs stesso. 
Abbiamo la possibilità di copiare con scp le iso create, senza battere ogni volta lunghi path di ricerca, ma semmplicemente digitanto ```pt export:iso```.

Essendo uno strumento sviluppato principalmente per me stesso, naturalment abbiamo la possibilità di esportare ed inmportare anche i pacchetti di eggs 
genereti: pt export:deb, pt import:deb. Lo stesso per la generazione e l'esportazione della documentazione; pt export:docs

## addons


## distros


## Ovarium

This is the central part of eggs, where the things get alive, and dangerous!
There are 3 directories:
* efi
* filesystemfs.squashfs
* iso

and a hidden one
* overlay

This structure is made following your instruction in penguins-eggs configuration file.

### Directory efi

The directory efi is used to build the part for UEFI compatibility. It consist in two directories
* boot 
* efi

Both will be copied in the iso structure before the iso will be generated.

### Directory filesystemfs.squashfs

This is the centre of the central zone, it consist in all the filesystem of your system, mounted  binded and overlay.
Here we will made all the operations needing to have a filesystem adapted to be compressed and put in a iso image.
Due the fact who actually is not a real copy of your filesystem, we use overlayfs to get this witable and don't cause problems at your current filesytem.
You will find in it all the filesystem you will found in your image when it is booted.

### Directory iso

It is the simple structure of an iso image.
* boot
* efi
* isolinux
* live

You already knw boot and efi, are necessary for UEFI and consist in the copy of efi.
* isolinux contain the isolinux files for the boot of the livecd.
* live contain only 3 files, vmliz, initrd.img and filesystem.squashfs who is the compressef for of the omologue directory.

## Customize your image before to generate it
if you want more control on the production of your iso, try the new --dry flag, it's instantaneous: will generate filesystem directory, iso structure complete and the related scripts to bind/ubind filesystem, squash it and create iso.

* bind
* mksquashfs
* mkiso
* ubind

**Attention:** this is a new feathures, things can change in the future versions. this morning was just an idea to help myself in the process to test calamares in Ubuntu and Deepin, but I'm sure someones can help me with the refinings.

Feel free to contact me for any suggestions.

https://github.com/pieroproietti/penguins-eggs

 