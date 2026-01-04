# Architetture

## Oltre lo Standard x86_64
Siamo spesso portati a considerare l'architettura x86_64 come l'unico standard possibile, ma il panorama tecnologico sta cambiando rapidamente. Oggi assistiamo alla massiccia diffusione di ARM64 — che muove la quasi totalità degli smartphone e dei Chromebook — e all'ascesa di RISC-V. Quest'ultima, essendo un'architettura open source, permette ai produttori di innovare liberamente senza il vincolo delle royalty.

Sebbene penguins-eggs sia un tool di sistema, è scritto interamente in TypeScript. Questa scelta tecnica rende la portabilità estremamente semplice, facilitando la transizione non solo tra diverse distribuzioni Linux, ma anche tra architetture hardware differenti.

# Il mio laboratorio
Gestire un progetto di questa portata con risorse limitate richiede inventiva. Per lo sviluppo utilizzo una workstation con Debian Trixie su cui gira Proxmox VE. Questo setup mi permette di creare agevolmente sistemi minimi (naked) tramite QEMU per i test iniziali, anche se per la validazione definitiva delle ISO prodotte rimane indispensabile il test su hardware reale. In questo senso, il supporto di sponsor — specialmente per l'acquisto di hardware specifico — sarebbe fondamentale per accelerare ulteriormente lo sviluppo.

## Genesi e Visione del Progetto
Penguins-eggs è nato come una sfida personale dopo il mio pensionamento. Non volevo che il mio bagaglio di competenze tecniche andasse perduto e, in fondo, speravo di poter dare un contributo concreto alla community Linux.

## Dalle origini al multi-architettura
Le prime versioni erano dedicate esclusivamente a Debian, ma la mia visione è sempre stata agnostica: volevo creare uno strumento per Linux nel suo complesso, non limitato a una singola distribuzione o architettura.

Questo approccio mi ha spinto a estendere il supporto nel tempo:

Architetture: Partendo da amd64 e i386, sono approdato ad [ARM64](ARM64.md) (grazie ai test su Raspberry Pi 4) fino alla recente sfida di [RISCV64](RISCV64.md), nata dalla mia costante curiosità per le innovazioni del settore.

Distribuzioni: Oggi il tool supporta un ecosistema vastissimo, tra cui Arch, Debian, Devuan, Fedora, Manjaro, openSUSE e RHEL.
