#!/usr/bin/env bash
set -x

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo "Project: $PROJECT_NAME"

cd "$CMD_PATH"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

echo "=== Compilazione degli eseguibili ==="
make

# Pulizia vecchi file Vagrant
rm -f "$CMD_PATH"/coa_bin "$CMD_PATH"/oa_bin
rm -rf "$CMD_PATH"/brain_profiles

# Copia dei binari
cp ./coa/coa "$CMD_PATH"/coa_bin
cp ./oa/oa "$CMD_PATH"/oa_bin

# CRITICO: Copia del cervello! 
# (Sostituisci "./conf" se la tua cartella dei profili si chiama in un altro modo, ad es. "./brain" o "./assets")
cp -r ./conf "$CMD_PATH"/brain_profiles

cd "$CMD_PATH"

echo "=== Install dependencies (KVM/libvirt) ==="
sudo apt-get update
sudo apt-get install -y wget curl gnupg2 software-properties-common qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

echo "=== Install Vagrant & libvirt plugin ==="
VAGRANT_VERSION="2.4.9"
wget -q https://releases.hashicorp.com/vagrant/${VAGRANT_VERSION}/vagrant_${VAGRANT_VERSION}-1_amd64.deb
sudo dpkg -i vagrant_${VAGRANT_VERSION}-1_amd64.deb
vagrant plugin install vagrant-libvirt

echo "=== Verify ==="
vagrant --version
sudo systemctl start libvirtd

echo "=== Avvio Macchina Virtuale (KVM) ==="
vagrant up --provider=libvirt
sleep 10

echo "=== Simulazione Installazione su Arch/Manjaro ==="
# Spostiamo i binari
vagrant ssh -c "sudo cp /vagrant/coa_bin /usr/bin/coa"
vagrant ssh -c "sudo cp /vagrant/oa_bin /usr/bin/oa"
vagrant ssh -c "sudo chmod +x /usr/bin/coa /usr/bin/oa"

# Spostiamo il Cervello
vagrant ssh -c "sudo mkdir -p /etc/oa-tools.d/"
vagrant ssh -c "sudo cp -r /vagrant/brain_profiles/* /etc/oa-tools.d/"

echo "=== Test dei comandi nativi ==="
vagrant ssh -c "oa --help"
vagrant ssh -c "coa --help"
vagrant ssh -c "sudo coa remaster"
