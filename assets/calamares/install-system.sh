#!/bin/bash

# Rileva se siamo su Wayland o X11
if [ -n "$WAYLAND_DISPLAY" ]; then
    export QT_QPA_PLATFORM=wayland
else
    export QT_QPA_PLATFORM=xcb
fi

export QT_AUTO_SCREEN_SCALE_FACTOR=1

# Sblocca permessi per root (fondamentale per X11/XWayland)
if command -v xhost >/dev/null 2>&1; then
    xhost +si:localuser:root >/dev/null 2>&1
fi

# Lancio Calamares
# Usiamo env -u per assicurarci che non ci siano residui di sessione utente
sudo env \
    DISPLAY=$DISPLAY \
    WAYLAND_DISPLAY=$WAYLAND_DISPLAY \
    XDG_RUNTIME_DIR=/run/user/0 \
    /usr/bin/calamares "$@"

# Pulizia
if command -v xhost >/dev/null 2>&1; then
    xhost -si:localuser:root >/dev/null 2>&1
fi