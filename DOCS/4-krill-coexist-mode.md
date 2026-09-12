# krill - coexist mode

La modalità `coexist` funziona nel modo seguente. Per ora l'ho provata soltanto su una macchina virtuale e con un unico disco, quindi dobbiamo ancora considerarla sperimentale.

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

La corrispondenza che utilizzo è:

`hostname = LABEL della partizione = GRUB menuentry id`

Per esempio, se installo Arch con hostname `arch`, la partizione ROOT utilizzata riceve la LABEL `arch` e la relativa voce di GRUB utilizza `arch` come `menuentry --id`.

Se successivamente installo Manjaro con hostname `manjaro`, avremo:

`manjaro = LABEL manjaro = GRUB menuentry id manjaro`

In questo modo ogni sistema ha la propria partizione root e viene identificato in maniera semplice e coerente.

La partizione HOME è condivisa tra le diverse installazioni, mentre ogni distribuzione mantiene il proprio sistema root indipendente.

### Avvio

Attualmente `coexist` funziona **soltanto su sistemi UEFI** e utilizza **esclusivamente GRUB** come bootloader.

Non è previsto il supporto per BIOS/Legacy né, al momento, per altri bootloader.

Le diverse distribuzioni condividono la stessa ESP e le voci di GRUB permettono di scegliere quale sistema avviare.

### Limitazioni attuali

Manca ancora la gestione completa della pulizia quando viene eliminata una distribuzione installata.

Attualmente, quando si cancella una distribuzione, **non vengono eliminati automaticamente i dati che quella distribuzione ha lasciato nella partizione HOME né tutti i file ad essa relativi presenti nel sistema di boot/ESP**.

Di conseguenza possono rimanere tracce di distribuzioni precedentemente installate e successivamente cancellate.

Questa è una delle parti che dobbiamo ancora completare.

Per il momento considero quindi `coexist` una modalità sperimentale: funziona nei miei test con una macchina virtuale, UEFI, GRUB e un unico disco. Ora dobbiamo provarla con più distribuzioni e in configurazioni reali differenti.
