#!/usr/bin/env bash
set -x

# ==========================================
# 1. SETUP VARIABILI
# ==========================================
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo "Project: $PROJECT_NAME"

# ==========================================
# 2. BUILD ESEGUIBILI (Host)
# ==========================================
# Usiamo il trucco infallibile di git per trovare la root del progetto
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

echo "=== Root del progetto trovata in: ==="
pwd

echo "=== Compilazione eseguibili ==="
make

# Copiamo gli eseguibili compilati nella cartella condivisa di Vagrant
cp ./coa/coa "$CMD_PATH"/
cp ./oa/oa "$CMD_PATH"/
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
sudo modprobe -r kvm_amd || true
sudo modprobe -r kvm_intel || true 
sudo modprobe -r kvm || true

# ==========================================
# 5. ESECUZIONE NELLA BOLLA ARCH (Vagrant)
# ==========================================
ls -al
echo "=== Avvio Macchina Virtuale Arch ==="
vagrant up
sleep 10

echo "=== Creazione e Installazione Pacchetto Arch ==="
# 1. Aggiorniamo i keyring di Arch (vitale nelle VM Vagrant che spesso hanno chiavi vecchie)
vagrant ssh -c "sudo pacman -Sy --noconfirm archlinux-keyring"
# Installiamo base-devel che serve per makepkg
vagrant ssh -c "sudo pacman -Su --noconfirm base-devel"

# 2. Creiamo una cartella di build nella home dell'utente vagrant per evitare conflitti con i permessi di /vagrant
vagrant ssh -c "mkdir -p ~/build-oa && cp /vagrant/coa ~/build-oa/ && cp /vagrant/oa ~/build-oa/"

# 3. Generiamo il PKGBUILD (NOTA: se il comando esatto è 'coa tools build', modificalo qui)
vagrant ssh -c "cd ~/build-oa && ./coa build"

# 4. Compiliamo il pacchetto Arch (-s risolve e installa le dipendenze in automatico)
# makepkg viene eseguito come utente 'vagrant', rispettando le regole di Arch
vagrant ssh -c "cd ~/build-oa && makepkg -s --noconfirm"

# 5. Installiamo il pacchetto generato (*.pkg.tar.zst)
vagrant ssh -c "cd ~/build-oa && sudo pacman -U --noconfirm *.pkg.tar.zst"

echo "=== Test dei comandi nativi ==="
# Ora testiamo i comandi veri e propri, installati regolarmente in /usr/bin dal pacchetto pacman
vagrant ssh -c "oa --help"
vagrant ssh -c "coa --help"
vagrant ssh -c "sudo coa remaster --mode clone"

echo "=== Test completato con successo! Buon pranzo! ==="
