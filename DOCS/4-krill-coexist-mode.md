# Krill — Coexist Mode & `eggs coexist`

La modalità `coexist` permette la coesistenza pulita di più distribuzioni Linux su uno o più dischi dedicati, gestite nativamente con UEFI e GRUB.

### Architettura e separazione delle responsabilità

1. **Amministrazione e preparazione del disco (`eggs coexist`)**:
   - `sudo eggs coexist init <device>`: Prepara l'intero disco fisico selezionato (GPT, ESP FAT32 da 512 MiB, N slot ROOT di dimensione uniforme, PARTLABEL GPT `coexist-N` e label filesystem `rootN`).
   - `eggs coexist info [device]`: Mostra la panoramica dei dischi Coexist rilevati, dell'ESP e lo stato di ogni slot (Disponibile vs Installato con identificatore di sistema).
   - `sudo eggs coexist install [slot]`: Lancia direttamente l'installer Krill in modalità Coexist, pre-selezionando opzionalmente lo slot target.

2. **Installazione (`eggs sysinstall krill` o `eggs coexist install`)**:
   - Krill rileva automaticamente se nel sistema sono presenti dischi formattati per Coexist.
   - La modalità Coexist compare dinamicamente tra le scelte di partizionamento **solo** se è presente almeno un disco Coexist.
   - Non è più necessario passare il flag `--coexist`: Krill permette l'avvio anche da sistema installato se rileva un disco Coexist disponibile.
   - Il flusso di installazione è diretto e lineare: selezione del disco Coexist, scelta dello slot ROOT, e assegnazione automatica del **System Name (ID)** nel formato `<part>-<distro>` (es. `sda2-debian`, `sdb3-arch`).
   - La ESP viene rilevata automaticamente sul disco selezionato e resta preservata. Non viene toccata nessuna altra partizione.

### Dischi preesistenti e ESP fissa

L'installazione usa esclusivamente uno slot ROOT già esistente sul disco
selezionato e la sua unica ESP valida (tipo GPT ESP, filesystem FAT). Se la ESP
manca o ne esistono più di una valide, l'installazione viene bloccata: non viene
cercata una ESP su altri dischi. Il vincolo viene verificato nel preflight e
ripetuto prima della formattazione. Cambiare disco aggiorna la ESP fissa e azzera
la scelta dello slot ROOT.

Non è necessario che il disco sia stato preparato da Krill o che le partizioni
abbiano label generica `root1`, `root2`, ecc. La ESP non viene formattata;
resta applicata la pulizia dei contenuti EFI dell'identificativo selezionato
descritta sotto. Le label delle altre partizioni non vengono cambiate.

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

È possibile avere quanti dischi Coexist si desidera nel sistema, poiché ciascun disco è completamente auto-consistente.

### Installazione e identità dello slot

Quando si installa una distribuzione in uno slot Coexist:
1. Si seleziona il disco e lo slot ROOT desiderato (libero con etichetta generica come `root1`, `root2` oppure già occupato per reinstallazione).
2. Krill propone automaticamente un **System Name (ID)** strutturato come `<partizione>-<distro>`, ad esempio `sda2-debian`, `sdb3-arch`, `nvme0n1p2-debian` (personalizzabile, fino a 16 caratteri per piena conformità ext4).
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
montaggio, estrazione squashfs, rimozione dell'utente live, fstab, creazione utenti,
script di installazione e smontaggio.

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
   aggiunto intercetta collisioni visibili, ma non dimostra la proprietà della
   directory EFI. Servirebbe un registro che associ ID, UUID ROOT
   e PARTUUID ESP. La pulizia NVRAM è già circoscritta al PARTUUID della ESP
   utilizzata; il registro servirebbe a dimostrare la proprietà della directory.
   Un vecchio sistema senza label o su un disco scollegato non è identificabile
   con il controllo attuale.
2. **Preflight completo prima di wipefs.** Verificare sorgente squashfs,
   strumenti, configurazioni shellprocess e spazio necessario all'estrazione.
   Oggi alcuni errori, come una sorgente mancante, emergono soltanto dopo la
   formattazione. Rafforzare inoltre il controllo dei dispositivi con holder
   attivi: il controllo ordinario usa i mountpoint, mentre l'inizializzatore
   controlla anche gli holder in sysfs.
3. **Identità coerente nell'interfaccia.** La modifica dell'Installation ID
   aggiorna l'hostname, ma la pagina Users permette poi di cambiarlo separatamente.
   L'eventuale uso dello stesso ID anche come `menuentry --id` di GRUB richiede
   una gestione esplicita nei template.
4. **Bootloader delle altre famiglie.** Adeguare Fedora e Alpine prima di
   rimuovere il blocco; provare anche persistenza dopo aggiornamenti GRUB e
   gestione degli errori NVRAM, mantenendo la ESP fissa sul disco selezionato.
5. **Ripresa e conclusione affidabili.** Valutare rinomina/backup delle vecchie
   directory fino al completamento; riportare gli smontaggi falliti e impedire
   che un errore finale venga presentato come successo.

### Verifica e prove in VM

I test Go di Krill e setup coprono simulazioni dei dispositivi, conferme TUI,
layout, collisioni su dischi distinti, errori di pulizia, fstab ext4/Btrfs e
template GRUB Debian/Arch/Manjaro. I test del vincolo sul disco verificano
ESP fissa, blocco di ROOT/ESP esterne prima della formattazione,
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
ID uguale e diverso, ROOT ed ESP sul disco scelto,
blocco di ROOT/ESP esterne o ESP ambigue, riavvio di ogni slot e
confronto dei dati degli slot preservati e di `EFI/BOOT`. Provare inoltre ESP
piena, NVRAM indisponibile e interruzione durante copia/bootloader. In questa
revisione sono stati eseguiti test locali, senza avviare installazioni in VM.
