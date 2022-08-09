# Debian install and clone

Inizieremo con un preesitente installazione di Debian, probabilmente il nostro sistema che vogliamo rendere riproducibile.


## Scaricare l'ultimo pacchetto 

* Scaricate l'ultimo pacchetto eggs disponibile dalla pagina [debs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) del progetto su sourceforge. Nel nostro caso l'ultima versione disponibile è la eggs_9.2.1_amd64.deb.

eggs necessita di alcune dipendenze, quindi conviene in primo luogo lanciare un comando per l'aggiornamento:

```sudo apt update```

A questo punto, avviamo l'installazione con il comando:

```sudo dpkg -i eggs_9.2.1_amd64.deb```

Molto probilmente troverete un errore per la mancanza di dipendenze, niente paura, basterà un comando per sistemare il tutto:

```sudo apt install -f```

A questo punto il pacchetto eggs è installato e disponibile.

## Configurazione
Qua saremo brevi, ci faremo aitare da dad e richiederemo i default:

```sudo eggs dad -d```

Se desiderate utilizzare l'installer grafico calamares, queste sono le istruzioni per installarlo:

```sudo eggs calamares --install```


## Uso

### normale veloce (rimuove gli utenti)

```sudo eggs produce --fast```

### clone veloce (gli utenti saranno messi sul live)

```sudo eggs produce --fast --clone```
