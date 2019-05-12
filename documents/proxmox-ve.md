# Proxmox ve

Non è semplice per me descrivere Proxmox VE, vi lascio alla loro [presentazione](https://pve.proxmox.com/wiki/Main_Page) ed alla loro [guida](https://pve.proxmox.com/pve-docs/pve-admin-guide.html), non prima però di aver spiegato che è l'unica tecnologia di virtualizzazione che ho utilizzato in questi anni.

Diciamo che fornisce un servizio di virtualizzazione, come vmware o virtualbox, gestibile sia in locale che attraverso il web. L'indirizzo del sito è https://node-della-macchina-o-ip:8006

Da questo, interamente con interfaccia grafica, è possibile creare, cancellare, gestire le macchine virtuali.

Solo una nota, installate - se potete - proxmox ve su una macchina con almeno 4 GB di RAM, preferibilmente 8 GB o 16 per un utilizzo "reale" e per poter assegnare alle macchine virtuali un conguo spazio di memoria 2/4 GB di RAM.


## Installazione

``ATTENZIONE:`` L'utilizzo dell'installazione da CLI con il comando ```sudo eggs hatch``` è distruttivo, nel senso che cancellerà completamente il vostro disco rigido.


Per installare LMDE+Proxmox VE utilizzare il comando ```eggs hatch``` (tenuto conto di quanto riportato sopra) che creerà su /dev/sda:

* una partizione LVM (/dev/sda2);
* un gruppo di volumi di nome penguin;
  * tre differenti device: /dev/penguin/root partizione di root (formattata ext4);
  * /dev/penguin/data (partizione mountata sotto /var/lib/vz formattata ext4);
  * una partizione /dev/penguin/swap

Inoltre, in /dev/sda1 verrà creata una piccola partizione di boot per l'avvio del sistema.

### Networking
Nel corso dell'installazione, verranno poste alcune domande ed opzioni, ad esempio nome utente, password utente, password root, etc. Accettare SEMPRE i valori di default.

Per quanto riguarda la rete, a fine installazione, si potrà modificare il tutto copiando il presente file in /etc/network/interfaces, avendo cura di inserire gli indirizzi adeguati alla propria rete.

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
Per qualche ragione, non viene creata in /var/log/pveproxi la directory dove il daemon possa registrare i log e, di conseguenza, l'avvio del servizio fallisce. E' possibile sistemare il tutto con le seguenti istruzioni:

```sudo mkdir /var/log/pveproxy```

```sudo touch /var/log/pveproxy/access.log```

```sudo chown www-data:www-data /var/log/pveproxy -R```

```sudo chmod 0664 /var/log/pveproxy/access.log ```

e riavviare il servizio.

```sudo service pveproxy restart```

### Password di root

Ricordarsi, se non è stata assegnata una password di root precedentemente, di assegnarla. Altrimenti non ci si potrà loggare sull'interfaccia grafica.


## Proxmox VE - Una vecchia presentazione

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
