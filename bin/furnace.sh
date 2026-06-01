#!/bin/bash

VMID_ARCH=300
VMID_DEBIAN=301

# Percorso assoluto e sicuro sul tuo self-hosted runner
SECRETS_FILE="/etc/p4/secrets.env"

if [ -f "$SECRETS_FILE" ]; then
    echo "🔐 Caricamento segreti locali dal runner..."
    source "$SECRETS_FILE"
else
    echo "❌ Errore: File $SECRETS_FILE non trovato sul runner."
    exit 1
fi

OA_TOOLS_URL="https://github.com/pieroproietti/oa-tools/releases/download/v0.8.2/"

# Funzione universale per attendere SSH
wait_for_ssh() {
    local VM_ID=$1
    local MAC=$(qm config $VM_ID | grep -o -E '([[:xdigit:]]{2}:){5}[[:xdigit:]]{2}' | head -n 1 | tr '[:upper:]' '[:lower:]')
    
    echo "Attendo l'IPv4 dal DHCP (MAC: $MAC)..."
    IP=""
    while [ -z "$IP" ]; do
        ping -c 1 -b 255.255.255.255 > /dev/null 2>&1
        IP=$(ip -4 neigh show | grep -i "$MAC" | awk '{print $1}' | head -n 1)
        if [ -z "$IP" ]; then sleep 2; echo -n "."; fi
    done
    echo -e "\n✅ IPv4 assegnato: $IP"

    echo "Attendo il demone SSH su $IP..."
    while ! sshpass -p "$SSH_PASSWD" ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -q $SSH_USER@$IP exit; do
        sleep 2; echo -n "s"
    done
    echo -e "\n✅ Connessione SSH stabilita con successo!"
}

# Funzione per eseguire comandi
run_on_vm() {
    sshpass -p "$SSH_PASSWD" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T $SSH_USER@$IP "$1"
}

# ==========================================
# FASE 1: ARCH LINUX
# ==========================================
echo "=== Ripristino snapshot Arch Linux (VM $VMID_ARCH) ==="
qm rollback $VMID_ARCH virgin
qm start $VMID_ARCH
wait_for_ssh $VMID_ARCH

echo "⚙️  Esecuzione comandi su Arch..."
run_on_vm "
    # Installiamo wget e unzip subito
    echo \"$SSH_PASSWD\" | sudo -S pacman -Sy --noconfirm wget unzip
    
    wget -O oa-tools-arch.zip $OA_TOOLS_URL/oa-tools-arch.zip
    unzip -o oa-tools-arch.zip
    
    echo \"$SSH_PASSWD\" | sudo -S pacman -U --noconfirm *.pkg.tar.zst
    
    echo \"$SSH_PASSWD\" | sudo -S coa remaster
    eggs export iso --clean
"

echo "🛑 Spegnimento Arch..."
qm shutdown $VMID_ARCH
qm wait $VMID_ARCH
echo "-----------------------------------"


# ==========================================
# FASE 2: DEBIAN
# ==========================================
echo "=== Ripristino snapshot Debian (VM $VMID_DEBIAN) ==="
qm rollback $VMID_DEBIAN virgin
qm start $VMID_DEBIAN
wait_for_ssh $VMID_DEBIAN

echo "⚙️  Esecuzione comandi su Debian..."
run_on_vm "
    echo \"$SSH_PASSWD\" | sudo -S apt update
    echo \"$SSH_PASSWD\" | sudo -S apt install -y wget unzip
    
    wget -O oa-tools-debian.zip $OA_TOOLS_URL/oa-tools-debian.zip
    unzip -o oa-tools-debian.zip
    
    echo \"$SSH_PASSWD\" | sudo -S apt install -y ./*.deb
    
    echo \"$SSH_PASSWD\" | sudo -S coa remaster
    eggs export iso --clean
"

echo "🛑 Spegnimento Debian..."
qm shutdown $VMID_DEBIAN
qm wait $VMID_DEBIAN

echo "========================================="
echo "🔥 Fornace terminata! Le nuove ISO sono pronte."
echo "========================================="
