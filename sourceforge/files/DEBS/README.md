# Penguin's eggs Debian package

Scegliere l'ultima versione è normalmente la scelta giusta.

Per l'installazione, una volta scaricato il pacchetto, da terminale 

```
sudo dpkg -i eggs_7.5.100-1_amd64.deb
```

Per l'uso, digitate eggs ed avrete la lista dei comandi.

# Changelog
Le modifiche saranno riportate in ordine inverso dall'ultima alla prima

### eggs-7.5.110-1
Eccoci qua, stavo cercando una soluzione per facilitarmi nel lavoro di adattare a calamares anche Ubuntu e Deepin e, trafficando con questo, come spesso succede è venuta fuori una nuova idea:

- il funzionamento --dry

Eggs, da questa versione, oltre a poter generare direttamente la iso, può essere utilizzato con l'opzione --dry che invece genera la struttura e gli script necessari a completare il lavoro. E, non creando ne' il filesystem.squasfs e nemmeno l'immagine iso è ovviamente istantanea.
Vengono generati però degli script, che permettono quindi all'utente di effettuare il bind ed ubind del filesystem live, la sua compressione e la generazione della iso.

Naturalmente oltre a poter lavorare nel filesystem live e nella cartella iso, potete pure variare tutti i parametri di compressione, generazione, etc.

- introdotto il funzionamento --dry senza la produzione della iso ma solo gli script necessari ad essa;
- inserito in ovary, oltre agli script necessari, un breve README.md esplicativo.


### eggs-7.5.100-1
Cento è una cifra tonda, più qualcosa è stato fatto.
Ho lavorato molto sull'installer cli incorporato in eggs, 
il lavoro è iniziato con l'idea di aggiungere la formattazione 
LVM2 per Proxmox VE, ma è proseguito anche con l'intenzione - 
spero riuscita - di renderlo più facilmente usabile.

Al momento Ubuntu focal e le varie derivate (Linux Mint compresa)
possono essere installate SOLO con il cli-installer, mentre per 
Debian buster e LMDE4 è raccomandato l'uso dell'installatore 
grafico Calamares.

ATTENZIONE: tuttora l'uso dell'installer cli di eggs è da 
considerarsi SOLO per gli esperti, se vi cancellate il disco 
non prendetevela con me! 😛

- link sul desktop per cli-installer o calamares a seconda della presenza di quest'ultimo;

- link sul desktop per eggs adjust solo per Desktop manager che non ridimensionano 
  il monitor se questo viene allargato sulle macchine virtuali (LXDE, LXQT, XFCE e Mate). 
  Ovviamente l'effetto è visibile solo utilizzando macchine virtuali con gli strumenti 
  di integrazione installati esempio: spice-vdagent per KVM.

- rimossa l'abilitazione dei link di desktop su gnome (restano da risolvere 
  alcuni problemi legati al'uso del comando gio che richiede il mount di /dev 
  pure nella fase di costruzione della iso. 
  (Dopo aver lanciato il comando, devo fare smontare /DEV ma rimane occupata. 
   Se qualcuno ha suggerimenti...)

Benvenuto ai nuovi amici brasiliani, bisognerà prima o poi pensare ad una internazionalizzazione del pacchetto.

Bem-vindo aos novos amigos brasileiros, teremos que pensar em uma internacionalização do pacote.

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
Diffondete se potete e giudicate interessante, è importante. 

Grazie

Piero Proietti

