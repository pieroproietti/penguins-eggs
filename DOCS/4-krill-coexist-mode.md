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

### Schema di partizionamento (Pure Slots)

Per l'inizializzazione del disco viene adottato lo schema a "Pure Slots", radicalmente semplificato:

1. Una partizione **ESP** (512 MiB, FAT32) per l'avvio UEFI.
2. **N partizioni ROOT slot** (formato ext4 o btrfs), ciascuna con una propria `/home` standard e autonoma:

`root1`
`root2`
`root3`
`...`

Ogni slot ROOT ha dimensione predefinita di **10 GiB** (personalizzabile a partire da 4 GiB). Tutto lo spazio restante del disco viene suddiviso in slot interi di uguale dimensione.

Con questa architettura a slot puri:
- **Nessuna partizione SHARED_HOMES**: ogni distribuzione ha la propria directory `/home` nativa all'interno del proprio slot root, eliminando conflitti di permessi UID/GID, complessità di bind-mount `/srv/homes` e dipendenze tra dischi.
- È possibile avere quanti dischi Coexist si desidera nel sistema, poiché ciascun disco è completamente auto-consistente.

### Installazione e identità dello slot

Quando si installa una distribuzione in uno slot Coexist:
1. Si seleziona il disco e lo slot ROOT desiderato (libero con etichetta generica come `root1`, `root2` oppure già occupato per reinstallazione).
2. Si assegna un **System Name (ID)**, ad esempio `debian`, `arch`, `manjaro` (max 16 caratteri alfanumerici minuscoli o trattini).
3. La partizione ROOT selezionata viene formattata e riceve come LABEL il System Name scelto.
4. L'avvio UEFI scrive la directory dedicata in `EFI/<System_Name>` e registra la voce nella NVRAM.
5. La partizione ESP e tutti gli altri slot ROOT del disco rimangono completamente intoccati e preservati.

### Sostituzione e pulizia di uno slot

Quando si reinstalla o si sostituisce una distribuzione su uno slot già occupato:
- `krill` legge la `LABEL` del filesystem presente sulla partizione selezionata.
- Se la label corrisponde a un'installazione Coexist precedente (non generica come `root1`, `root2`), prima di procedere elimina automaticamente:
  - la directory dell'avvio UEFI precedente `/boot/efi/EFI/<vecchia_label>`
  - le voci di avvio associate nella NVRAM UEFI tramite `efibootmgr`, relative alla ESP utilizzata.
- La partizione slot viene formattata ex novo (tabula rasa dello slot), preservando la ESP e gli altri slot.

Nella schermata di riepilogo di `krill` viene segnalato chiaramente quali risorse della precedente installazione verranno rimosse (`PURGE PREVIOUS`).

### Revisione della procedura — 13 settembre 2026

Il percorso esaminato comprende TUI, inizializzazione, preflight, formattazione,
montaggio, estrazione squashfs, rimozione dell'utente live, HOME condivisa,
fstab, creazione utenti, script di installazione e smontaggio.

| Fase | Comportamento e osservazioni |
| --- | --- |
| Inizializzazione | Il percorso `Initialize disk for Coexist` formatta **l'intero disco** creando 1 ESP (512 MiB FAT32) e N slot ROOT (ext4 o btrfs). Richiede anteprima, lettura del layout e digitazione del device. Termina con `Disk ready` e la scelta tra installare subito o uscire. Non va usato per aggiungere una distribuzione a un disco già inizializzato. |
| Dimensionamento | ESP da 512 MiB, almeno due slot ROOT. La ROOT predefinita è 10 GiB, configurabile da 4 GiB. Tutto lo spazio del disco viene suddiviso in slot interi. |
| Selezione | ROOT slot esistente sul disco scelto da formattare; ESP unica dello stesso disco fissa e preservata. ESP assente o ambigua blocca l’installazione. |
| Preflight | UEFI, famiglia supportata, device distinti, filesystem/UUID, directory EFI e collisioni delle label. |
| Copia | Si formatta soltanto lo slot ROOT selezionato. La ESP è montata in `/boot/efi`. |
| Utenti e HOME | `/home` risiede nativamente nel filesystem dello slot ROOT. Nessuna complicazione di bind-mount o permessi UID/GID condivisi tra distribuzioni. |
| Fstab | Generazione standard tramite UUID per la partizione root e per `/boot/efi`. Nessuna voce speciale per `/home`. |
| Bootloader | Debian, Arch e Manjaro installano GRUB in `EFI/<System_Name>` senza toccare `EFI/BOOT` o gli altri bootloader. |
| Errori | La pulizia non ignora gli errori restituiti dalle operazioni. La reinstallazione esegue la pulizia di `EFI/<vecchio_id>` e delle voci NVRAM associate. |

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
