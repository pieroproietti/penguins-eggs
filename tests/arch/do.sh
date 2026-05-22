#!/usr/bin/env bash
set -x

export CMD_PATH=$(cd `dirname $0`; pwd)
cd "$CMD_PATH"

# Pulizia di vecchie ISO rimaste nella cartella locale
rm -f ./*.iso

echo "=== Install dependencies (Ubuntu Host) ==="
sudo apt-get update
# Abbiamo aggiunto libvirt-dev, ruby-dev e build-essential per non far schiantare il plugin!
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

echo "=== Fix permessi directory per KVM/9p ==="
# Diamo il permesso di attraversamento (execute) e lettura a tutti sulle cartelle padre
sudo chmod a+rx /home/runner
sudo chmod -R a+rX /home/runner/work

echo "=== Avvio Macchina Virtuale Arch ==="
vagrant up --provider=libvirt

echo "=== Avvio Macchina Virtuale Arch ==="
vagrant up --provider=libvirt
sleep 10

echo "=== Compilazione nativa dentro Arch Linux ==="
# Facciamo compilare a lei il codice in C e Go
vagrant ssh -c "cd /vagrant && make"

echo "=== Installazione Binari e Cervello ==="
vagrant ssh -c "sudo cp /vagrant/coa/coa /usr/bin/coa"
vagrant ssh -c "sudo cp /vagrant/oa/oa /usr/bin/oa"
vagrant ssh -c "sudo chmod +x /usr/bin/coa /usr/bin/oa"

vagrant ssh -c "sudo mkdir -p /etc/oa-tools.d/"
# (Sostituisci /vagrant/conf se la tua cartella profili ha un nome diverso!)
vagrant ssh -c "sudo cp -r /vagrant/conf/* /etc/oa-tools.d/"

echo "=== Test Finale e Remastering ==="
vagrant ssh -c "oa --help"
vagrant ssh -c "coa --help"
vagrant ssh -c "sudo coa remaster"

echo "=== Estrazione dell'uovo ==="
# Portiamo fuori la ISO per GitHub Artifacts
vagrant ssh -c "sudo cp /home/eggs/*.iso /vagrant/tests/arch/"

echo "=== VITTORIA SU ARCH! ==="
