
![penguins-eggs](https://github.com/pieroproietti/penguins-eggs/blob/master/assets/penguins-eggs.png?raw=true)
# penguin's eggs

[![NPM Package](https://img.shields.io/npm/v/penguins-eggs.svg?style=flat)](https://npmjs.org/package/penguins-eggs "View this project on npm")
[![Build Status](https://travis-ci.org/pieroproietti/penguins-eggs.svg?branch=master)](https://travis-ci.org/pieroproietti/penguins-eggs)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![Join the chat at https://gitter.im/penguins-eggs/Lobby](https://badges.gitter.im/pieroproietti/penguins-eggs.svg)](https://gitter.im/penguins-eggs/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
&nbsp;[gitbook](https://penguin-s-eggs.gitbook.io/project/) &nbsp;[ReadMe](./README.md)&nbsp;[trends](https://www.npmtrends.com/penguins-eggs) 

[Note dello sviluppatore](https://github.com/pieroproietti/penguins-eggs/blob/master/developer.md)

## Presentazione
penguins-eggs è uno strumento a riga di comando, in sviluppo attivo, che vi permette di rimasterizzare il vostro sistema e redistribuirlo come una immagine iso.

Il progetto è pensato non solo per la creazione dell'immagine ISO del sistema (l'uovo di pinguino) ma anche per includere tutti i necessari servizi (dhcp, dhcp-proxy, tftp e https) per realizzare un server PXE veloce e potente che può lavorare da solo, o integrarsi in una rete preesistente all'interno della tua azienda o in casa.

Essendo scritto in puro javascript, può essere idealmente utilizzato per distribuzioni Linux differenti. Al momento, è testato su Debian 10 Buster (in sviluppo), Debian 9 Stretch (stable), Debian 8 Jessie (old stable), Ubuntu 19.04, 18.10 etc, LMDE 2 e LMDE 3, Linux Mint 19.1. Vorremmo estendere il supporto ad altre versioni di Linux, in particolare a Fedora (per ragioni di diffusione) ed ad Arch, ma abbiamo bisogno di aiuto.

penguins-eggs, al momento "aprile 2019" è in uno stato maturo, anche se può presentare qualche problema con persone senza sufficienti capacità di gestione di Linux. D'altra parte, per sua natura, penguins-eggs non è adatto ad un utente finale ma è sostanzialmente uno strumento tecnico per tecnici.

Con esso potrete facilmente creare la propria distribuzione Linux per la scuola, l'azienda, financo il proprio gruppo di amici, distribuendolo attraverso le immagini iso su chiavetta o su internet. Mentre il processo di creazione dell'immagine ISO è sostanzialmente un processo cli, per quanto riguarda l'installazione si può procedere in due modalità: modalità cli o gui. Difatti, grazie alla integrazione con calamares, l'installazione del vostro sistema live sarà professionale, allo stesso livello se non superiore, al sistema di installazione originale.


## Installazione di penguins-eggs
 Ok, è venuto il momento di provare penguin's eggs!
 
 Per prima cosa è necessario installare nodejs e npm, si consiglia l'installazione a partire dalla repository di [nodesource](https://github.com/nodesource/distributions/blob/master/README.md#deb).
 

A questo punto potremo installare penguins-eggs con i comandi:

```sudo npm config set unsafe-perm true```

```sudo npm i penguins-egg -g```

## Installazione dei prerequisiti
penguins-eggs per il suo funzionamento ha bisogno di alcuni programmi, che dovremo istallare. Potete procedere semplicemente con il comando:

```sudo eggs prerequisites```


## Comandi
Su eggs potete agire con i seguenti comandi:
* prerequisites
* spawn
* info
* kill
* calamares
* hatch

### spawn
La funzione di spawm è la "deposizione" dell'uovo ovvero la creazione della Iso contenente l'immagine del sistema. Il comando spawn accetta il parametro ```-d``` o ```--distroname``` che definisce il nome della distro.

```sudo eggs spawn -d mydistroname```

### info
Ottiene le principali informazione sul vostro sistema installato. Queste informazioni sono utilizzate per il processo di spawn e per la configurazione del programma di installazione calamares.

```sudo eggs info```


### kill
Si intende l'operazione di cancellazione dell'uovo creato con l'operazione di spawn. Pulisce il sistema e recupera lo spazio.

```sudo eggs kill```

### calamares (configurazione calamares)
Questo comando è utile soprattutto in fase di sviluppo e debugging, genera la configurazione di calamares anche "al volo" permettendo così di correggere errori presenti nell'immagine stessa.

```sudo eggs calamares```

### hatch (avvio installazione cli)
Un uovo per diventare un pinguino necessita del processo di "cova" hatch! Nel nostro caso avremo bisogno semplicemente di definire all'uovo le informazioni necessarie e, in pochi minuti, avremo un nuovo pinguino installato.

```sudo eggs hatch```

Verranno proposti alcuni parametri come: username, password, hostname,
domain, networking, installation device and type. Normalmente potrete accettare i default.

#### Opzioni
* -d --distroname <distroname>

Se non usate questa opzione, il nome dell'host (hostname) verrà utilizzato come nome della distro. L'immagine generata verrà quindi denominata  hostname will us  dove-YYYY-MM-DD_HHMM-ZZ.

esempio: host ``penguin`` will produce an iso called ``penguin-2017-10-22_2047_02.iso``

**Attenzione**: Non impauritevi, ma fate attenzione, l'operazione di hatch è distruttiva ed irreversibile, verrà formattato i vostro disco rigido e gli eventuali dati presenti.  **Assicuratevi di avere il backup dei vostri dati prima di operare**.

### calamares (installazione gui)
Probabilmente preferirete l'installatore grafico per le vostre esigenze, anche se a volte scoprirete la praticità del sistema cli. Per avviare l'installer grafico, date il seguente comando:

```sudo calamares```

calamares è un programma di installazione grafico molto avanzato. Eggs lo installa con i prerequisites ed esegue la configurazione di esso con l'opzione calamares.

## Sviluppo
Fate riferimento a quanto riportato nella versione in inglese.

## Altre informazioni
Per altre informazioni, potete consultare [Piero Proietti's blog](http://pieroproietti.github.com), contattarmi o aprire una [issue](https://github.com/pieroproietti/penguins-eggs/issues) su github.

* facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/)
* twitter: [@pieroproietti](https://twitter.com/pieroproietti)
* google+: [PieroProietti](https://plus.google.com/+PieroProietti)
* mail: piero.proietti@gmail.com

**artisan**

## Copyright and licenses
Copyright (c) 2017, [Piero Proietti](http://pieroproietti.github.com), dual licensed under the MIT or GPL Version 2 licenses.

