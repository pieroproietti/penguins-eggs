# ISTRUZIONI DEI PLUGIN

``ATTENZIONE: Non tutte le caratteristiche sono state implementate, al momento funziona SOLO
--branding vendor``


Plugin è probabilmente un nome esagerato, però sto provando a far funzionare eggs con la possibilità per gli
utilizzatori di configurarne l'aspetto grafico o altre caratteristiche.

i plugin risiedono nella cartella plugins, al primo livello c'è il vendor, colui che ha realizzato il plugin, 
al momento ce ne sono 3: 
* debian
* eggs
* ufficiozero

# Sintassi per l'uso
Il caso generico è:
```--plugins vendor/plugin```

Ad esempio per utilizzare il branding debian

```sudo eggs -fv --plugins debian/branding``` 

oppure, solo per il branding, esiste la scorciatia --branding e quindi, abbiamo:

```sudo eggs -fv --branding debian``` 


dovrebbe essere anche possibile mischiare plugin di diversi vendor:

```sudo eggs -fv --branding debian --plugins eggs/assistat ufficiozero/remote-assistant```

Installa il branding debian, l'assistant di eggs ed il remote-assistant di ufficiozero.

# Plugins presenti

## eggs

### branding
Contiene il branding di default. Non è necessario specificarlo, se non viene fornito un branding
eggs si mostrerà con "i soliti pinguini...".

### assistant
Permette in aggiunta al flag --plugins eggs/assistant di caricare il pre-installer per la selezione
tra installazione cli o gui. (da rivedere)


## debian
### branding
Fornisce il branding debian da calamares-settings-debian

## ufficiozero

### branding
Permette in aggiunta al flag --branding ufficiozero di configurare l'aspetto di calamares per la propria
remix.

E' costituito da 3 cartelle: 
* applications
* artwork
* branding

in applications va il link per il desktop che avvia calamares. Il nome DEVE essere install-debian.desktop, la icona DEVE
essere install-debian.png che va messa nella directory artwork. Nella directory branding che verrò copiata in /etc/calamares/branding/vendor
andrà messa la configurazione della presentazione.

### remote-support
Permette in aggiunta al flag --plugins ufficiozero/remote-support
Al momento è solo una directory, vorrei utilizzare lo script di Adriano per scaricare ed avviare 
dw-agent per un eventuale aiuto all'utente in fase di installazione. (da fare)








