# eggs addons

``ATTENZIONE: Non tutte le caratteristiche sono state implementate, al momento funziona SOLO
--theme vendor.``

Sto provando a far funzionare eggs con la possibilità per gli utilizzatori di configurarne l'aspetto 
grafico o altre caratteristiche. Ho scelto il termine addons al posto del più canonico plugins,
perchè vi è la possibilità utilizzando oclif-dev di scrivere dei veri e propri plugins che potranno
fornire al tool comandi aggiuntivi, hooks ed altre caratteristiche utilizzando oclif/plugin-plugins.

Gli addons risiedono nella cartella addons, al primo livello c'è il vendor, colui che ha realizzato il 
prodotto, al momento abbiamo 4 vendor:
* debian
* deblinux
* eggs
* ufficiozero

# Sintassi per l'uso
Il caso generico è:
```--addons vendor/plugin```

Ad esempio per utilizzare il branding debian

```sudo eggs -fv --addons debian/theme``` 

per il theme, assistant e remote-assistant, esistono delle scorciatoie, quindi:

```sudo eggs -fv --theme debian``` equivalente a ```sudo eggs -fv --addons debian/theme

è possibile, inoltre inserire più addons con un solo flag:

```sudo eggs -fv --addons debian/theme eggs/pre-install-assistant ufficiozero/remote-assistant```

Installa il tema debian, l'assistant di eggs ed il remote-assistant di ufficiozero.

# Addon presenti

## eggs
Per omogeneità ho voluto configurare eggs come addon. Se non diversamente specificato
vengono utilizzati i componenti di eggs.

### theme
Contiene il tema di default. Non è necessario specificarlo, se non viene fornito un tema
specifico eggs si mostrerà con "i soliti pinguini...".

## debian
Ho qui inserito la versione di debian delle impostazioni per calamares e l'icona di avvio per lo stesso.
### theme
Fornisce il branding debian da calamares-settings-debian

# deblinux
deblinux è una remix con desktop mate, realizzata da Andrea Carbonaro.

### assistant
Permette la scelta tra l'installer grafico o l'installer manuale.

### theme
Tema per eggs di deblinux.


## ufficiozero
Ufficio Zero Linux è un sistema operativo open source ideato da SIITE SRLS, che ha acquisito 
lo storico dominio e mette a disposizione del team di sviluppo vari server virtuali per ospitare 
i servizi web, servizi mail, repository e server di condivisione ad uso del team di sviluppo.

### remote-support
Configura a video anche sulla live, un link per scaricare ed avviare l'assistenza remota.
Al momento è solo una directory, vorrei utilizzare lo script di Adriano per scaricare ed avviare 
dw-agent per permettere all'utente di richiedere l'assistenza remota per l'installazione.

### theme
Tema di ufficiozero.








