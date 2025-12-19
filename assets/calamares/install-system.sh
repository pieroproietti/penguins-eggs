#!/bin/bash

# 1. Scaling e Display (minimali)
export QT_AUTO_SCREEN_SCALE_FACTOR=1

# 2. Sblocca il display per root (Fix per Wayland/Pop!_OS)
# Usiamo l'utente corrente per dare il permesso
if command -v xhost >/dev/null 2>&1; then
    xhost +si:localuser:root >/dev/null 2>&1
fi

# 3. Lancio di Calamares
# Usiamo sudo -E per ereditare solo le variabili necessarie (DISPLAY, WAYLAND_DISPLAY)
# senza sovrascrivere forzatamente XDG_RUNTIME_DIR nello script
sudo -E /usr/bin/calamares "$@"

# 4. Pulizia (opzionale)
if command -v xhost >/dev/null 2>&1; then
    xhost -si:localuser:root >/dev/null 2>&1
fi
