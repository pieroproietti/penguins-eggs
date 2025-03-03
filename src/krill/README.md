# krill

Sto ristruttuando il codice di krill, cercando di renderlo "quasi" indipendente da eggs.

Allo scopo ho replicato la struttura con:
* classes
* components
* interfaces
* lib

+
Tutto inizia da prepare (krill vero e proprio) , che alla fine chiama sequence che è strettamente integrato con la cartella sequence.d.

Questa classe, non a caso è denominata sequence poiche cerca di replacaer la sequenza di calamares impostata in "/etc/calamares/settings.conf" da cui prende anche nomi e spunto. Essa è tuttavia hard-coded all'interno di sequence.ts ed utilizza i modules che ho spostato qua e che ne fanno parte integrale.

Ho spostato da eggs a krill, dove in effetti sono usati, tutti i components TUI. 

E' stata creata una cartella interfaces, ed una cartella lib per le funzioni, dove sono state spostate tutte quelle utilizzate da krill.

Ho aggiunto un parametro al comando install `--testing`, per permettere un più semplice debug.

In questo modo non serve essere root per avviare krill, si procede alla configurazione ed alla fine il programma semplicemente termina senza installazione.

Questo ci permette di controllare il codice.

Al momento abbiamo il seguente comportamento:

* Standard: OK
* Luks: OK
* Lvm: KO
* Luks+Lvm: KO

Partitions

* Selezionando Standard, chiede filesystem e swap, questo sembra OK
* Luks, dovrebbe funzionare come standard e funziona.
* Lvm, dovrebbe permettere la selezione tra esempi: proxmox/ubuntu e la modifica
* Luks+Lvm da implementare: dovrebbe creare un volume Luks, quindi su esso comportarsi come per Lvm.
