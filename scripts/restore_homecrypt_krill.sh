#!/bin/bash

# ==============================================================================
# SCRIPT DI RIPRISTINO DATI UTENTE CRITTOGRAFATI (--HOMECRYPT) PER KRILL
# LIVE_HOME_DEVICE $1   device LUKS già sbloccato
# TARGET_ROOT $2        root di destinazione
# ==============================================================================

# --- Variabili di Configurazione ---
LIVE_HOME_DEVICE="$1"
TARGET_ROOT="$2"

RESTORE_MNTPOINT="/tmp/live_home_restore"
TARGET_HOME_MNTPOINT="${TARGET_ROOT}/home"
BACKUP_DIR="${RESTORE_MNTPOINT}/.system-backup"

#echo "==========================================================="
#echo " Inizio verifica e ripristino dati utente (--homecrypt)"
#echo "==========================================================="

# 1. Verifica Condizione Cruciale: Il volume LUKS è sbloccato?
if [ ! -b "${LIVE_HOME_DEVICE}" ]; then
    #echo "Dispositivo ${LIVE_HOME_DEVICE} non trovato. L'opzione --homecrypt non e' stata utilizzata o e' fallita all'avvio."
    #echo "Nessun ripristino di /home."
    exit 0
fi

#echo "Volume home.img decrittato rilevato su ${LIVE_HOME_DEVICE}."

# 2. Montaggio del Volume Decrittato (solo lettura)
mkdir -p "${RESTORE_MNTPOINT}"
if ! mount -o ro "${LIVE_HOME_DEVICE}" "${RESTORE_MNTPOINT}"; then
    #echo "ERRORE: Impossibile montare ${LIVE_HOME_DEVICE}. Interruzione ripristino."
    exit 1
fi

# 3. Copia Ricorsiva dei Dati Utente
#echo "Copia dei dati utente da live-home a ${TARGET_HOME_MNTPOINT}..."
# rsync -aH: -a (Archivio: ricorsivo, permessi, orari, ecc.), -H (Hard links)
rsync -aH "${RESTORE_MNTPOINT}/" "${TARGET_HOME_MNTPOINT}/"

# 4. Ripristino dei File di Sistema (`.system-backup`)
if [ -d "${BACKUP_DIR}" ]; then
    #echo "Ripristino account utente e configurazioni Display Manager..."

    # 4.1. Ripristino /etc/passwd e /etc/shadow
    # Aggiunge utenti con UID >= 1000, evitando duplicati
    cat ${BACKUP_DIR}/passwd | while IFS=: read -r username password uid gid gecos home shell; do
        if ! grep -q "^${username}:" ${TARGET_ROOT}/etc/passwd; then
            #echo "   - Aggiungo utente: ${username}"
            #echo "${username}:${password}:${uid}:${gid}:${gecos}:${home}:${shell}" >> ${TARGET_ROOT}/etc/passwd
            # Recupera la linea shadow corrispondente
            grep "^${username}:" ${BACKUP_DIR}/shadow >> ${TARGET_ROOT}/etc/shadow
        fi
    done

    # 4.2. Ripristino Group/Gshadow (sovrascrittura)
    #echo "   - Ripristino file /etc/group e /etc/gshadow."
    cp ${BACKUP_DIR}/group ${TARGET_ROOT}/etc/group
    cp ${BACKUP_DIR}/gshadow ${TARGET_ROOT}/etc/gshadow

    # 4.3. Ripristino Configurazioni Display Manager
    #echo "   - Ripristino configurazioni Display Manager (Autologin, ecc.)."
    [ -d ${BACKUP_DIR}/gdm3 ] && rsync -ah ${BACKUP_DIR}/gdm3 ${TARGET_ROOT}/etc/
    [ -d ${BACKUP_DIR}/gdm ] && rsync -ah ${BACKUP_DIR}/gdm ${TARGET_ROOT}/etc/
    [ -d ${BACKUP_DIR}/lightdm ] && rsync -ah ${BACKUP_DIR}/lightdm ${TARGET_ROOT}/etc/
    [ -e ${BACKUP_DIR}/sddm.conf ] && cp -a ${BACKUP_DIR}/sddm.conf ${TARGET_ROOT}/etc/
    [ -d ${BACKUP_DIR}/sddm.conf.d ] && rsync -ah ${BACKUP_DIR}/sddm.conf.d ${TARGET_ROOT}/etc/

else
    #echo "Avviso: Directory di backup (${BACKUP_DIR}) non trovata. Solo i dati /home sono stati copiati."
fi

# 5. CORREZIONE DEI PERMESSI UTENTE (la parte mancante)
#echo "5. Correzione ricorsiva dei permessi utente sulle directory home..."

# Itera su tutte le directory utente all'interno del mountpoint di ripristino
find "${RESTORE_MNTPOINT}" -maxdepth 1 -mindepth 1 -type d ! -name '.system-backup' | while read dir_path; do
    
    username=$(basename "${dir_path}")
    
    # Escludi la directory root se dovesse essere presente
    if [ "${username}" != "root" ]; then

        # Recupera l'UID, GID e la directory home dal file passwd del TARGET
        # Nota: Usiamo grep e awk per leggere l'utente dal file ripristinato
        user_info=$(grep "^${username}:" "${TARGET_ROOT}/etc/passwd")

        if [ -n "$user_info" ]; then
            # Estrai UID e GID dal record in TARGET/etc/passwd
            uid_target=$(echo "$user_info" | awk -F: '{print $3}')
            gid_target=$(echo "$user_info" | awk -F: '{print $4}')
            
            #echo "   - Applico chown a ${username} (UID:${uid_target}, GID:${gid_target})"
            
            # Esegui chown ricorsivo sulla directory home del target
            if [ -d "${TARGET_HOME_MNTPOINT}/${username}" ]; then
                chown -R "${uid_target}:${gid_target}" "${TARGET_HOME_MNTPOINT}/${username}"
            else
                echo "     Avviso: Directory home ${TARGET_HOME_MNTPOINT}/${username} non trovata. Ignorato."
            fi
        fi
    fi
done

# Rimuovi la directory di backup dalla home utente nel sistema installato
#echo "Rimozione della directory .system-backup dal target /home."
rm -rf ${TARGET_HOME_MNTPOINT}/.system-backup


# 6. Pulizia Finale
#echo "6. Pulizia: Smontaggio e rimozione mountpoint temporaneo."
umount "${RESTORE_MNTPOINT}"
rmdir "${RESTORE_MNTPOINT}"

echo "==========================================================="
echo " Ripristino homecrypt completato con successo."
echo "==========================================================="

exit 0
