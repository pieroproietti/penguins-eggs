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

echo "=== Avvio Macchina Virtuale Arch ==="
vagrant up --provider=libvirt
sleep 10

echo "=== Compilazione nativa (Metodo Copia Locale in Home) ==="
# 1. Isoliamo la build copiando i sorgenti nella home della VM (Niente conflitti con 9p!)
vagrant ssh -c "mkdir -p ~/build_oa && cp -r /vagrant/* ~/build_oa/"
# 2. Compiliamo sul disco nativo di Arch in totale sicurezza
vagrant ssh -c "cd ~/build_oa && make"

echo "=== Installazione Binari e Cervello ==="
# 3. Peschiamo i binari finiti dalla cartella temporanea
vagrant ssh -c "sudo cp ~/build_oa/coa/coa /usr/bin/coa"
vagrant ssh -c "sudo cp ~/build_oa/oa/oa /usr/bin/oa"
vagrant ssh -c "sudo chmod +x /usr/bin/coa /usr/bin/oa"

vagrant ssh -c "sudo mkdir -p /etc/oa-tools.d/"
# (Ricorda: se la tua cartella si chiama 'brain_profiles', cambia 'conf' qui sotto!)
vagrant ssh -c "sudo cp -r ~/build_oa/conf/* /etc/oa-tools.d/"

echo "=== Test Finale e Remastering ==="
vagrant ssh -c "oa --help"
vagrant ssh -c "coa --help"
vagrant ssh -c "sudo coa remaster"

echo "=== Estrazione dell'uovo ==="
# Portiamo fuori la ISO per GitHub Artifacts
vagrant ssh -c "sudo cp /home/eggs/*.iso /vagrant/tests/arch/"

echo "=== VITTORIA SU ARCH! ==="
