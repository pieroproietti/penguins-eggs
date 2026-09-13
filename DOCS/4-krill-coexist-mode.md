# krill - coexist mode

La modalità `coexist` funziona nel modo seguente. Per ora l'ho provata soltanto su una macchina virtuale e con un unico disco, quindi dobbiamo ancora considerarla sperimentale.

### Due percorsi nell'interfaccia

In `eggs sysinstall krill`, scegliendo **Coexist** nella pagina Disk si apre
un menu con due operazioni distinte:

- **Install a distribution on an existing disk**: scelta del disco, della ROOT
  esistente da formattare, della HOME da riutilizzare e dell'identificativo
  dell'installazione. La ESP è rilevata automaticamente sul disco selezionato
  e resta fissa, visibile ma non selezionabile.
  Questo percorso non contiene l'azione di preparazione dell'intero disco.
  Prosegue con utenti e riepilogo, compresa la conferma delle eventuali
  cancellazioni dei contenuti HOME/EFI dell'installazione sostituita.
- **Prepare a disk for multiple distributions**: scelta iniziale **Shared Home
  Location**, poi disco da preparare, dimensionamento degli slot ROOT e anteprima
  delle partizioni. Le opzioni HOME sono **Coexist disk (requires 32 GiB total
  space)**, predefinita, e **External partition**. La seconda apre un selettore
  delle partizioni ext4 esistenti e smontate: deve essere scelta una partizione
  su un altro disco. Non sono ammessi percorsi di directory.
  Con HOME esterna vengono create soltanto ESP e ROOT; la partizione esterna
  non viene formattata. Prima dell'anteprima e della scrittura vengono verificati
  disco di appartenenza, filesystem, UUID, dimensione e stato della partizione.
  Dopo la preparazione la HOME scelta è preselezionata per l'installazione.
  Questa operazione è **completamente distruttiva: cancella tutti i dati sul disco
  selezionato**, come evidenziato già nel menu. Richiede la lettura del layout e
  la digitazione del device prima di procedere. Al termine compare **Disk ready**:
  si può scegliere di installare subito la distribuzione live corrente oppure
  uscire (scelta predefinita). L'installazione non parte automaticamente.

Nella scelta della partizione esterna, **Esc** torna a Shared Home Location;
qui Esc torna al menu Coexist. Dalla scelta del disco nei due percorsi,
**Esc** torna al menu Coexist. Durante il dimensionamento
o l'anteprima, Esc annulla prima la preparazione e torna alla scelta del disco.
Dalla schermata **Disk ready**, Esc esce senza installare o riavviare.
Per aggiungere la seconda distribuzione e le successive si sceglie direttamente
il percorso di installazione, senza preparare nuovamente il disco.

Nel percorso di installazione, **↑/↓** o **Tab** selezionano il campo,
**←/→** scelgono disco, ROOT e HOME; l'**Installation ID** va digitato
(per esempio `debian`). **Invio** passa a Users quando tutte le selezioni
obbligatorie sono valide. Il modulo mantiene visibili campi ed errori su una
console 80×24; il dettaglio delle directory HOME/EFI da cancellare compare
nel riepilogo finale, prima della conferma.

### Dischi preesistenti e ESP fissa

L'installazione usa esclusivamente una ROOT già esistente sul disco selezionato
e la sua unica ESP valida (tipo GPT ESP, filesystem FAT). Se la ESP manca o ne
esistono più di una valide, l'installazione viene bloccata: non viene cercata
una ESP su altri dischi. Il vincolo viene verificato nel preflight e ripetuto
prima della formattazione. Cambiare disco aggiorna la ESP fissa e azzera la
scelta di ROOT e HOME.

Non è necessario che il disco sia stato preparato da Krill o che le partizioni
abbiano label ROOT1, ROOT2, ecc. La HOME condivisa deve essere una partizione
ext4 preesistente e può stare anche su un altro disco. ESP e HOME non vengono
formattate; resta applicata la pulizia dei contenuti dell'identificativo
selezionato descritta sotto. Le label delle altre partizioni non vengono cambiate.

La preparazione distruttiva rimane un percorso separato e facoltativo.

### Avviso quando manca una ESP valida

Selezionando un disco senza ESP valida, Krill mostra subito le istruzioni
e blocca l'avanzamento. Restano disponibili la scelta di un altro disco,
il ritorno al menu e l'uscita. La procedura suggerita è:

1. Fare un backup, uscire da Krill e aprire **GParted da una live USB**,
   selezionando lo stesso disco indicato nell'avviso.
2. Controllare prima eventuali ESP esistenti: l'avviso può indicare anche
   un tipo o filesystem non riconosciuto. Non formattarle per tentativi.
3. Su un disco **GPT**, usare spazio non allocato oppure **Ridimensiona/Sposta**
   su una partizione smontata, se il filesystem supporta la riduzione.
4. Nello spazio ricavato creare una **nuova partizione FAT32 da 512 MiB**:
   è la dimensione consigliata, coerente con la preparazione di Krill.
   In **Gestione flag** attivare `esp`; la label `ESP` è facoltativa.
5. Applicare le modifiche, lasciare la ESP smontata e riavviare
   `sudo eggs sysinstall krill`.

**Non usare “Crea tabella delle partizioni” su un disco da conservare.**
Per un disco MBR la conversione a GPT richiede una valutazione separata.
La guida non avvia strumenti né ridimensionamenti automaticamente.
Riferimento per le operazioni: [manuale GParted](https://gparted.org/display-doc.php?name=help-manual).

### Schema di partizionamento

Per l'inizializzazione mi sono inventato un mio schema di partizionamento.

Viene creata una partizione ESP per l'avvio UEFI, poi diverse partizioni destinate ai sistemi:

`ROOT1`
`ROOT2`
`ROOT3`
`...`

Ogni ROOT ha dimensione predefinita di **10 GiB**, modificabile da 4 GiB.
Con HOME sul disco coexist viene infine creata `SHARED_HOMES`, che occupa lo
spazio rimanente con un minimo di **10 GiB**. Un disco da **32 GiB** contiene
ESP da 512 MiB, due ROOT da 10 GiB e HOME di circa 11,5 GiB, al netto della GPT.

Con **External partition**, il disco coexist contiene soltanto ESP e almeno
due ROOT; lo spazio residuo inferiore a uno slot resta non allocato. Con le
ROOT predefinite è sufficiente un disco da **21 GiB**. La partizione HOME ext4
preesistente su un altro disco viene riutilizzata senza formattazione e senza
ridimensionamento. Il minimo di 10 GiB riguarda la HOME creata dall'inizializzatore.

L'idea è quella di riservare fin dall'inizio diversi "slot" nei quali poter installare differenti distribuzioni Linux, mantenendo un'unica partizione HOME condivisa.

Quando viene installata la prima distribuzione in modalità `coexist`, viene utilizzata una delle partizioni ROOT disponibili. Le installazioni successive utilizzano ROOT2, ROOT3, ecc., senza toccare le distribuzioni già installate.

Quando si installa una distribuzione, lo slot ROOT utilizzato assume l'identità di quell'installazione.

La corrispondenza applicata dall'installer è:

`Installation ID = LABEL della ROOT = nome directory EFI = namespace HOME`

Per esempio, scegliendo l'identificativo `arch`, la ROOT riceve la LABEL `arch`,
GRUB viene installato in `EFI/arch` e la HOME risiede in `/srv/homes/arch`.
L'identificativo imposta anche l'hostname, che però resta modificabile nella
pagina Users. Non imposta direttamente il `menuentry --id` generato da GRUB.

Se successivamente installo Manjaro con identificativo `manjaro`, avremo:

`LABEL manjaro`, `EFI/manjaro` e `/srv/homes/manjaro`.

In questo modo ogni sistema ha la propria partizione root e viene identificato in maniera semplice e coerente.

La partizione HOME è condivisa tra le diverse installazioni, mentre ogni distribuzione mantiene il proprio sistema root indipendente.

### Avvio

Attualmente `coexist` funziona **soltanto su sistemi UEFI** e utilizza **esclusivamente GRUB** come bootloader.

Il preflight permette attualmente l'installazione e l'inizializzazione Coexist
solo sulle famiglie **Debian, Arch Linux e Manjaro**, comprese le derivate
riconosciute. **BigLinux** e **BigCommunity** sono riconosciute esplicitamente
come famiglia Manjaro; le altre derivate possono essere riconosciute tramite
`ID_LIKE` in `/etc/os-release` (con fallback al precedente `LIKE_ID`).
I template di Fedora e Alpine
usano ancora l'identità della distribuzione e scrivono nel fallback `EFI/BOOT`:
finché non applicano l'isolamento Coexist, il controllo blocca queste famiglie
prima della formattazione. Questa limitazione riguarda Coexist.

Non è previsto il supporto per BIOS/Legacy né, al momento, per altri bootloader.

Nel modulo condiviso Arch/Manjaro, Coexist seleziona esplicitamente GRUB anche
se trova configurazioni Limine o systemd-boot. L'installazione del bootloader
si interrompe se mancano UEFI, la ESP montata o l'identificativo Coexist.
Le modalità Erase e Replace mantengono la selezione del bootloader esistente.

Le diverse distribuzioni condividono la stessa ESP e le voci di GRUB permettono di scegliere quale sistema avviare.

### Sostituzione e pulizia di uno slot

Quando si reinstalla o si sostituisce una distribuzione su uno slot già occupato:
- `krill` legge la `LABEL` del filesystem presente sulla partizione selezionata.
- Se la label corrisponde a un'installazione Coexist precedente (non generica come `root1`, `root2`), prima di procedere elimina automaticamente:
  - la directory associata nella partizione condivisa `/srv/homes/<vecchia_label>`
  - la directory dell'avvio UEFI `/boot/efi/EFI/<vecchia_label>`
  - le voci di avvio associate nella NVRAM UEFI tramite `efibootmgr`, soltanto
    se il percorso GPT identifica il PARTUUID della ESP utilizzata.

Nella schermata di riepilogo di `krill` viene segnalato chiaramente quali risorse della precedente installazione verranno rimosse (`PURGE PREVIOUS`).

**Anche la HOME dell'identificativo nuovo viene eliminata, se esiste già**, insieme
ai relativi file EFI e alle voci NVRAM corrispondenti. Questo vale anche per una
reinstallazione con lo stesso identificativo. La partizione HOME non viene
formattata, ma questo non significa che tutti i suoi dati vengano conservati.
Il riepilogo distingue ora le partizioni preservate dai contenuti cancellati.

Prima di formattare, Krill ricontrolla la label dello slot rispetto alla
selezione confermata e cerca gli identificativi nuovo e precedente su tutti i
dispositivi collegati. Una collisione con un altro dispositivo blocca
l'installazione; `root` e `rootN` sono riservati agli slot liberi. HOME ed EFI
devono utilizzare lo stesso identificativo. ESP e HOME devono essere smontate;
le destinazioni nuove e precedenti vengono ispezionate prima della scrittura.
Gli errori restituiti dalla pulizia HOME, EFI e NVRAM interrompono l'installazione.
Resta tollerata, nella funzione NVRAM esistente, l'impossibilità di interrogare
`efibootmgr`. Quando la lettura riesce, la pulizia usa l'output verbose
e richiede un PARTUUID valido della ESP: voci omonime su altre ESP e voci
senza un percorso GPT verificabile vengono conservate.

Per il momento considero quindi `coexist` una modalità sperimentale: funziona nei miei test con una macchina virtuale, UEFI, GRUB e un unico disco. Ora dobbiamo provarla con più distribuzioni e in configurazioni reali differenti.

### Revisione della procedura — 13 settembre 2026

Il percorso esaminato comprende TUI, inizializzazione, preflight, formattazione,
montaggio, estrazione squashfs, rimozione dell'utente live, HOME condivisa,
fstab, creazione utenti, script di installazione e smontaggio.

| Fase | Comportamento e osservazioni |
| --- | --- |
| Preparazione facoltativa | Il percorso `Prepare a disk for multiple distributions` cancella **l'intero disco**. Richiede anteprima, lettura del layout e digitazione del device; ricontrolla geometria e identità prima di scrivere. Termina con `Disk ready` e la scelta tra installare e uscire. Non va usato per aggiungere una distribuzione a un disco già preparato. |
| Dimensionamento | ESP da 512 MiB, almeno due ROOT, HOME locale residua di almeno 10 GiB, oppure partizione ext4 esterna preesistente. La ROOT predefinita è 10 GiB, configurabile da 4 GiB. Il minimo geometrico non garantisce che l'immagine estratta trovi spazio. |
| Selezione | ROOT esistente sul disco scelto da formattare, ESP unica dello stesso disco fissa e preservata. ESP assente o ambigua blocca l’installazione. HOME ext4 da riutilizzare esplicita, anche su un altro disco. |
| Preflight | UEFI, famiglia supportata, device distinti, filesystem/UUID, destinazioni HOME/EFI e collisioni delle label. La validazione viene ripetuta nel modulo partition. |
| Copia | Si formatta soltanto la ROOT. HOME ed ESP condivise sono montate dopo unpackfs e removeuser, così queste operazioni non raggiungono i dati condivisi. |
| Utenti e HOME | `/srv/homes/<id>` viene montata con bind su `/home`. Le altre directory e `common` restano separate. La reinstallazione attuale ricrea la HOME dell'identificativo selezionato. |
| Fstab | Usa UUID, con una sola voce `/home`; in Coexist Btrfs non crea il subvolume `@home` concorrente. |
| Bootloader | Debian, Arch e Manjaro installano GRUB in `EFI/<id>` senza sostituire `EFI/BOOT`. Debian conserva l'identità anche nella configurazione GRUB per gli aggiornamenti. |
| Errori | La pulizia non ignora più gli errori restituiti dalle operazioni. Non esiste però un rollback di ROOT, HOME o EFI già cancellate. Lo smontaggio finale richiede ancora una gestione più rigorosa degli errori. |

### Miglioramenti successivi, in ordine di priorità

1. **Identità persistente degli slot.** Le label sono descrittive: l'inventario
   aggiunto intercetta collisioni visibili, ma non dimostra la proprietà delle
   directory HOME/EFI. Servirebbe un registro che associ ID, UUID ROOT, UUID HOME
   e PARTUUID ESP. La pulizia NVRAM è già circoscritta al PARTUUID della ESP
   utilizzata; il registro servirebbe a dimostrare la proprietà delle directory.
   Un vecchio sistema senza label o su un disco scollegato non è identificabile
   con il controllo attuale.
2. **Politica HOME esplicita.** Offrire conservazione o ricreazione, mostrando
   separatamente l'effetto della sostituzione dello slot. La conservazione
   richiede anche verifica UID/GID e proprietà della directory utente.
3. **Preflight completo prima di wipefs.** Verificare sorgente squashfs,
   strumenti, configurazioni shellprocess e spazio necessario all'estrazione.
   Oggi alcuni errori, come una sorgente mancante, emergono soltanto dopo la
   formattazione. Rafforzare inoltre il controllo dei dispositivi con holder
   attivi: il controllo ordinario usa i mountpoint, mentre l'inizializzatore
   controlla anche gli holder in sysfs.
4. **Identità coerente nell'interfaccia.** La modifica dell'Installation ID
   aggiorna l'hostname, ma la pagina Users permette poi di cambiarlo separatamente.
   L'eventuale uso dello stesso ID anche come `menuentry --id` di GRUB richiede
   una gestione esplicita nei template.
5. **Bootloader delle altre famiglie.** Adeguare Fedora e Alpine prima di
   rimuovere il blocco; provare anche persistenza dopo aggiornamenti GRUB e
   gestione degli errori NVRAM, mantenendo la ESP fissa sul disco selezionato.
6. **Ripresa e conclusione affidabili.** Valutare rinomina/backup delle vecchie
   directory fino al completamento; riportare gli smontaggi falliti e impedire
   che un errore finale venga presentato come successo.

### Verifica e prove in VM

I test Go di Krill e setup coprono simulazioni dei dispositivi, conferme TUI,
layout, collisioni su dischi distinti, errori di pulizia, fstab ext4/Btrfs e
template GRUB Debian/Arch/Manjaro. I test del vincolo sul disco verificano
ESP fissa, HOME esterna, blocco di ROOT/ESP esterne prima della formattazione,
ESP assenti o ambigue e conservazione delle voci NVRAM di altre ESP.
I test del modulo Arch/Manjaro eseguono
il selettore del bootloader e il template GRUB in directory temporanee, con
GRUB simulato, includendo BigLinux, BigCommunity e una derivata personalizzata.
Verificano identità EFI, conservazione degli altri slot e del fallback
`EFI/BOOT`, scelta GRUB in Coexist e arresto quando mancano UEFI o ESP montata.
Non costituiscono una prova di avvio su firmware reale.

Il progetto dispone già di **The Furnace**, con compilazione e packaging
automatici e voli di remastering su VM Proxmox gestite tramite snapshot, attraverso
Alpine, Arch, Debian e Fedora. A questa infrastruttura va affiancata una prova
specifica Coexist: prima installazione Debian, seconda Arch, reinstallazione con
ID uguale e diverso, ROOT ed ESP sul disco scelto con HOME anche esterna,
blocco di ROOT/ESP esterne o ESP ambigue, riavvio di ogni slot e
confronto dei dati degli slot preservati e di `EFI/BOOT`. Provare inoltre ESP
piena, NVRAM indisponibile e interruzione durante copia/bootloader. In questa
revisione sono stati eseguiti test locali, senza avviare installazioni in VM.
