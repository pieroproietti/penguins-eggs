#!/bin/sh
# Live-boot hook: 9999-decrypt-root
# Sblocca root.img PRIMA che live-boot cerchi filesystem.squashfs
# Questo script viene messo in /lib/live/boot/9999-decrypt-root

Decrypt_root ()
{
    # Configurazione
    LIVE_MEDIA="/run/live/medium"
    ROOT_IMG="${LIVE_MEDIA}/live/root.img"
    LUKS_NAME="live-root"
    TEMP_ROOT="/tmp/decrypted-root"
    
    # Verifica se root.img esiste
    if [ ! -f "${ROOT_IMG}" ]; then
        # Non c'è cifratura, continua normalmente
        return 0
    fi
    
    # Verifica se è LUKS
    if ! /sbin/cryptsetup isLuks "${ROOT_IMG}"; then
        log_warning_msg "root.img found but not a LUKS volume"
        return 0
    fi
    
    log_begin_msg "Found encrypted root.img"
    
    # Mostra prompt
    cat << 'EOF'

╔════════════════════════════════════════╗
║   Encrypted Live System Detected       ║
╚════════════════════════════════════════╝

Please enter your passphrase to unlock the system
(You have 3 attempts)

EOF

    # Copia in RAM (media è read-only)
    log_begin_msg "Copying root.img to RAM..."
    TEMP_IMG="/tmp/root.img"
    cp "${ROOT_IMG}" "${TEMP_IMG}"
    log_end_msg
    
    # Tentativi di sblocco
    MAX_ATTEMPTS=3
    ATTEMPT=1
    UNLOCKED=0
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ] && [ $UNLOCKED -eq 0 ]; do
        echo "Attempt $ATTEMPT of $MAX_ATTEMPTS:"
        
        # Chiudi se già aperto
        [ -e "/dev/mapper/${LUKS_NAME}" ] && /sbin/cryptsetup close "${LUKS_NAME}" 2>/dev/null
        
        if /sbin/cryptsetup open "${TEMP_IMG}" "${LUKS_NAME}"; then
            UNLOCKED=1
            log_success_msg "LUKS volume unlocked"
        else
            [ $ATTEMPT -lt $MAX_ATTEMPTS ] && echo "Incorrect passphrase. Try again."
            ATTEMPT=$((ATTEMPT + 1))
        fi
    done
    
    if [ $UNLOCKED -eq 0 ]; then
        log_failure_msg "Failed to unlock. Continuing without encryption."
        rm -f "${TEMP_IMG}"
        return 0
    fi
    
    # Monta il volume decifrato
    log_begin_msg "Mounting decrypted volume"
    mkdir -p "${TEMP_ROOT}"
    if ! mount -o ro "/dev/mapper/${LUKS_NAME}" "${TEMP_ROOT}"; then
        log_failure_msg "Failed to mount"
        /sbin/cryptsetup close "${LUKS_NAME}"
        rm -f "${TEMP_IMG}"
        return 1
    fi
    log_end_msg
    
    # Verifica filesystem.squashfs
    if [ ! -f "${TEMP_ROOT}/filesystem.squashfs" ]; then
        log_failure_msg "filesystem.squashfs not found in decrypted volume"
        umount "${TEMP_ROOT}"
        /sbin/cryptsetup close "${LUKS_NAME}"
        rm -f "${TEMP_IMG}"
        return 1
    fi
    
    # CRUCIALE: Copia filesystem.squashfs dove live-boot lo cerca
    log_begin_msg "Preparing filesystem for live-boot"
    cp "${TEMP_ROOT}/filesystem.squashfs" "${LIVE_MEDIA}/live/filesystem.squashfs"
    log_end_msg
    
    # Cleanup
    umount "${TEMP_ROOT}"
    # Lascia il device mapper aperto - potrebbe servire
    
    log_success_msg "Encrypted root prepared successfully"
    
    return 0
}