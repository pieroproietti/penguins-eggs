#!/usr/bin/env bash
set -x

# ==========================================
# 1. SETUP VARIABILI
# ==========================================
export CMD_PATH=$(cd `dirname $0`; pwd)
cd "$CMD_PATH"

PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# Pulizia locale dei residui
rm -f "$CMD_PATH"/*.deb
rm -f "$CMD_PATH"/*.iso

echo "=== Compilazione dell'eseguibile ==="
make

echo "=== Creazione pacchetto nativo Debian ==="
./coa/coa tools build
cp ./*.deb "$CMD_PATH"/

# ==========================================
# 2. INSTALLAZIONE DIPENDENZE HOST
# ==========================================
echo "=== Install dependencies ==="
sudo apt-get update
sudo apt-get install -y wget curl gnupg2 software-properties-common virtualbox

# ... (Installazione Vagrant rimane uguale) ...

# ==========================================
# 3. ESECUZIONE NELLA BOLLA (Vagrant)
# ==========================================
echo "=== Avvio Macchina Virtuale ==="
vagrant up
sleep 10

# Pulizia home VM prima di iniziare
vagrant ssh default -c "rm -f ~/*.iso"

echo "=== Installazione e Remastering ==="
vagrant ssh default -c "sudo apt-get update && sudo apt-get install -y /vagrant/$(basename "$CMD_PATH"/*.deb)"
vagrant ssh default -c "oa --help"
vagrant ssh default -c "coa --help"
vagrant ssh default -c "sudo coa remaster"

echo "=== Spostamento uovo nella home VM per estrazione ==="
# Spostiamo il file in un posto sicuro dentro la VM per il cat stream finale
vagrant ssh default -c "sudo mv /home/eggs/*.iso ~/deb-egg.iso"

echo "=== Test completato con successo! ==="
