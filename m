#!/bin/bash

# 1. Esportiamo la variabile in modo che anche il binario 'coa' la erediti 
#    quando lancerà le sue compilazioni interne
export BUILD_DIR="/tmp/oa-build"

# 2. Esegui la pulizia e la build forzando la variabile direttamente per sicurezza
make clean BUILD_DIR="$BUILD_DIR"
make all BUILD_DIR="$BUILD_DIR"

# 3. Lancia il coa builder usando il percorso assoluto corretto
$BUILD_DIR/coa/coa tools build
