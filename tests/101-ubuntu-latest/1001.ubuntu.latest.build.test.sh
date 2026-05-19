#!/usr/bin/env bash

set -e # Fondamentale in CI: ferma lo script al primo errore!
set -x

# 1. Mappa geopolitica delle fucine
export BUILD_DIR="/tmp/oa-build"
mkdir -p "$BUILD_DIR"

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo "Project name: $PROJECT_NAME"

cd "$CMD_PATH"
cd ../../
pwd

# 2. Compilazione del binario e generazione asset (Genera in /tmp/oa-build)
make

# 3. Generazione del pacchetto .deb usando il binario appena nato in RAM
$BUILD_DIR/coa/coa tools build

# 4. Installazione chirurgica del .deb
# Cerchiamo sia nella repo che in /tmp/oa-build per sicurezza geopolitica
DEB_FILE=$(find . /tmp/oa-build -maxdepth 3 -name "oa-tools*.deb" 2>/dev/null | head -n 1)

if [ -z "$DEB_FILE" ]; then
    echo "ERRORE: Il pacchetto .deb non è stato generato!"
    exit 1
fi

echo "Pacchetto individuato: $DEB_FILE"

# Aggiorniamo i repo del Runner
sudo apt-get update

# TRUCCO SUPREMO: realpath costringe apt a capire che si tratta di un file locale.
# Si tira giù le dipendenze da internet e installa il pacchetto senza fare storie.
sudo apt-get install -y "$(realpath "$DEB_FILE")"

echo "=== INSTALLAZIONE COMPLETATA CON SUCCESSO ==="

# 5. Fase di Remaster (Chiamando sempre il binario definitivo per evitare conflitti)
echo "=== FASE DI REMASTER ==="
sudo coa tools clean
sudo coa remaster
