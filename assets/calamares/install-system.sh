#!/bin/bash

# 1. Variabili d'ambiente per il display
export QT_QPA_PLATFORM=wayland
export QT_AUTO_SCREEN_SCALE_FACTOR=1

# 2. Gestione XHOST per compatibilità XWayland
if command -v xhost >/dev/null 2>&1; then
    xhost +si:localuser:root >/dev/null 2>&1
fi

# 3. Lancio di Calamares con correzione per XDG_RUNTIME_DIR
# Invece di -E (che passa tutto), passiamo solo le variabili necessarie
# e resettiamo XDG_RUNTIME_DIR per evitare il conflitto di UID
sudo WAYLAND_DISPLAY=$WAYLAND_DISPLAY \
     DISPLAY=$DISPLAY \
     XDG_RUNTIME_DIR=/run/user/0 \
     /usr/bin/calamares "$@"

# 4. Pulizia
if command -v xhost >/dev/null 2>&1; then
    xhost -si:localuser:root >/dev/null 2>&1
fi