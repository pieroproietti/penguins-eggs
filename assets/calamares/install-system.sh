#!/bin/bash

# 1. Pulizia fstab (tua logica originale)
if [ -f /etc/fstab ]; then
    sudo mv /etc/fstab /etc/fstab.orig.calamares
fi

# 2. Scaling per HiDPI
export QT_AUTO_SCREEN_SCALE_FACTOR=1

# 3. Variabili d'ambiente per il display
export DISPLAY=${DISPLAY:-:0}
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export QT_QPA_PLATFORM="wayland;xcb"

# 4. Accesso grafico per root (fondamentale per Wayland/XWayland)
if command -v xhost >/dev/null 2>&1; then
    xhost +si:localuser:root >/dev/null 2>&1
fi

# 5. Lancio con sudo -E (Invece di pkexec)
# -E preserva le variabili QT e il display anche su Wayland
sudo -E calamares "$@"

# 6. Ripristino (tua logica originale)
if command -v xhost >/dev/null 2>&1; then
    xhost -si:localuser:root >/dev/null 2>&1
fi

if [ -f /etc/fstab.orig.calamares ]; then
    sudo mv /etc/fstab.orig.calamares /etc/fstab
fi