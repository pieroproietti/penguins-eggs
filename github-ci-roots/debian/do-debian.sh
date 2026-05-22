#!/usr/bin/env bash
set -x

# Setup ambiente
export CMD_PATH=$(cd `dirname $0`; pwd)
cd "$CMD_PATH"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# Pulizia
rm -f "$CMD_PATH"/*.deb
rm -f "$CMD_PATH"/*.iso

echo "=== Build & Package ==="
make
./coa/coa tools build
cp ./*.deb "$CMD_PATH"/

echo "=== Avvio Vagrant ==="
vagrant up --provider=libvirt
sleep 10

echo "=== Installazione dentro la VM ==="
vagrant ssh default -c "sudo apt-get update && sudo apt-get install -y /vagrant/$(basename "$CMD_PATH"/*.deb)"
vagrant ssh default -c "sudo coa remaster"

echo "=== Preparazione estrazione ==="
# Pulizia home della VM e spostamento uovo
vagrant ssh default -c "rm -f ~/*.iso && sudo mv /home/eggs/*.iso ~/deb-egg.iso"

echo "=== Fatto! ==="