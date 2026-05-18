#!/usr/bin/env bash

set -e # Fondamentale in CI: ferma lo script al primo errore!
set -x

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo "Project name: $PROJECT_NAME"

cd "$CMD_PATH"
cd ../../
pwd

# 1. Compilazione del binario e generazione asset
make

# 2. Generazione del pacchetto .deb
./coa/coa tools build

# 3. Installazione chirurgica del .deb
# Usiamo find per beccarlo ovunque sia nato (nella root, in oa/ o in coa/) 
# ed evitiamo che gli apici o l'asterisco facciano impazzire dpkg
DEB_FILE=$(find . -maxdepth 3 -name "oa-tools*.deb" | head -n 1)

if [ -z "$DEB_FILE" ]; then
    echo "ERRORE: Il pacchetto .deb non è stato generato!"
    exit 1
fi

# Secondo me, questa riga una volta funzione ed uno no
sudo apt-get update
sudo apt-get install -y "$DEB_FILE"

#sudo dpkg -i "$DEB_FILE" || sudo apt-get install -f -y
#echo "=== INSTALLAZIONE COMPLETATA CON SUCCESSO ==="

echo "=== FASE DI REMASTER ==="
sudo coa tools clean
sudo coa remaster