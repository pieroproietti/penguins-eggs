# ARCH

penguins-eggs pur essendo un tool di sistema, è scritto interamente in typescript, questo ne rende relativamente semplice la portabilità sia tra distribuzioni che tra diverse architetture.


Date le mie limitate risorse - avrei bisogno di sponsorizzazoni, almeno per l'hardware - utilizzo per il suo sviluppo una semplice stazione di lavoro Debian trixie, sulla quale ho installato Proxmox VE.

E' relativamente semplice costruire dei sistemi minimale (naked) utilizzando qemu, mentre per testare le ISO prodotte è consigliabile disporre di hardware reale.

# Como sono arrivato qua
Ho iniziato penguins-eggs come un progetto a livello di passatempo, dopo il mio pensionamento - non volevo buttare alle ortiche le mie conoscenze tecniche - e, in vero, un po' ci speravo di combinare qualcosa di buono.

Le prime versioni di penguins-eggs erano escludivamente per Debian, ma ho sempre avuto chiara l'idea di lavorare per Linux in genere e non per una distribuzione ed architettura in particolare.

Questo mi ha portato a compilare penguins-eggs per amd64 ed i386, a cui successivamente, complice l'acquinsto di una rasberry 4 a realizzare la version arm64, nonchè ad esternde il supporto ad Arch, Debian, Devuan, Fedora, Manjaro, Opensuse e RHEL.

Sono sempre stato interessato alle novità informatiche e, nel corso di una ricersca sui processori RISC, ho pensato di adattare il mio tool all'architettura RISC64.
