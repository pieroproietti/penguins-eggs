# krill - coexist mode

La modalità `coexist` funziona nel modo seguente. Per ora l'ho provata soltanto su una macchina virtuale e con un unico disco, quindi dobbiamo ancora considerarla sperimentale.

### Due percorsi nell'interfaccia

In `eggs sysinstall krill`, scegliendo **Coexist** nella pagina Disk si apre
un menu con due operazioni distinte:

- **Install a distribution on a prepared disk**: scelta della ROOT da
  formattare, di ESP e HOME da riutilizzare e dell'identificativo dell'installazione.
  Questo percorso non contiene l'azione di preparazione dell'intero disco.
  Prosegue con utenti e riepilogo, compresa la conferma delle eventuali
  cancellazioni dei contenuti HOME/EFI dell'installazione sostituita.
- **Prepare a disk for multiple distributions**: scelta del disco,
  dimensionamento degli slot ROOT e anteprima delle partizioni ESP, ROOT e HOME.
  Questa operazione è **completamente distruttiva: cancella tutti i dati sul disco
  selezionato**, come evidenziato già nel menu. Richiede la lettura del layout e
  la digitazione del device prima di procedere. Al termine compare **Disk ready**:
  si può scegliere di installare subito la distribuzione live corrente oppure
  uscire (scelta predefinita). L'installazione non parte automaticamente.

In entrambi i percorsi, **Esc** torna al menu Coexist. Durante il dimensionamento
o l'anteprima, Esc annulla prima la preparazione e torna alla scelta del disco.
Dalla schermata **Disk ready**, Esc esce senza installare o riavviare.
Per aggiungere la seconda distribuzione e le successive si sceglie direttamente
il percorso di installazione, senza preparare nuovamente il disco.

Nel percorso di installazione, **↑/↓** o **Tab** selezionano il campo,
**←/→** scelgono le partizioni e l'**Installation ID** va digitato
(per esempio `debian`). **Invio** passa a Users quando tutte le selezioni
obbligatorie sono valide. Il modulo mantiene visibili campi ed errori su una
console 80×24; il dettaglio delle directory HOME/EFI da cancellare compare
nel riepilogo finale, prima della conferma.

La separazione riguarda l'interfaccia: schema di partizionamento, controlli e
motore d'installazione Coexist restano condivisi con la procedura esistente.

### Schema di partizionamento

Per l'inizializzazione mi sono inventato un mio schema di partizionamento.

Viene creata una partizione ESP per l'avvio UEFI, poi diverse partizioni destinate ai sistemi:

`ROOT1`
`ROOT2`
`ROOT3`
`...`

e infine una partizione `HOME`, che occupa tutto lo spazio rimanente e deve essere maggiore di 16 GB.

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
  - le voci di avvio associate nella NVRAM UEFI tramite `efibootmgr`.

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
`efibootmgr`.

Per il momento considero quindi `coexist` una modalità sperimentale: funziona nei miei test con una macchina virtuale, UEFI, GRUB e un unico disco. Ora dobbiamo provarla con più distribuzioni e in configurazioni reali differenti.

### Revisione della procedura — 13 settembre 2026

Il percorso esaminato comprende TUI, inizializzazione, preflight, formattazione,
montaggio, estrazione squashfs, rimozione dell'utente live, HOME condivisa,
fstab, creazione utenti, script di installazione e smontaggio.

| Fase | Comportamento e osservazioni |
| --- | --- |
| Preparazione facoltativa | Il percorso `Prepare a disk for multiple distributions` cancella **l'intero disco**. Richiede anteprima, lettura del layout e digitazione del device; ricontrolla geometria e identità prima di scrivere. Termina con `Disk ready` e la scelta tra installare e uscire. Non va usato per aggiungere una distribuzione a un disco già preparato. |
| Dimensionamento | ESP da 512 MiB, almeno due ROOT, HOME residua di almeno 16 GiB. La ROOT predefinita è 8 GiB, configurabile da 4 GiB. Il minimo geometrico non garantisce che l'immagine estratta trovi spazio. |
| Selezione | ROOT da formattare, ESP e HOME ext4 da riutilizzare sono esplicite. HOME può essere su un altro disco. La ricerca ESP privilegia il disco scelto e cerca altrove soltanto in assenza di ESP locale. |
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
   e PARTUUID ESP; permette anche di circoscrivere la pulizia NVRAM alla ESP
   corretta. Un vecchio sistema senza label o su un disco scollegato non è
   identificabile con il controllo attuale.
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
   gestione degli errori NVRAM. Rendere selezionabili tutte le ESP anche quando
   il disco ROOT ne contiene già una.
6. **Ripresa e conclusione affidabili.** Valutare rinomina/backup delle vecchie
   directory fino al completamento; riportare gli smontaggi falliti e impedire
   che un errore finale venga presentato come successo.

### Verifica e prove in VM

I test Go di Krill e setup coprono simulazioni dei dispositivi, conferme TUI,
layout, collisioni su dischi distinti, errori di pulizia, fstab ext4/Btrfs e
template GRUB Debian/Arch/Manjaro. I test del modulo Arch/Manjaro eseguono
il selettore del bootloader e il template GRUB in directory temporanee, con
GRUB simulato, includendo BigLinux, BigCommunity e una derivata personalizzata.
Verificano identità EFI, conservazione degli altri slot e del fallback
`EFI/BOOT`, scelta GRUB in Coexist e arresto quando mancano UEFI o ESP montata.
Non costituiscono una prova di avvio su firmware reale.

Il progetto dispone già di **The Furnace**, con compilazione e packaging
automatici e voli di remastering su VM Proxmox gestite tramite snapshot, attraverso
Alpine, Arch, Debian e Fedora. A questa infrastruttura va affiancata una prova
specifica Coexist: prima installazione Debian, seconda Arch, reinstallazione con
ID uguale e diverso, ROOT/HOME/ESP su dischi distinti, riavvio di ogni slot e
confronto dei dati degli slot preservati e di `EFI/BOOT`. Provare inoltre ESP
piena, NVRAM indisponibile e interruzione durante copia/bootloader. In questa
revisione sono stati eseguiti test locali, senza avviare installazioni in VM.
