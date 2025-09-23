# Incubation

Questo processo crea la configurazione dell'installer krill/calamares.

Tutto si basa sul metodo config di Incubator, che decide in base al valore di `codenameLikeId` 
quale configurazione è necessaria.

Viene quindi chiamato il metodo `create` della distribuzione in uso che configura `settings.conf` ed 
i vari moduli di calamares.

Probabilmente il modulo potrebbe essere perfezionato, esaminando `settings.conf` ed andando a
creare i moduli rilevati.

Questo renderebbe tutto molto più generico.

# v25.9.23
* Alpine settings aggiornato
* Debian buster settings aggiornato
* Fedora settings aggiornato
* Ubuntu noble settings aggiornato
* Openmamba settings aggiornato
* Opensuse settings aggiornato
* Arch rolling settings aggiornato
* Ubuntu bionic è stato rimosso


Ho aggiornato fisherman.ts solo per settings.yml, ma occorre farlo anche per:
* dracut.yml
* mount.yml
* packages.yml
* removeuser.yml
* unpackfs.yml
