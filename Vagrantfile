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
# Se il tuo Makefile è aggiornato, forziamo l'uso dello schema specchio per sicurezza
make clean BUILD_DIR=/tmp/oa-build || true
make all BUILD_DIR=/tmp/oa-build

# Compiliamo coa nel nuovo schema in RAM prima di fargli fare il build
cd coa
go build -o /tmp/oa-build/coa/coa main.go
cd ..

# 2. Generazione del pacchetto .deb
# Usiamo il binario appena forgiato nella RAM per lanciare la procedura
/tmp/oa-build/coa/coa tools build

# 3. Ricerca chirurgica del pacchetto
# Il nostro codice Go lo sposta nella root del progetto sull'host locale,
# ma se fossimo in un ambiente CI particolare potrebbe rimanere in /tmp/oa-build.
DEB_FILE=$(find . -maxdepth 1 -name "oa-tools*.deb" | head -n 1)

if [ -z "$DEB_FILE" ]; then
    echo "Cerco in /tmp/oa-build come fallback..."
    DEB_FILE=$(find /tmp/oa-build -maxdepth 1 -name "oa-tools*.deb" | head -n 1)
fi

if [ -z "$DEB_FILE" ] || [ ! -f "$DEB_FILE" ]; then
    echo "ERRORE: Il pacchetto .deb non è stato generato!"
    exit 1
fi

# Trasformiamo il percorso in assoluto (Il trucco per non far impazzire apt!)
DEB_ABS_PATH=$(realpath "$DEB_FILE")
echo "=== Trovato pacchetto: $DEB_ABS_PATH ==="

# 4. Installazione
sudo apt-get update
# Ora l'installazione non fallirà MAI, perché apt ha il path assoluto
sudo apt-get install -y "$DEB_ABS_PATH"

echo "=== FASE DI REMASTER ==="
sudo coa tools clean
sudo coa remaster
