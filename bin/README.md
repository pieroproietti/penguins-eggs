# v4tools & g4tools: Interfaccia Uomo-Macchina per Anziani del Terminale (e Smemorati)

I file presenti in questa cartella **non sono indispensabili** per il funzionamento, la compilazione o la rimasterizzazione di `oa-tools`. Il core del progetto vive, si gestisce e si compila benissimo anche senza di essi.

Allora perché sono qui? 

Sono nati per un'esigenza puramente umana: fungere da ponte e semplificare la vita all'autore (me Myers) e a tutti quegli "smemorati di lungo corso" che, pur avendo speso una vita sui sistemi, preferiscono risparmiare la brillantezza cerebrale per l'architettura del codice piuttosto che sprecarla a ricordare a memoria sfilze di flag, variabili d'ambiente o le contorte sintassi dei comandi di Git, Vagrant e KVM/libvirt.

---

### 🛠️ La Suite di Orchestrazione p4 (per proxmox)

Per gestire l'ambiente di sviluppo nativo su Proxmox senza l'overhead di Vagrant, `oa-tools` include la suite **p4** (Proxmox 4). Questo set di comandi permette di orchestrare, sincronizzare e controllare le *fucine* di test (Debian, Arch, Fedora, Manjaro) direttamente dal terminale locale.

* **`p4autocomplete`**
  Installa l'autocompletamento Bash per l'intera suite nello spazio utente locale (`~/.local/share/bash-completion`). Permette di usare il tasto `TAB` per completare dinamicamente i comandi e i nomi delle distribuzioni target.

* **`p4config`**
  Gestisce la configurazione dell'ambiente. Definisce le coordinate del nodo Proxmox host (`father`), gli ID delle macchine virtuali e i parametri di rete necessari per il collegamento.

* **`p4create`**
  Inizializza o clona una nuova *fucina* (Macchina Virtuale) sull'hypervisor, preparandola per il ciclo di sviluppo.

* **`p4push`**
  Il cuore operativo del sistema. Sincronizza istantaneamente il codice sorgente locale con la *fucina* bersaglio (tramite filesystem condiviso `9p`) e innesca la build nativa del pacchetto (RPM, DEB o PKG), bypassando dinamicamente i blocchi di sicurezza come SELinux.

* **`p4reset`**
  Ripristina la *fucina* a uno stato pulito e vergine (spesso sfruttando gli snapshot di Proxmox), eliminando le scorie delle compilazioni precedenti per garantire test di pacchettizzazione isolati e riproducibili.

* **`p4ssh`**
  Apre una connessione diretta alla console della *fucina* (sfruttando la porta seriale `ttyS0` o SSH). Fondamentale per il debug manuale a basso livello e l'ispezione del sistema in tempo reale.

* **`p4start`**
  Invia il comando di accensione all'host Proxmox per risvegliare la *fucina* specificata.

* **`p4stop`**
  Esegue uno spegnimento (graceful shutdown o cold stop) della *fucina* per liberare risorse RAM e CPU sull'hypervisor quando non è in uso.

### 🛠️ La Suite di Orchestrazione v4 (per vagrant)
Nati per interfacciarsi con il laboratorio virtuale basato su Vagrant e KVM senza digitare lunghe stringhe di configurazione.
* `v4start` -> Accende il laboratorio virtuale (Arch Linux di default) con accelerazione hardware nativa.
* `v4dns`   -> Raddrizza al volo i DNS dentro la VM se Go fa i capricci con i proxy.
* `v4ssh`   -> Entra istantaneamente in sessione sicura nella VM per compilare.
* `v4stop`  -> Spegne la VM salvando lo stato per riprendere il lavoro in un secondo momento.
* `v4kill` -> Fa tabula rasa del disco virtuale su libvirt per garantire test da ambiente vergine.

---

### 🛠️ Alias miei per git
Git è fantastico, ma alcune operazioni avanzate sui tag o sui rami remoti richiedono comandi lunghi e rischiosi. La serie `g4` standardizza le operazioni ripetitive sul monorepo:

* **Gestione dei Tag:** Comandi come `g4tagmove`, `g4tagdel` o `g4taghead` permettono di manipolare i tag di rilascio locali e remoti al volo, senza rischiare di sbagliare la sintassi di `git push --delete`.
* **Log e Debug:** `g4eggs-log` e `g4kill-log` aiutano a tracciare e ripulire la diagnostica durante i voli di test della rimasterizzazione.
* **Automazione GitHub:** `g4reset-gh-pages` automatizza la pulizia e il riallineamento del ramo dedicato alla documentazione web, un'operazione che a mano richiederebbe diversi passaggi di checkout forzato.
* **Ambienti Specifici:** Helper come `g4calamares-test` e `g4artisan` preparano i contesti reali per i test dell'installer grafico e delle credenziali.

---

## Un consiglio per il viandante
Se sei capitato in questa cartella, sei liberissimo di usare questi script così come sono se il tuo ambiente host è configurato in modo compatibile.

Tuttavia, il consiglio migliore che posso darti è un vecchio principio dell'hacking: **non copiare alla cieca, fatti i tuoi**. Prendi ispirazione da questi helper, adattali ai tuoi ritmi, alle tue dita sul terminale e alle tue abitudini.

La macchina è al nostro servizio, non il contrario. La pigrizia intelligente è la più alta forma di ottimizzazione sistemistica.

---

## 3. Installazione e Uso

Per fare in modo che il tuo terminale riconosca automaticamente tutti i comandi `v4*` e `g4*` da qualsiasi directory, e per assicurarti che il layout della tastiera italiana sia sempre attivo, appendi queste righe in coda al tuo file `~/.bashrc`:

```bash
# Forza il layout della tastiera italiana all'apertura del terminale
setxkbmap it

# Aggiunge la cartella bin del monorepo oa-tools al PATH dell'utente
export PATH="$HOME/oa-tools/bin:$PATH"
source ~/.local/share/bash-completion/completions/p4-suite

```
