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

# Plastilinux
Plastilinux vorrebbe diventare una meta-distribuzione per la scuola ed essere basata su differenti distribuzioni Linux customizzate utilizzando il [wardrobe](https://github.com/pieroproietti/penguins-wardrobe/tree/main/DOCUMENTATION#penguins-wardrobe) di [eggs](https://github.com/pieroproietti/penguins-eggs).

![chick](https://penguins-eggs.net/images/chick.png)

# Integrazione con epoptes
Ho inserito in eggs una funzione di integrazione con [epoptes](https://epoptes.org/), grazie alla quale da una macchina installata, creando una immagine con ```sudo eggs produce --fast``` ed avviando ```sudo eggs cuckoo``` le macchine avviate via PXE possono essere controllate con [epoptes](https://epoptes.org/).

![chick-epoptes](https://penguins-eggs.net/images/chick-epoptes.png)

Questo apre ad una grande varietà di applicazioni.

# user/password
* ```live/evolution```
* ```root/evolution```

# Debian bullseye chicks
XFCE4, leggera customizzazione e programmi per la scuola.

# Ubuntu jammy pulcini
XFCE4, leggera customizzazione e programmi per la scuola.


# Sodilinux orizzonti
Ho inserito anche So.Di.Linux Orizzonti 2005, come per Ubuntu anche qua c'è un problema di grandezza dell'immagine - circa 3,8 GB . per poter operare con PXE
ma potrebbe costituire una ottima traccia. Inoltre, su macchine con 8 GB anche l'installazione e l'uso via PXE nonchè il controllo con [epoptes](https://epoptes.org/) funzionano benissimo.

![sodilinux](https://penguins-eggs.net/images/sodilinux.png)


# More informations:

Note: you can build both using the original distro, eggs and wardrobe
## Ubuntu jammy chicks

Crea da solo la tua versione!
* installa xubuntu 22.04 minimo, quindi installa eggs
* ```eggs wardrobe get```
* ```sudo eggs wardrobe wear accessories/chicks```

oppure: 

* scarica egg-of-ubuntu-jammy dalla pagina penguins-eggs du [sourceforge](https://sourceforge.net/projects/penguins-eggs/files/ISOS/ubuntu/jammy/);
* avvia ed installa con: ```sudo eggs install -un```
* riavvia la macchine e scarica il wardrobe: ```eggs wardrobe get```
* indossa il vestito chicks: ```sudo eggs wardrobe wear chicks```.

## Debian bullseye chicks

* esegui una installazione minimale di [Debian bullseye](https://www.debian.org/releases/bullseye/debian-installer/) minima;
* scarica ed installa eggs;
* in alternativa: scarica ed installa con ```sudo eggs install``` la versione [naked](https://sourceforge.net/projects/penguins-eggs/files/ISOS/debian/bullseye/) di Debian bullseye. 

* riavvia il sistema e loggati con le tue credenziali, dai i seguenti comandi:
* ```eggs wardrobe get```
* ```sudo eggs wardrobe wear chick```

* Repository: [penguins-eggs](https://github.com/pieroproietti/penguins-eggs)
* Blog: [penguins-eggs](https://penguins-eggs.net)

* You can find more informations on this Linux distro at: [Debian](https://debian.org/).

# Disclaim
__Please note what this project is in no way connected to the original distro in any official way, it’s just my personal experiment.__

