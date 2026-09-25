# Il viaggio: dal sistema originale al proprio clone, e ritorno

**16 settembre 2026 — Piero Proietti e Codex, con penguins-eggs C/Go.**

Questa è la memoria di una prova reale: un sistema Debian ha prodotto il
proprio remaster con penguins-eggs, il clone è stato installato in uno slot
Coexist e, dopo il riavvio, il lavoro è proseguito dal nuovo sistema con lo
stesso utente, il repository e la conversazione di sviluppo. Infine siamo
tornati al sistema originale portando con noi la conversazione aggiornata.

L'idea di Piero era semplice: «Sono io che dovrei riavviare il computer,
entrare direttamente come artisan e riavviarti». L'assistente avrebbe
ritrovato il contesto salvato; per accorgersi del cambio di sistema avrebbe
dovuto controllare l'ambiente, per esempio la partizione montata come `/`.

## Da dove siamo partiti

Il sistema di sviluppo era Debian 13.7 Trixie, hostname `colibri`, con
utente `artisan` (UID e GID 1000). penguins-eggs era alla versione
`v26.9.15`; dopo la compilazione delle correzioni la versione installata
riportava `v26.9.15-1`.

All'inizio i dischi erano identificati così:

| Disco | Struttura e funzione |
| --- | --- |
| `/dev/sda`, 32 GiB | Sistema originale: ESP da 300 MiB su `sda1`, root da 31,7 GiB su `sda2`. |
| `/dev/sdb`, 32 GiB | Disco Coexist: ESP da 512 MiB su `sdb1` e tre slot root da 10 GiB. |
| `/dev/sdb2` | Primo slot già installato, label `sdb2-debian`. |
| `/dev/sdb3` | Secondo slot già installato, label `sdb3-debian`. |
| `/dev/sdb4` | Terzo slot disponibile, label iniziale `root3`, PARTLABEL `coexist-3`. |

Coexist usava già l'architettura **Pure Slots**: ogni sistema aveva la propria
root e la propria `/home`, con una directory EFI dedicata sulla ESP del
disco Coexist. Nessuna home condivisa fra distribuzioni.

## Il percorso scelto

Il ciclo di lavoro era:

```text
Sistema originale, artisan e repository
    → eggs remaster --clone
    → ISO e filesystem.squashfs
    → Krill / Coexist, installazione nello slot libero
    → riavvio eseguito da Piero
    → accesso come artisan nel clone
    → ripresa della sessione Codex
    → trasferimento della conversazione aggiornata all'originale
    → riavvio e ripresa sull'originale
```

L'installazione poteva partire direttamente dall'host installato: Krill
individuava lo squashfs locale del remaster in
`/home/eggs/isodir/live/filesystem.squashfs`. Non era necessario avviare
prima la ISO. Questa prova documenta quel percorso; non costituisce una
prova separata di avvio della live clone da ISO.

Per preparare l'immagine Piero ha usato dal proprio terminale:

```bash
sudo eggs kill
sudo eggs remaster --clone
```

`kill` è l'alias di `destroy`: libera il nest e smonta i filesystem di
lavorazione. Non significa cancellare tutta `/home`.

Codex poteva esaminare codice e immagini, ma non autenticarsi a sudo al
posto di Piero. Le operazioni privilegiate e i riavvii sono rimasti nelle
mani dell'autore.

## La correzione prima della partenza

La revisione ha individuato due problemi nel percorso dall'host al clone.

1. La preparazione dell'installer leggeva `sibling.yaml` dal sistema in
   esecuzione. L'host dichiarava `standard`, mentre l'immagine da installare
   dichiarava `clone`. Poteva quindi restare attiva la creazione degli
   utenti, già presenti nello squashfs.
2. La sequenza conteneva ancora `removeuser`, configurato per eliminare
   `live`. Nel clone di questo host esisteva `artisan`, ma non `live`.
   In Coexist un errore di `userdel` era diventato fatale, quindi avrebbe
   potuto interrompere il lavoro dopo la formattazione e l'estrazione.

Il ricordo di Piero era corretto: il supporto agli utenti clonati esisteva
già. Il commit `3496a8f` del 16 giugno aveva introdotto il marker per
saltare la creazione utenti nei clone. Avviando una live clone, il marker
del sistema in esecuzione era quello giusto. Il nuovo percorso dall'host
richiedeva invece di leggere l'identità dell'immagine sorgente.

Inoltre il commit `b160e4c` del 12 settembre aveva reso fatale l'errore di
rimozione dell'utente live in Coexist, inizialmente nel contesto della home
condivisa. Questa condizione era rimasta dopo il passaggio a Pure Slots.

Abbiamo scelto di correggere prima di installare. La modifica:

- legge il marker direttamente dallo squashfs selezionato;
- usa la stessa sorgente per riconoscimento della modalità ed estrazione;
- nei clone rimuove dalla sequenza `users`, `removeuser` e `displaymanager`,
  conservando account, password, home e configurazione del display manager;
- fa saltare a Krill la pagina utenti e mostra nel riepilogo la conservazione
  degli utenti clonati, mantenendo la conferma prima di scrivere sullo slot;
- rifiuta una sorgente o un marker non leggibile o non valido prima di
  avviare l'installer, senza ripiegare silenziosamente su `standard`.

Quest'ultimo comportamento significa anche che immagini prive di un marker
valido richiedono una gestione esplicita: non vengono considerate standard
per supposizione.

Sono passati i test di Krill, del suo engine, del setup e della CLI.
I nuovi test includono piccole immagini squashfs reali, modalità standard,
clone e crypted, marker mancanti o non validi, percorsi contenenti spazi e
apici, sequenze dei moduli e navigazione della pagina utenti. La prova reale
descritta qui riguarda **clone**, non valida il percorso crittografato.

Le modifiche erano ancora non committate durante il viaggio. Anche i file
di test nuovi sono arrivati nel clone.

## Le immagini e il controllo prima di installare

Una prima produzione clone aveva riportato **2,24 GiB in 41 secondi**.
Dopo l'aggiornamento di eggs, un'immagine rigenerata alle 07:39 risultava
invece standard: il controllo del marker e degli utenti mostrava `live` e
l'assenza di `/home/artisan`. L'installazione di quell'immagine non è stata
il passo successivo del viaggio.

Sul sistema originale è stata poi trovata l'immagine corretta:

```text
egg-of-debian-trixie-colibri-clone-amd64-2026-09-16_0741.iso
```

Il controllo del clone aveva confermato `mode: clone`, l'account `artisan`,
il repository e il file della sessione Codex nella home. Il nome della ISO
era utile, ma la verifica del contenuto era la conferma decisiva.

Piero ha eseguito l'installazione Coexist e il riavvio. Il comando del
percorso concordato era `sudo eggs coexist install`, con selezione del
terzo slot libero. I nomi dei device riportati qui descrivono questa prova:
prima di riutilizzarli occorre verificare nuovamente `eggs coexist info`.

## Il risveglio nel clone

Al messaggio «dovremmo essere sul sistema installato su `/dev/sdb4`»,
la verifica ha confermato:

| Controllo | Risultato nel clone |
| --- | --- |
| Root `/` | `/dev/sdb4`, ext4, label `sdb4-debian`. |
| ESP | `/dev/sdb1`, montata su `/boot/efi`. |
| Utente | `artisan`, UID/GID 1000, home `/home/artisan`. |
| Hostname | `colibri`. |
| Marker | `mode: clone`. |
| eggs | `v26.9.15-1`. |
| Repository | Stesso commit di base `af9f764`, correzioni locali e nuovi test presenti. |
| Sessione | Conversazione ripresa nel nuovo sistema. |

Il parametro `root=UUID=...` del kernel e `/etc/fstab` puntavano entrambi
alla nuova root. Lo slot da 10 GiB risultava occupato per circa 6,4 GiB,
con 2,9 GiB disponibili.

È stato il momento dello champagne: **«Brindiamo da `/dev/sdb4`»**.

La continuità riguardava dati e conversazione salvata. Il processo Codex
non aveva attraversato il riavvio: Piero lo aveva riaperto e aveva ripreso
la sessione sul nuovo sistema.

## Guardare l'originale dal clone

Piero ha montato la root originale su `/mnt/eggs-source` in sola lettura,
con `ro,noload`, per consentire il confronto senza ripristino del journal.

Le verifiche hanno trovato:

- stesso utente `artisan`, con UID/GID, home e shell corrispondenti;
- contenuto identico del codice dell'installer nei due repository;
- stesso hash SHA-256 dei binari `/usr/bin/coa`;
- `fstab` distinti e coerenti con root ed ESP dei rispettivi dischi;
- la ISO clone delle 07:41 ancora presente sul sistema originale.

Il log dell'installazione sul disco originale richiedeva privilegi root
e non è stato letto dall'assistente. Il successo riportato si basa quindi
sull'avvio effettivo e sui controlli del sistema installato, non su una
revisione completa di quel log.

Un dettaglio è rimasto aperto: i due `/etc/machine-id`, entrambi non vuoti,
contenevano lo stesso identificativo. La causa non è stata determinata.
La rigenerazione dell'identità macchina merita una verifica dedicata;
non va confusa con gli UUID dei filesystem, che erano differenti.

## Il ritorno con la conversazione aggiornata

Il sistema originale conteneva già la stessa sessione Codex, ma con una
cronologia precedente. Abbiamo preparato uno script temporaneo per:

1. verificare l'UUID del filesystem montato come originale;
2. rimontarlo in lettura e scrittura;
3. salvare una copia di sicurezza del suo file di sessione;
4. validare e copiare il JSONL aggiornato, verificando i byte copiati;
5. sincronizzare la scrittura e ripristinare il montaggio in sola lettura.

La copia finale era prevista dopo l'uscita da Codex, così da includere
anche gli ultimi messaggi. Non era necessario sovrascrivere tutta la
directory `.codex`: la stessa sessione era già presente sul destinatario.
Questo trasferimento mirato descrive il caso osservato, non una procedura
generale di migrazione fra installazioni Codex diverse.

Dopo il riavvio, Piero ha ripreso la conversazione dal repository con
`codex resume`, indicando l'identificativo della sessione. Il ritorno al
sistema originale è stato confermato dall'UUID della root.

## La sorpresa dei nomi dei dischi

Al ritorno Linux aveva scambiato i nomi assegnati ai due dischi:

| Sistema | Prima del ritorno | Dopo il ritorno | UUID della root |
| --- | --- | --- | --- |
| Originale | `/dev/sda2` | `/dev/sdb2` | `687c6bec-cabe-4fe9-b733-b34bcda2395f` |
| Clone nel terzo slot | `/dev/sdb4` | `/dev/sda4` | `4525940f-2c9f-4ff3-93c7-31ffbfe4886b` |

Il disco originale conservava l'ESP da 300 MiB e la root da 31,7 GiB;
il disco Coexist conservava l'ESP da 512 MiB e i tre slot. Erano cambiati
i nomi dei device, non l'identità dei filesystem.

`fstab` usava già gli UUID, quindi il cambio non ha compromesso l'avvio.
La label `sdb4-debian` è rimasta sul clone anche quando la partizione è
diventata `/dev/sda4`: resta un identificatore descrittivo, non una promessa
sul nome che Linux assegnerà al prossimo avvio.

## Cosa ci lascia questa prova

Per lo sviluppo di penguins-eggs questo ciclo permette di provare il
risultato del proprio lavoro in un'installazione avviabile, mantenendo
l'originale e altri slot disponibili. Il clone porta con sé anche il
workspace non ancora committato; il trasferimento della sessione consente
di riprendere il ragionamento dopo il cambio di sistema.

La prova si affianca a **The Furnace**, l'infrastruttura di compilazione,
packaging e remastering su VM Proxmox con snapshot, con verifiche fra
Alpine, Arch, Debian e Fedora. Qui abbiamo osservato un percorso concreto
Debian → clone → Krill Coexist → avvio → ritorno, senza estendere il
risultato a tutte le distribuzioni o a tutte le modalità.

Restano da approfondire la stima dello spazio prima della formattazione
e la propagazione degli errori finali di NVRAM e smontaggio. La selezione
e l'identificazione degli slot devono continuare a distinguere nomi
temporanei dei device e identità persistenti.

Il risultato del viaggio è stato verificato da entrambe le sponde:
**abbiamo lavorato nel clone del nostro sistema e siamo tornati
all'originale con la conversazione del viaggio.**

## Epilogo: il mistero di machine-id svelato

Subito dopo il rientro sull'originale abbiamo approfondito il dettaglio rimasto aperto:
perché `/etc/machine-id` conteneva lo stesso identificativo su originale e clone?

L'indagine ha rivelato che non si trattava di un difetto di penguins-eggs né di una
mancata esclusione: nello squashfs il file `/etc/machine-id` era regolarmente assente.
In Krill il modulo `machineid` scriveva un file vuoto (`0` byte), confidando che
systemd ne avrebbe rigenerato uno nuovo al primo avvio.

Tuttavia, secondo la specifica di systemd (`man 5 machine-id`):
> *«If this file is empty or missing, systemd will attempt to use [...] the KVM DMI
> product_uuid or the devicetree vm,uuid (on KVM systems), the Xen hypervisor uuid,
> and finally a randomly generated UUID.»*

Essendo la prova eseguita su una macchina virtuale KVM/Proxmox, systemd al primo boot
del clone non ha generato un UUID casuale: ha rilevato il `product_uuid` DMI dell'hypervisor.
Avendo clonato e installato sulla **stessa macchina virtuale**, originale e clone
condividevano lo stesso hardware virtuale e systemd ha riassegnato a entrambi lo stesso ID.

La soluzione è stata implementata direttamente in Krill:
- Krill ora genera esplicitamente un identificativo crittografico casuale a 128 bit
  (32 caratteri esadecimali minuscoli) e lo scrive in `/etc/machine-id` al momento dell'installazione;
- `var/lib/systemd/random-seed` è stato aggiunto all'elenco delle esclusioni per non
  ereditare il seed di entropia dell'host;
- systemd al primo boot trova un'identità già valida e non vuota, evitando il fallback
  sul DMI della VM e garantendo identificativi univoci su qualsiasi hypervisor o slot Coexist.

## Riferimenti nel repository

- [Guida pratica Coexist](../../2-user-manual/5-coexist.md)
- [Architettura e revisione Coexist](../../4-krill-coexist-mode.md)
- [Preparazione dell'installer](https://github.com/pieroproietti/penguins-eggs/blob/main/coa/pkg/sysinstall/setup/orchestrator.go)
- [Riconoscimento della modalità e conservazione utenti](https://github.com/pieroproietti/penguins-eggs/blob/main/coa/pkg/sysinstall/setup/sibling.go)
- [Test con immagini squashfs](https://github.com/pieroproietti/penguins-eggs/blob/main/coa/pkg/sysinstall/setup/sibling_test.go)
- [Test del percorso utenti in Krill](https://github.com/pieroproietti/penguins-eggs/blob/main/coa/pkg/sysinstall/krill/clone_flow_test.go)
