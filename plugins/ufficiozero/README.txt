ISTRUZIONI DEI PLUGIN

Plugin è un nome esagerato, forse, ma sto provando a far funzionare eggs con la possibilità per gli
utilizzatori di configurarne l'aspetto grafico o altre caratteristiche.

Al momento ci sono 3 "vendor" 
* debian
* eggs
* ufficiozero

- debian fornisce il brand debian, sostanzialmente quello di calamares-settings-debian immutato.
- eggs fornisce il branging eggs, il default i noti pinguini
- ufficiozero fornisce il proprio branding e remote-support

calamares/branding
Permette in aggiunta al flag --branding brandingVendor di configurare l'aspetto di calamares per la propria
remix.

E' costituito da 3 cartelle: 
* applications
* artwork
* branding

in applications va il link per il desktop che avvia calamares. Il nome DEVE essere install-debian.desktop, la icona DEVE
essere install-debian.png che va messa nella directory artwork. Nella directory branding che verrò copiata in /etc/calamares/branding/vendor
andrà messa la configurazione della presentazione.

* remote-support
Al momento è solo una directory, vorrei utilizzare lo script di Alessandro per scaricare ed avviare 
dw-agent per un eventuale aiuto all'utente in fase di installazione.







