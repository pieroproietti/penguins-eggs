# Proxmox VE
Proxmox Virtual Environment is an open source server virtualization management solution based on QEMU/KVM and LXC. You can manage virtual machines, containers, highly available clusters, storage and networks with an integrated, easy-to-use web interface or via CLI. Proxmox VE code is licensed under the GNU Affero General Public License, version 3. The project is developed and maintained by [Proxmox Server Solutions GmbH](https://www.proxmox.com/).

# Proxmox VE on a workstation
There are differents guide on [Proxmox wiki](https://pve.proxmox.com/wiki/), I'm not sure this is the [last](https://pve.proxmox.com/wiki/Developer_Workstations_with_Proxmox_VE_and_X11), I follow this guide to create a live CD with Proxmox VE with a light GUI and my preferited tools.

## egg-of-debian-bullseys-pve

## Changelog 

I just picked up my old idea of creating a complete workstation using Proxmox VE as a base. It was an old project of mine for a few years abandoned for lack of time, but given the progress made with eggs and also contingent needs I have resumed this work.

### egg-of-debian-bullseye-pve-amd64_2022-02-19_1756.iso
* created a PVE Workstation, adding XFCE, firefox, virtviwewer and sshfs to can mount host:/var/lib/vz on /mnt;
* testing a PVE inside a PVE host, added storage on the live from the host as directory /mnt;
* create new VM on that storage and successfulli started them from live;

**NOTE**: editing configurations files in ```/etc/pve/qemu-server``` of the live it is possible to use VM images from the host

**NOTE** remain to test that running the live from a usb key

This mean who the resulting live, can be used both: as rescue tool for existing Proxmox VE installation, to install a workable WS PVE installation or to test PVE in a live environment, mounting the real hw and creating as storage a simple directory.

**EXAMPLE**: I can create here a VM with id 300 on my Proxmox VE installation, share configuration files - from ```/etc/pve/qemu-server/300.conf``` and the two  resulting volumes: ```vm-300-disk-0.qcow2``` and ```vm-300-disk-1.qcow2``` living  and just with the iso, the VM can be used everythere. 

* **NOTE:** the part regarding PVE live is - at the moment - more an experiment than a real feathure.


## Presentation

It's not easy for me to describe Proxmox VE, I'll leave you with their [presentation](https://pve.proxmox.com/wiki/Main_Page) and their [guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.html), but not before explaining that it's the only virtualization technology I've used over the years.


Let's say it provides a virtualization service, like vmware or virtualbox, that can be managed both locally and through the web. The website address is https://hostname-or-host-ip:8006

From this address, entirely with a browser-accessible interface, you can create, delete, manage virtual machines.

Just a note, install - if you can - Proxmox VE on a machine with at least 4 GB of RAM, preferably 8 GB or 16 for "real" use and to be able to allocate the virtual machines a fair amount of memory space 2/4 GB of RAM.


## Installation 

Of course for professional use, it is convenient to download the original iso of Proxmox VE and eventually adapt it to your needs.

In case, however, you want to try the way I'm going, this is practically a replica of the machine that I use daily for my experiments with eggs. Indeed, it represents the future version, using which I'm going to replace the existing system with this one, safeguarding at the same time the various virtual libraries present in the system.

**WARNING**

Using the installation from CLI with the command ```sudo eggs install -cli`` is destructive in the sense that it will completely erase your destination hard drive.

To install egg-of-debian-bullseye-pve-amd64 use the command ``eggs install --pve``, you will get:

* a boot partition (/dev/sda1)
* a lvm2 partition (``/dev/sda2``) contain a volume group named pve and three different devices: 
  * ```/dev/pve/root``` root partition (ext4 formatted);
  * ```/dev/pve/data``` partition mounted under /var/lib/vz (ext4 formatted);
  * ```/dev/pve/swap``` swap partition.

  **NOTE** At the moment it is possible to install it just with BIOS standard, UEFI is to do!

### Networking

As for the network, at the end of the installation, you can modify it by copying this file in /etc/network/interfaces, taking care to insert the appropriate addresses for your network.

```
iface enp0s31f6 inet manual

auto vmbr0
iface vmbr0 inet static
	address  192.168.61.2
	netmask  255.255.255.0
	gateway  192.168.61.1
	bridge-ports enp0s31f6
	bridge-stp off
	bridge-fd 0

```
### Sistemazione dei log di pveproxy
If, for some reason, the directory where the daemon can record the logs is not created in /var/log/pveproxi and, consequently, the service startup fails. You can fix the problem with the following commands:

```sudo mkdir /var/log/pveproxy```

```sudo touch /var/log/pveproxy/access.log```

```sudo chown www-data:www-data /var/log/pveproxy -R```

```sudo chmod 0664 /var/log/pveproxy/access.log ```

e riavviare il servizio.

```sudo service pveproxy restart```

### Password
Live is set up with a user: ```live``` password: ```evolution``` and a ```root``` user with password: ```evolution```. To access the management of virtual machines, you must log in with the root account.


# Proxmox VE - Una vecchia presentazione

Il giorno 22 marzo 2017 è stata rilasciata la prima beta di Proxmox VE 5 basata su Debian Stretch. Oggi il 28 aprile approfittando del fatto di dover fare pulizia sull’installazione domestica ho deciso di tentarne l’installazione tanto per anticiparmi e scoprire le novità.

Ci sono stati alcuni problemi, il primo è che occorre partire da un disco pulito oppure scegliere, come ho fatto l’installazione zfs, dopo di questo e, sino a questo momento tutto sta procedendo regolarmente, visto che sto scrivendo dallo stesso computer.

Ho iniziato il passaggio rimuovendo le macchine virtuali non più utilizzate e, quindi salvandomi le altre man mano su un disco esterno. Proxmox utilizza per il backup il nome vzdum-quemu-XXX-AAAA-MM-GG.vma.lz, per non confondermi ho ridenominato i vari dump con il [NomeMacchina]-vzdump… etc.

Finito il backup che, ha richiesto un certo lasso di tempo, ho provveduto a scaricare la iso di proxmox ed a riversarla su una chiavetta usb per avviare l’installazione.

sudo su

dd if=proxmox…iso of=/dev/sdb;sync

Attenzione naturalmente a sceglie il giusto /dev, nel mio caso /dev/sdb, altrimenti si rischia di cancellare tutto.

Finita la registrazione dell’immagine sulla chiavetta, possiamo senz’altro partire con l’installazione, di per sè molto semplice e comunque asssistita da grafica. Le cose da scegliere riguardano essenzialmente la formattazione del disco, nel mio caso ho optato per zfs – ma questo perchè non avevo provveduto a cancellare a priori il disco, altrimenti avrei potuto scegliere LVM2 con una partizione ext4, modalità alla quale sono più abituato. Non sono pentito al momento di zfs, qualche tempo mi fa dava dei problemi con il boot e per questo avevo iniziato a non utilizzarlo. Direi che al momento va bene e, l’impressione è un aumento delle prestazioni.

Aggiunta dell’interfaccia grafica, utenti e degli strumenti desktop
Una volta riavviato, abbiamo una bella distribuzione Debia Stretch nuova, nuova e con Proxmox installato, ma ahimè accedibile solamente da un’altra macchina in rete. Con scelta comprensibile, perchè parliamo di un virtualizzatore la sola interfaccia disponibile è la riga di comando o l’interfaccia web per la gestione. Naturalmente, per una installazione domestica o per sviluppo, questo è improponibile andremo quendi ad installare una GUI, ho scelto cinnamon-core ed un desktop manager lightdm.

Per prima cosa aggiorniamo le repository:

```apt-get update```

```apt-get install lightdm cinnamon-core```

Una volta installato il desktop manager e l’ambiente grafico, possiamo crearci un utente con i diritti di amministrazione che utilizzeremo normalmente, invece di root.

```adduser artisan```

```addgroup sudo artisan```

A questo punto, possiamo riavviare la macchina e loggarci direttamente, nellìambiente grafico con artisan. Per fare operazioni di sistema utilizzeremo sudo.

Manca ancora un browser, anzi due, visto che normalmente utilizzo sia firefox che google chrome. Andiamo ad installare Firefox, nella versione firefox-esr per Debian

```apt-get install firefox-esr```

Una volta installato firefox, possiamo utilizzarlo per scaricarci le altre applicazioni scelte. Nel mio caso atom come editor e Google Chrome come browser.

Scaricati i pacchetti, andiamo ad installarlo con il comendo dpkg -i  nome pacchetto.

```dpkg -i```

Per il ripristino che sto effettuando mentre scrivo queste note, la procedura è:

```qmrestore cholitos- -s local-zfs cholitos-bk-vzdump-qemu-104-2017_04_28-13_15_17.vma.lzo```

a qyesto punto, controllato che la macchina funzioni, provvedo a cancellare il dump.

Attenzione, una volta creato un disco zfs, se per qualche ragione, come mi è successo poco fa è necessario cancellarlo singolarmente, dobbiamo intervenire con zfs

```zfs destroy rpool/data/vm-100-disk-1```

```zfs destroy rpool/data/vm-100-disk-2```

A questo punto possiamo riprendere l’importazione precedente che abbiamo abortito, senza avere la costruzione di un data/vm-100-disk-3 ed andando a recuperare lo spazio occupato dalle immagini parziali precedenti.

Finalmente, stiamo caricando l’ultima macchina
