#!/bin/sh

# Il paracadute fondamentale per la CI: 
# se 'make' fallisce, lo script si interrompe e restituisce errore.
# Senza questo, se make fallisce, lo script potrebbe restituire '0' (successo) 
# e GitHub ti darebbe una spunta verde falsa!
set -e

# Se in futuro vorrai passare parametri extra (es. ./build.sh --debug)
make clean package "$@"
sudo dpkg -i oa-tools_*.deb

