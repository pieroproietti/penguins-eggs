#ifndef ETERNIT_H
#define ETERNIT_H

#include "cJSON.h" // Necessario perché la funzione accetta un parametro cJSON

/* * run_eternit_umount
 * * Esegue lo smontaggio dinamico e bottom-up di tutte le partizioni 
 * e i file system virtuali ancorati alla work_dir specificata nel task.
 * Legge dinamicamente lo stato da /proc/mounts.
 * * Restituisce: 0 in caso di successo, 1 in caso di errore.
 */
int run_eternit_umount(cJSON *task);

#endif // ETERNIT_H
