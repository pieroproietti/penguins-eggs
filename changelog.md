penguins-eggs
=============

## Penguin&#39;s eggs are generated and new birds are ready to fly...
[![repo](https://img.shields.io/badge/repo-github.com-blue)](https://github.com/pieroproietti/penguins-eggs)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![debs](https://img.shields.io/badge/deb-packages-blue)](https://sourceforge.net/projects/penguins-eggs/files/DEBS)
[![isos](https://img.shields.io/badge/iso-images-blue)](https://sourceforge.net/projects/penguins-eggs/files/iso)
[![typedoc](https://img.shields.io/badge/doc-typedoc-blue)](https://penguins-eggs.sourceforge.io/index.html)
[![book](https://img.shields.io/badge/book-penguin's%20eggs-blue)](https://penguin-s-eggs.gitbook.io/project/)
[![facebook](https://img.shields.io/badge/page-facebook-blue)](https://www.facebook.com/penguinseggs)
[![gitter](https://img.shields.io/badge/chat-gitter-blue)](https://gitter.im/penguins-eggs-1/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![License](https://img.shields.io/badge/license-MIT/GPL2-blue)](https://github.com/pieroproietti/penguins-eggs/blob/master/LICENSE)


# Penguin's eggs Debian package

Usually the last version is the right one.

To install the package, download it and open a terminal window.

```sudo dpkg -i eggs_7.5.110-1_amd64.deb```

## Usage
Use ```eggs``` without parameters to have the list of commands. ```eggs produce --help``` will show you the description of this command and the flag you can use. 

Detailed instrunction for usage are published on the gitboot [penguin's eggs](https://penguin-s-eggs.gitbook.io/project/) (sorry, only italian language).


## Changelog
Versions are listed on reverse order, the first is the last one.

### eggs-7.5.110-1
Here we are, I was looking for a solution to facilitate myself in the work of adapting Ubuntu and Deepin to calamares and, trafficking with this, as often happens a new idea came up:

- flag --dry (shord "d")

Eggs, from this version, in addition to being able to directly generate the ISO, can be used with the --dry option which instead generates the structure and scripts necessary to complete the work. And, neither creating the filesystem.squasfs nor the iso image is obviously instantaneous. However, scripts are generated, which therefore allow the user to bind and ubind the live filesystem, its compression and the generation of the ISO.
- introduct in ```eggs produce``` the flag --dry. Eggs run without produce not squashfs, nor iso image, but creating same scripts: bind, ubind, mksquashfs and  mkiso to let you to change your live filesystem and your iso filesystem before to package it.

Of course, besides being able to work in the live filesystem and in the iso folder, you can also change all the compression, generation, etc. parameters.

- introduced the --dry operation without the production of the iso but only the scripts necessary for it;
- included in the ovary, in addition to the necessary scripts, a short explanatory README.md.


### eggs-7.5.100-1
One hundred is a round figure, plus something has been done.

I worked a lot on the cli installer built into eggs, the work started with the idea of adding formatting LVM2 for Proxmox VE, but also continued with the intention - I hope successful - to make it more easily usable.

At the moment Ubuntu focal and the various derivatives (Linux Mint included) they can be installed ONLY with the cli-installer, while for Debian buster and LMDE4 are recommended to use the installer Calamares.

ATTENTION: the use of the eggs cli installer is still from ONLY for experts if you erase the disc.

- link on the desktop for cli-installer or calamares depending on the presence of the latter;

- desktop link for eggs adjust only for Desktop managers that do not resize the monitor if it is enlarged on the virtual machines (LXDE, LXQT, XFCE and Mate). Obviously the effect is visible only when using virtual machines with the integration tools installed, for example: spice-vdagent for KVM.

- removed the enabling of the desktop links on gnome (some problems related to the use of the gio command that requires the mounting of / dev also in the construction phase of the iso remain to be solved. but it remains busy. (If anyone has same suggestions ...)

- Bem-vindo aos novos amigos brasileiros, teremos que pensar em uma internacionalização do pacote.

- Welcome to the new Brazilian friends, sooner or later we will have to think about an internationalization of the package.

- Benvenuto ai nuovi amici brasiliani, bisognerà prima o poi pensare ad una internazionalizzazione del pacchetto.



### eggs  7.5.86

- modificata la chiamata a xorriso, cercando di renderla analoga a systemback
  (secondo i suggerimenti di Franco Conidi)

- reimportate - e corrette - le utils da tools

- pulizia di makeIsoImage() in ovary, rimangono da applicare le modifiche 

- copia delle utils in penguins-tools, per uniformare gli strumenti

- varie pulizie


### 7.5.81
- proseguono i lavori per la compatibilita con Ubuntu, attualmente si riesce a rimasterizzare ed
installare con eggs install.
- più di qualche impazzimento per far funzionare i link in gnome contrassegnandoli trusted con
il comando gio che però, non essendo loggato l'utente, deve essere lanciato con 
sudo -u user dbus-launch gio set ...

Naturalmente eggs resta compatibile con Debian Buster.



### eggs-7.5.76
Eggs sta diventand abile a rimasterizzare Ubuntu 20.04 focal, riesce a rimasterizzare
Ubuntu senza alcun problema. Per l'installazione, al momento, non è possibile effettuarla
con l'installer grafico ma solo con quello cli incorporato.

- ristrutturazione del codice per permettere la selezione tra le varie distro;
- correzione dei punti di intoppo per la rimasterizzazione di Ubuntu focal (sia ubuntu-server che Ubuntu-desktop);
- le versioni xbuntu, kubuntu, UbuntuMate e UbuntuBudgie si avviano correttamente;
- non si avvia dalla iso la versione di Lubuntu basata su lxqt.

Resta da sistemare la configurazione dell'installer grafico per Ubuntu.


### eggs-7.5.72
- opzione skel per la copiatura della configurazione utente, funziona egregiamente su cinnamon.
Servirebbe testarla su altri Desktop managar, segnalatemi magari a quali siete interessati. 


### eggs 7.5.64
- possibilita di configurare il nome dell'utente live e le password direttamente nel file /etc/penguins-eggs (c'è chi preferisce live/evolution, chi demo/demo, etc. accontentiamo tutti);
- creazione dell'utente live SEMPRE e solo come unico utente del liveCD parte del gruppo sudo.

Ho scelto di fare questa modifica per una migliore pulizia e controllo degli utenti.
Al momento ho caricato la sola versione npm

### eggs-7.5.60-1
- pulizia della repo, rimossi documenti datati, descritto in documents
il problema:

A start job is running for /sys/subsystem/net/devices/multi/user
(attende che la rete divenga disponibile per sincronizzare il timer)


### eggs-7.5.51-1
- info: nuovo look;
- produce: se non sono installati i prerequisiti ne propone correttamente l'installazione;
- installer cli: introdotta una nuova visualizzazione di conferma dei valori immessi.

Ho dei problemi con l'installer cli, va abbastanza bene ed è diventato anche umanamente 
usabile, ma per qualche ragione che non  conosco, dopo l'installazione, durante la 
fase di avvio si genera un ritardo al boot che, effettuando l'installazione con calamares
non avviene.

In particolare, segnala:
mdadm: no array found in config file or automatically
(uso delle VM su proxmox-ve e non ci sono disk array su esse)

ed, una volta superato lo scoglio, attende ancora 1:30 per:
A start job is running for /sys/subsystem/net/devices/multi/user
(attende che la rete divenga disponibile per sincronizzare il timer)

Se qualcuno meglio esperto può dare qualche suggerimento. Grazie

eggs-7-5-57-1
- aggiunto warning per nuove versioni;
- tradotta in inglese la presentazione di calamares;
- aggiunta opzione verbose anche nel comando adjust;
- variato nome e posizione della exclude.list;
- ristrutturato e semplificato exclude list, inserire le opzioni per apache2 e pveproxy.

### eggs-7.5.54-1
- testato con successo su LMDE4, sia standard che UEFI

### eggs-7.5.44-1
- installer cli: fstab utilizzo UUID in luogo di /dev/sda1, etc
- installer cli: rimozione dell'utente e del gruppo del liveCD durante l'installazione

### eggs-7.5.39-1
- aggiunto comando skel: copia della configurazione del Desktop in /etc/sket
- corretto e testato funzionamento dell'installer cli
#### in sospeso
- modificare nell'installer cli il file fstab aggiungendo i blkid

### eggs-7.5.40-1
* corretta la mancata rimozione del gruppo dell'utente del CD
in sospeso
modificare nell'installer cli il file fstab aggiungendo i blkid

### eggs-7.5.39-1
* aggiunto comando skel: copia della configurazione del Desktop in /etc/sket
* corretto e testato funzionamento dell'installer cli

### eggs-7.5.36-1
- aggiunto flag -a per l'assistente di installazione che permette la scelta tra installazione grafica e installazione cli;
- corretto problema della cancellazione delle liste apt sulla versione installata con installer grafico.

Buon 1° maggio a tutti

### eggs-7-5-34-1
* Eliminato l'errore di costruzione della iso su macchina non UEFI. Precedentemente non essendo installato il pacchetto grub-efi-amd64 e le sue dipendenze, eggs falliva anche nel caso fosse stato corremente impostato il valore make_efi=no nel file di configurazione.
* Introdotto un ulteriore flag in eggs produce, per l'aggiunta sul desktop dell'assistente di installazione che permette di scegliere tra calamares o installer cli.

### eggs_7.5.18-1_amd.deb
In queste versioni dalla 7.5.0-1 alla 7.5.18-1 ho rivisto completamente il funzionamento cercando il più
possibile di semplificare l'uso. Questa versione, in caso di prerequisites non installati chiede all'utente
di installarli al volo e così fa per calamares (se in /etc/penguins-eggs force-installer=yes) e per il file 
di configurazione stesso che, se assente, viene automaticamente generato.
Inoltre, per le stazioni di lavoro non grafiche, non viene più configurato calamares, ovviamente non necessario
e l'installazione avviene direttamente con eggs.

In caso di problemi, provare ad utilizzare il flag -v per visualizzare l'output a video delle varie chiamate.

Grazie per l'attenzione, fatemi sapere.



### eggs_7.5.0-1_amd,deb
* Finalmente abbiamo la versione UEFI funzionante.

# Help
Don't esitate to ask me for suggestions and help.

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations
For other informations, there is same documentation i the document folder of this repository,
look at facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/),
contact me, or open an [issue](https://github.com/pieroproietti/penguins-eggs/issues) on github.

I mostly use Facebook.

* facebook personal: [Piero Proietti](https://www.facebook.com/thewind61)
* facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/)
* facebook page:  [Penguin's Eggs](https://www.facebook.com/penguinseggs)
* mail: piero.proietti@gmail.com


## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://github.com/pieroproietti), dual licensed under the MIT or GPL Version 2 licenses.
