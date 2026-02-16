#!/bin/bash

# Configurazione percorsi
IMG_EGGS="/var/lib/vz/template/iso/egg-of_bianbu-noble-musebook_riscv64_2026-02-16_0757.img"
IMG_ORIG="/zfs/original/template/iso/bianbu-25.04-desktop-k1-v3.0.1-release-20250815185656.img"

echo "=== ANALISI COMPARATIVA IMMAGINI RISC-V K1 ==="
echo ""

check_img() {
    local label=$1
    local file=$2
    echo "--- [ $label ] ---"
    echo "File: $(basename "$file")"
    
    # 1. Verifica Firma SDC (Settore 0)
    local sig=$(dd if="$file" bs=1 count=3 skip=8 2>/dev/null)
    echo "Signature (Sector 0, offset 8): $sig"
    
    # 2. Verifica GUID Disco e Partizioni
    echo "Disk GUID: $(sudo sgdisk -p "$file" | grep "Disk identifier" | awk '{print $4}')"
    echo "Part 5 GUID: $(sudo sgdisk -i 5 "$file" | grep "Partition unique GUID" | awk '{print $4}')"
    
    # 3. Analisi Contenuto Partizione 5
    echo "Contenuto Partizione 5 (Boot):"
    LOOP=$(sudo losetup -fP --show "$file")
    MNT=$(mktemp -d)
    sudo mount "${LOOP}p5" "$MNT"
    
    if [ -f "$MNT/env_k1-x.txt" ]; then
        echo ">> env_k1-x.txt TROVATO:"
        cat "$MNT/env_k1-x.txt" | sed 's/^/   /'
    else
        echo ">> env_k1-x.txt MANCANTE!"
    fi
    
    echo "File in root di bootfs:"
    ls -F "$MNT" | sed 's/^/ - /'
    
    sudo umount "$MNT"
    sudo losetup -d "$LOOP"
    rmdir "$MNT"
    echo ""
}

if [ ! -f "$IMG_EGGS" ] || [ ! -f "$IMG_ORIG" ]; then
    echo "Errore: Uno dei file immagine non esiste."
    exit 1
fi

check_img "BIANBU ORIGINALE" "$IMG_ORIG"
check_img "PENGUINS EGGS" "$IMG_EGGS"

echo "=== FINE VERIFICA ==="
