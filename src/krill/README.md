# krill

Sto ristruttuando il codice di krill, cercando di renderlo "quasi" indipendente da eggs.

Allo scopo ho replicato la struttura con:
* classes
* components
* lib
* modules

+
Tutto inizia da prepare, che alla fine chiama sequence che è strettamente integrato con la cartella modules.

Questa classe, non a caso è denominata sequence poiche cerca di replacaer la sequenza di calamares impostata in "/etc/calamares/settings.conf" da cui prende anche nomi e spunto. Essa è tuttavia hard-coded all'interno di sequence.ts ed utilizza i modules che ho spostato qua e che ne fanno parte integrale.

Ho spostato da eggs a krill, dove in effetti sono usati, tutti i componenti TUI. 

E' stata creata una cartella interfaces, ed una cartella lib per le funzioni, dove sono state spostate tutte quelle utilizzate da krill.

Ho aggiunto un parametro al comando install `--testing`, per permettere un più semplice debug.

In questo modo non serve essere root per avviare krill, si procede alla configurazione ed alla fine il programma semplicemente termina senza installazione.

Questo ci permette di controllare il codice.

Al momento abbiamo il seguente comportamento:

* Standard: OK
* Luks: OK
* Lvm: ko
* Luks+Lvm: to do

Partitions

* Esce sempre una select /dev e non capisco da dove provenga

* Selezionando Standard, chiede filesystem e swap, questo sembra OK
* Lvm, dovrebbe permettere la selezione tra: custom, proxmox o ubuntu
* Luks, dovrebbe funzionare come standard e funziona.
* Luks+Lvm da implementare: dovrebbe creare un volume Luks, quindi su esso comportarsi come per Lvm.

OK, sono passato al branch `devel`.
















