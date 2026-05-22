#!/usr/bin/env bash
set -x

export CMD_PATH=$(cd `dirname $0`; pwd)
cd "$CMD_PATH"

# Pulizia di vecchie ISO rimaste nella cartella locale
rm -f ./*.iso

echo "=== Install dependencies (Ubuntu Host) ==="
sudo apt-get update
# Dipendenze KVM e pacchetti di sviluppo per far compilare il plugin a Vagrant
sudo apt-get install -y wget curl gnupg2 software-properties-common qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils libvirt-dev ruby-dev build-essential

echo "=== Install Vagrant & libvirt plugin ==="
VAGRANT_VERSION="2.4.9"
wget -q https://releases.hashicorp.com/vagrant/${VAGRANT_VERSION}/vagrant_${VAGRANT_VERSION}-1_amd64.deb
sudo dpkg -i vagrant_${VAGRANT_VERSION}-1_amd64.deb
vagrant plugin install vagrant-libvirt

sudo systemctl start libvirtd

echo "=== Fix Permessi Libvirt per GitHub Actions ==="
sudo usermod -a -G libvirt $(whoami)
sudo usermod -a -G kvm $(whoami)
# Scardiniamo i permessi del socket visto che siamo su una macchina usa-e-getta
sudo chmod 666 /var/run/libvirt/libvirt-sock

echo "=== Fix Permessi Libvirt per GitHub Actions ==="
sudo usermod -a -G libvirt $(whoami)
sudo usermod -a -G kvm $(whoami)
sudo chmod 666 /var/run/libvirt/libvirt-sock

echo "=== Fix permessi directory per KVM/9p ==="
sudo chmod a+rx /home/runner
sudo chmod -R a+rx /home/runner/work

echo "=== Avvio Macchina Virtuale Arch ==="
vagrant up --provider=libvirt
sleep 10

echo "=== Compilazione nativa (Metodo Copia Locale in Home) ==="
# 1. Isoliamo la build copiando i sorgenti nella home della VM
vagrant ssh -c "mkdir -p ~/build_oa && cp -r /vagrant/* ~/build_oa/"

echo "=== Fix brutale del DNS di Arch per Go ==="
# Pialliamo il DNS IPv6 rotto e forziamo IPv4 (Google DNS)
vagrant ssh -c "sudo rm -f /etc/resolv.conf && echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf"

# 2. Compiliamo sul disco nativo di Arch in totale sicurezza
vagrant ssh -c "cd ~/build_oa && make"

echo "=== Installazione Binari e Cervello ==="
vagrant ssh -c "sudo cp ~/build_oa/coa/coa /usr/bin/coa"
vagrant ssh -c "sudo cp ~/build_oa/oa/oa /usr/bin/oa"
vagrant ssh -c "sudo chmod +x /usr/bin/coa /usr/bin/oa"

# Ricreiamo l'ambiente di PRODUZIONE perfetto:
vagrant ssh -c "sudo mkdir -p /etc/oa-tools.d/"
# Copiamo la cartella esatta del tuo repo nel percorso di sistema
vagrant ssh -c "sudo cp -r ~/build_oa/coa/brain.d /etc/oa-tools.d/"

echo "=== Test Finale e Remastering ==="
vagrant ssh -c "oa --help"
vagrant ssh -c "coa --help"

# Diciamo al kernel di Arch di prepararsi a usare OverlayFS!
# vagrant ssh -c "sudo modprobe overlay"

echo "=== Remaster! ==="
vagrant ssh -c "sudo coa remaster"

echo "=== Estrazione dell'uovo ==="
# Portiamo fuori la ISO per GitHub Artifacts
vagrant ssh -c "sudo cp /home/eggs/*.iso /vagrant/_tests/arch/"

echo "=== VITTORIA SU ARCH! ==="
