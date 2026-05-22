#!/usr/bin/env bash
set -x

# ==========================================
# 1. SETUP VARIABILI
# ==========================================
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo "Project: $PROJECT_NAME"

# ==========================================
# 2. BUILD DEGLI ESEGUIBILI (Host)
# ==========================================
cd "$CMD_PATH"

# Troviamo la radice del progetto
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

echo "=== Root del progetto trovata in: ==="
pwd

echo "=== Compilazione degli eseguibili in Go/C ==="
make

# Puliamo la cartella Vagrant da vecchi file
rm -f "$CMD_PATH"/coa_bin "$CMD_PATH"/oa_bin
rm -rf "$CMD_PATH"/brain_profiles

# Copiamo i binari appena compilati nella cartella condivisa di Vagrant
cp ./coa/coa "$CMD_PATH"/coa_bin
cp ./oa/oa "$CMD_PATH"/oa_bin

# CRITICO: Copiamo la cartella con le configurazioni YAML (Il Cervello!)
# ATTENZIONE PIERO: Sostituisci "conf" con il nome VERO della cartella della tua repo che contiene i profili!
cp -r ./conf "$CMD_PATH"/brain_profiles

cd "$CMD_PATH"

# ==========================================
# 3. INSTALLAZIONE DIPENDENZE HOST (KVM/libvirt)
# ==========================================
echo "=== Install dependencies (GitHub Runner = Ubuntu) ==="
sudo apt-get update
sudo apt-get install -y \
    wget \
    curl \
    gnupg2 \
    software-properties-common \
    qemu-kvm \
    libvirt-daemon-system \
    libvirt-clients \
    bridge-utils

echo "=== Install Vagrant & libvirt plugin ==="
VAGRANT_VERSION="2.4.9"
wget -q https://releases.hashicorp.com/vagrant/${VAGRANT_VERSION}/vagrant_${VAGRANT_VERSION}-1_amd64.deb
sudo dpkg -i vagrant_${VAGRANT_VERSION}-1_amd64.deb

vagrant plugin install vagrant-libvirt

echo "=== Verify ==="
vagrant --version
sudo systemctl start libvirtd

# ==========================================
# 4. ESECUZIONE NELLA BOLLA (Vagrant)
# ==========================================
ls -al
echo "=== Avvio Macchina Virtuale (Arch Linux via KVM) ==="
vagrant up --provider=libvirt
sleep 10

echo "=== Simulazione Installazione su Arch Linux ==="
# 1. Spostiamo i binari nelle cartelle di sistema e li rendiamo eseguibili
vagrant ssh -c "sudo cp /vagrant/coa_bin /usr/bin/coa"
vagrant ssh -c "sudo cp /vagrant/oa_bin /usr/bin/oa"
vagrant ssh -c "sudo chmod +x /usr/bin/coa /usr/bin/oa"

# 2. Ricostruiamo il "Cervello": spostiamo le configurazioni al posto giusto
# (Se oa-tools si aspetta le configurazioni da qualche altra parte, cambia /etc/oa-tools.d/)
vagrant ssh -c "sudo mkdir -p /etc/oa-tools.d/"
vagrant ssh -c "sudo cp -r /vagrant/brain_profiles/* /etc/oa-tools.d/"

echo "=== Test dei comandi nativi ==="
# 3. Ora testiamo i comandi (che troveranno sia il binario che le configurazioni)
vagrant ssh -c "oa --help"
vagrant ssh -c "coa --help"
vagrant ssh -c "sudo coa remaster"

echo "=== Test completato con successo! ==="