#!/usr/bin/env bash
set -x

# 1. SETUP
CMD_PATH=$(cd `dirname $0`; pwd)
PROJECT_ROOT=$(git rev-parse --show-toplevel)
VM_NAME=$(basename "$CMD_PATH") # Sarà 'arch'
cd "$PROJECT_ROOT"

# 2. BUILD
make
./coa/coa tools build
cp ./*.deb "$CMD_PATH"/

# 3. AVVIO E REMASTER
cd "$CMD_PATH"
vagrant destroy -f "$VM_NAME"
vagrant up "$VM_NAME" --provider=libvirt
sleep 10

# Pulizia home VM
vagrant ssh "$VM_NAME" -c "rm -f ~/*.iso"

# Installazione (Ricetta Arch)
vagrant ssh "$VM_NAME" -c "sudo pacman -U --noconfirm /vagrant/*.deb"
vagrant ssh "$VM_NAME" -c "sudo coa remaster"

# 4. PREPARAZIONE ESTRAZIONE
vagrant ssh "$VM_NAME" -c "sudo mv /home/eggs/*.iso ~/egg.iso"
