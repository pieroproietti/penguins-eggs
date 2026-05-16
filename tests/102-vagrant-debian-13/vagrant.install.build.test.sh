#!/usr/bin/env bash
set -x

# ==========================================
# 1. SETUP VARIABILI
# ==========================================
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo "Project: $PROJECT_NAME"

# ==========================================
# 2. BUILD DEL PACCHETTO DEBIAN (Host)
# ==========================================
cd "$CMD_PATH"

# Questo comando trova IN MODO INFALLIBILE la cartella radice del progetto 
# (quella dove c'è la cartella .git e il tuo Makefile)
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

echo "=== Root del progetto trovata in: ==="
pwd

echo "=== Compilazione dell'eseguibile ==="
make

echo "=== Creazione pacchetto nativo Debian ==="
# Ora siamo sicuri di essere nella cartella giusta dove esiste ./coa/coa
./coa/coa tools build

# Puliamo vecchi pacchetti nella cartella Vagrant per non confonderci
rm -f "$CMD_PATH"/*.deb

# Copiamo il nuovo pacchetto .deb appena generato nella cartella di Vagrant
cp ./*.deb "$CMD_PATH"/
cd "$CMD_PATH"

# ==========================================
# 3. INSTALLAZIONE DIPENDENZE HOST (VirtualBox & Vagrant)
# ==========================================
echo "=== Install dependencies ==="
sudo apt-get update
sudo apt-get install -y \
    wget \
    curl \
    gnupg2 \
    software-properties-common \
    virtualbox

echo "=== Install Vagrant ==="
VAGRANT_VERSION="2.4.9"
wget -q https://releases.hashicorp.com/vagrant/${VAGRANT_VERSION}/vagrant_${VAGRANT_VERSION}-1_amd64.deb
sudo dpkg -i vagrant_${VAGRANT_VERSION}-1_amd64.deb

echo "=== Verify ==="
vagrant --version
VBoxManage --version

# ==========================================
# 4. PREPARAZIONE AMBIENTE (Disattivazione KVM)
# ==========================================
echo "=== Spegnimento KVM per evitare conflitti con VirtualBox ==="
sudo systemctl stop libvirtd
sudo systemctl stop virtlogd
# Aggiunto || true per evitare che lo script si blocchi se il modulo non è caricato
sudo modprobe -r kvm_amd || true
sudo modprobe -r kvm_intel || true 
sudo modprobe -r kvm || true

# ==========================================
# 5. ESECUZIONE NELLA BOLLA (Vagrant)
# ==========================================
ls -al
echo "=== Avvio Macchina Virtuale ==="
vagrant up
sleep 10

echo "=== Installazione pacchetto dentro Vagrant ==="
# 1. Aggiorniamo i repo della VM
vagrant ssh -c "sudo apt-get update"

# 2. Installiamo il pacchetto .deb usando apt (risolve automaticamente le dipendenze!)
# Usiamo il wildcard *.deb perché Vagrant lo troverà nella cartella condivisa
vagrant ssh -c "sudo apt-get install -y /vagrant/*.deb"

echo "=== Test dei comandi nativi ==="
# 3. Ora testiamo i comandi veri e propri, installati regolarmente nel sistema guest
vagrant ssh -c "oa --help"
vagrant ssh -c "coa --help"
vagrant ssh -c "sudo coa remaster --mode clone"

echo "=== Test completato con successo! ==="