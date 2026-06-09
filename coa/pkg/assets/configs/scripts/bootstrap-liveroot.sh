#!/bin/bash
set -e

# Argomenti: $1 = basepath (es. /home/eggs), $2 = isGitHubAction (true/false)
BASEPATH=$1
GITHUB_ACTION=$2

LIVEROOT="$BASEPATH/liveroot"
OVERLAY="$BASEPATH/.overlay"

# 1. SETUP STRUTTURA
mkdir -p "$LIVEROOT" "$OVERLAY/upperdir" "$OVERLAY/workdir" "$OVERLAY/lowerdir"

# 2. COPIE FISICHE
cp -a /etc /boot "$LIVEROOT/"
for link in vmlinuz initrd.img vmlinuz.old initrd.img.old; do
    [ -e "/$link" ] && cp -a "/$link" "$LIVEROOT/$link"
done

# 3. BIND MOUNTS E SYMLINK (USRMERGE)
for e in bin sbin lib lib64 opt root srv; do
    SRC="/$e"
    DST="$LIVEROOT/$e"
    if [ -L "$SRC" ]; then
        ln -sf "$(readlink "$SRC")" "$DST"
    elif [ -d "$SRC" ]; then
        # FIX: Creiamo la directory di destinazione prima di fare il bind mount
        mkdir -p "$DST"
        mount --bind "$SRC" "$DST"
    fi
done

# 4. OVERLAY PER USR E VAR
for ovlDir in usr var; do
    LOWER="$OVERLAY/lowerdir/$ovlDir"
    UPPER="$OVERLAY/upperdir/$ovlDir"
    WORK="$OVERLAY/workdir/$ovlDir"
    MERGED="$LIVEROOT/$ovlDir"

    # FIX: Aggiunto $MERGED alla lista delle directory da creare
    mkdir -p "$LOWER" "$UPPER" "$WORK" "$MERGED"
    mount --bind "/$ovlDir" "$LOWER"
    mount -t overlay overlay -o lowerdir="$LOWER",upperdir="$UPPER",workdir="$WORK" "$MERGED"
done

# 5. API FILESYSTEMS
# FIX: Creiamo i mount point per le API del Kernel
mkdir -p "$LIVEROOT/proc" "$LIVEROOT/sys" "$LIVEROOT/dev" "$LIVEROOT/run"
mount -t proc proc "$LIVEROOT/proc"
mount -t sysfs sys "$LIVEROOT/sys"
mount --bind /dev "$LIVEROOT/dev"
mount --bind /run "$LIVEROOT/run"

# 6. TMPFS
mkdir -p "$LIVEROOT/tmp"
chmod 1777 "$LIVEROOT/tmp"
if [ "$GITHUB_ACTION" != "true" ]; then
    mount -t tmpfs -o mode=1777 tmpfs "$LIVEROOT/tmp"
fi

echo "Bootstrap completato."
