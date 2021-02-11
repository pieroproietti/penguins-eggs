#!/bin/bash

################################################
# pre-remove script
################################################

# Questo rm consente la rimozione pulita di eggs,
# difatti apt non cancellerebbe i link create da node 
# nella directory distros
rm /usr/lib/penguins-eggs/conf/distros -rf

# Rimuoviamo il manuale di eggs, copiato da eggs prerequisites
if [ -f "/usr/local/man/man1/eggs.1" ]; then
    rm /usr/local/man/man1/eggs.1
    # ed aggiorniamo mandb
    mandb >/dev/null
fi

# Rimuoviamo eggs.bash per l'autocomplete
if [ -f "/etc/bash_completion.d/eggs.bash" ]; then
    rm /etc/bash_completion.d/eggs.bash
fi

exit 0