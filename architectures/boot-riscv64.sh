#!/bin/bash

ISO_FILE="$1"

# 1. Configurazione base (CPU, RAM, Firmware, Rete)
# Nota: Non mettiamo ancora i dischi qui!
CMD=(
    qemu-system-riscv64
    -machine virt
    -cpu rv64
    -m 4G
    -smp 2
    -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on
    -drive if=pflash,format=raw,unit=1,file=./debian-efi-vars.fd
    -device virtio-net-device,netdev=net0
    -netdev user,id=net0
    -nographic
)

# 2. Gestione Dischi
if [ -n "$ISO_FILE" ]; then
    echo ">> MODALITÀ INSTALLAZIONE: Inserisco PRIMA il CD-ROM"
    
    # Aggiungiamo il CD-ROM per primo (così diventa il boot device primario)
    # Aggiungo bootindex=1 per sicurezza extra
    CMD+=(
        -device virtio-blk-device,drive=cd0,bootindex=1
        -drive file="$ISO_FILE",format=raw,id=cd0,media=cdrom,readonly=on,if=none
    )
    
    # Poi aggiungiamo il disco fisso (secondario)
    CMD+=(
        -device virtio-blk-device,drive=hd0,bootindex=2
        -drive file=debian-riscv.img,format=qcow2,id=hd0,if=none
    )
else
    echo ">> MODALITÀ SISTEMA: Solo disco fisso"
    
    # Solo disco fisso
    CMD+=(
        -device virtio-blk-device,drive=hd0
        -drive file=debian-riscv.img,format=qcow2,id=hd0,if=none
    )
fi

# 3. Esecuzione
"${CMD[@]}"