#!/bin/bash

# Il file che causa il blocco fa parte degli "hooks" del sistema live.
LIVE_HOOK="/usr/share/initramfs-tools/hooks/live"

# Spostiamo temporaneamente il file di blocco
if [ -f "$LIVE_HOOK" ]; then
    mv "$LIVE_HOOK" /tmp/live.hook.bak
fi

# Ora eseguiamo il comando, che non verrà più bloccato
update-initramfs -c -k all

# Ripristiniamo il file originale per mantenere pulito il sistema
if [ -f "/tmp/live.hook.bak" ]; then
    mv /tmp/live.hook.bak "$LIVE_HOOK"
fi

exit 0
