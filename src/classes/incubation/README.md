# Incubation

Questo processo crea la configurazione dell'installer krill/calamares.

Tutto si basa sul metodo config di Incubator, che decide in base al valore di `codenameLikeId` 
quale configurazione è necessaria.

Viene quindi chiamato il metodo `create` della distribuzione in uso che configura `settings.conf` ed 
i vari moduli di calamares.

Probabilmente il modulo potrebbe essere perfezionato, esaminando `settings.conf` ed andando a
creare i moduli rilevati.

Questo renderebbe tutto molto più generico.



