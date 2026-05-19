#!/usr/bin/env bash

set -e # Fondamentale in CI: ferma lo script al primo errore!
set -x
export BUILD_DIR="/tmp/oa-build"
mkdir -p "$BUILD_DIR"

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo "Project name: $PROJECT_NAME"

cd "$CMD_PATH"
cd ../../
pwd

# 1. Compilazione del binario e generazione asset
# 1. Compilazione del binario e generazione asset
make

# 2. Generazione del pacchetto .deb
./coa/coa tools build

# 3. Installazione chirurgica del .deb
# Cerchiamo sia nella repo che in /tmp/oa-build per sicurezza geopolitica!
DEB_FILE=$(find . /tmp/oa-build -maxdepth 3 -name "oa-tools*.deb" 2>/dev/null | head -n 1)

if [ -z "$DEB_FILE" ]; then
    echo "ERRORE: Il pacchetto .deb non è stato generato in nessun workspace!"
    exit 1
fi

echo "Trovato pacchetto da installare: $DEB_FILE"

# Aggiorniamo i repository di GitHub Runner
sudo apt-get update

# TRUCCO SUPREMO: Passiamo il percorso assoluto tramite realpath. 
# Questo costringe apt a installare il file locale e a tirarsi giù da internet 
# le dipendenze mancanti (squashfs-tools, xorriso, ecc.) senza fare storie!
sudo apt-get install -y "$(realpath "$DEB_FILE")"

echo "=== INSTALLAZIONE COMPLETATA CON SUCCESSO ==="

echo "=== FASE DI REMASTER ==="
sudo coa tools clean
sudo coa remaster
