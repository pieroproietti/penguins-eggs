# eggs unattended install

Lo scopo è quello di realizzare una installazione di un insieme di computer tutti abilitati di default al boot via PXE il più possibile "leggera" per l'installatore.

Così come è, funzionerebbe pure, nel senso che da un computer installato, dando il comando eui-create.sh dall'interno della cartella eggs-unattended-install, lo script configura il sistema per EUI, genera la iso predisposta con EUI abilitato, disabilita EUI per la macchina e cancella la configurazione per la stessa, quindi avvia cuckoo.

Se nel nostro laboratorio fossero presenti macchine abilitate di default PXE sarebbero completamente formattate all'accensione.

Inzomma... Huston, abbiamo un problema!

1) rendere visibile e stoppabile l'evento

2) a termine dell'installazione il sistema si resetta ed esegue di nuovo il boot. Se la priorità è il boot da rete, il sistema andrebbe ancora una volta ad installare e NON è quello che vogliamo, ci vuole qualcosa che interrompa la chain.

3) probabilmente sarebbe più "sano" configurare le macchine per il boot locale e, se non presente, avviare il boot da rete. Occorrerebbe, però farsi il giro delle macchine per selezionare il boot PXE per quelle che si vogliono installare.

Servono idee

Piero

