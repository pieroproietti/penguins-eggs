#!/bin/bash
set -e

# Argomenti: $1 = basepath (es. /home/eggs), $2 = isGitHubAction (true/false), $3 = mode (standard/clone/crypted)
BASEPATH=$1
GITHUB_ACTION=$2
MODE=$3

LIVEROOT="$BASEPATH/liveroot"
OVERLAY="$BASEPATH/.overlay"

# 1. SETUP STRUTTURA
mkdir -p "$LIVEROOT" "$OVERLAY/upperdir" "$OVERLAY/workdir" "$OVERLAY/lowerdir"

# 1.1. SELF-BIND OF LIVEROOT
# Needed so pacman sees "/" as a mountpoint inside the chroot (otherwise
# CheckSpace fails outright). make-private stops the bind from propagating
# onto /home and breaking eternit's umount later. Run outside the guard
# since it's idempotent and mountpoint alone can't tell shared from private.
mountpoint -q "$LIVEROOT" || mount --bind "$LIVEROOT" "$LIVEROOT"
mount --make-private "$LIVEROOT"

# 2. COPIE FISICHE
cp -a /etc /boot "$LIVEROOT/"
for link in vmlinuz initrd.img vmlinuz.old initrd.img.old; do
    [ -e "/$link" ] && cp -a "/$link" "$LIVEROOT/$link"
done

# 2.1. SIBLING: marker persistente del mode di remaster.
# Vive fuori da installer.d (che viene rigenerato a ogni avvio
# dell'installer) così BuildInstaller può leggerlo per sapere se gli
# utenti sono già clonati da /home.
mkdir -p "$LIVEROOT/etc/penguins-eggs.d"
echo "mode: $MODE" > "$LIVEROOT/etc/penguins-eggs.d/sibling.yaml"

# 3. BIND MOUNTS E SYMLINK (USRMERGE)
for e in bin sbin lib lib64 opt root srv; do
    SRC="/$e"
    DST="$LIVEROOT/$e"
    if [ -L "$SRC" ]; then
        ln -sf "$(readlink "$SRC")" "$DST"
    elif [ -d "$SRC" ]; then
        # FIX: Creiamo la directory di destinazione prima di fare il bind mount
        mkdir -p "$DST"
        # Idempotente: se un run precedente fallito ha lasciato il bind
        # montato, non ritentiamo il mount (fallirebbe con "already mounted").
        mountpoint -q "$DST" || mount --bind "$SRC" "$DST"
    fi
done

# 3.1. BIND MOUNT DI /home IN READ-ONLY (solo mode "clone" o "crypted")
# Gli utenti NON vanno toccati: si clona la home reale così com'è invece di
# iniettarne una nuova via skel. --make-slave evita che il bind si propaghi
# sulla home host: LIVEROOT vive sotto $BASEPATH che è a sua volta dentro
# /home, quindi un bind condiviso (default) qui genererebbe un mount-bomb.
if [ "$MODE" = "clone" ] || [ "$MODE" = "crypted" ]; then
    mkdir -p "$LIVEROOT/home"
    if ! mountpoint -q "$LIVEROOT/home"; then
        mount --bind --make-slave /home "$LIVEROOT/home"
        mount -o remount,bind,ro "$LIVEROOT/home"
    fi
fi

# 4. OVERLAY PER USR E VAR
for ovlDir in usr var; do
    LOWER="$OVERLAY/lowerdir/$ovlDir"
    UPPER="$OVERLAY/upperdir/$ovlDir"
    WORK="$OVERLAY/workdir/$ovlDir"
    MERGED="$LIVEROOT/$ovlDir"

    # FIX: Aggiunto $MERGED alla lista delle directory da creare
    mkdir -p "$LOWER" "$UPPER" "$WORK" "$MERGED"
    mountpoint -q "$LOWER" || mount --bind "/$ovlDir" "$LOWER"
    mountpoint -q "$MERGED" || mount -t overlay overlay -o lowerdir="$LOWER",upperdir="$UPPER",workdir="$WORK" "$MERGED"
done

# 5. API FILESYSTEMS
# FIX: Creiamo i mount point per le API del Kernel
mkdir -p "$LIVEROOT/proc" "$LIVEROOT/sys" "$LIVEROOT/dev" "$LIVEROOT/run"
mountpoint -q "$LIVEROOT/proc" || mount -t proc proc "$LIVEROOT/proc"
mountpoint -q "$LIVEROOT/sys"  || mount -t sysfs sys "$LIVEROOT/sys"
mountpoint -q "$LIVEROOT/dev"  || mount --bind /dev "$LIVEROOT/dev"
mountpoint -q "$LIVEROOT/run"  || mount --bind /run "$LIVEROOT/run"

# 6. TMPFS
mkdir -p "$LIVEROOT/tmp"
chmod 1777 "$LIVEROOT/tmp"
if [ "$GITHUB_ACTION" != "true" ]; then
    mountpoint -q "$LIVEROOT/tmp" || mount -t tmpfs -o mode=1777 tmpfs "$LIVEROOT/tmp"
fi

echo "Bootstrap completato."
