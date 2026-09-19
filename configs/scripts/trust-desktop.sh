#!/bin/bash
# Trova la cartella Desktop corretta (Scrivania, Desktop, Bureau...)
DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
mkdir -p "$DESKTOP_DIR"
 
LAUNCHER_SRC="/usr/share/applications/install-system.desktop"
LAUNCHER_DEST="$DESKTOP_DIR/install-system.desktop"
 
if [ -f "$LAUNCHER_SRC" ]; then
    cp "$LAUNCHER_SRC" "$LAUNCHER_DEST"
    chmod +x "$LAUNCHER_DEST"
fi
 
# Attesa del caricamento dell'ambiente grafico
for i in {1..15}; do
    if pgrep -x xfdesktop >/dev/null || pgrep -x nautilus >/dev/null || pgrep -x nemo >/dev/null || pgrep -x caja >/dev/null || pgrep -f ding >/dev/null || pgrep -x plasmashell >/dev/null || pgrep -x pcmanfm >/dev/null || pgrep -x pcmanfm-qt >/dev/null; then
        break
    fi
    sleep 1
done
sleep 2
 
# Applica il trust
if ! pgrep -x plasmashell > /dev/null; then
    if [ -f "$LAUNCHER_DEST" ]; then
        gio set "$LAUNCHER_DEST" metadata::trusted yes 2>/dev/null
        gio set "$LAUNCHER_DEST" metadata::xfce-exe-checksum "$(sha256sum "$LAUNCHER_DEST" | awk '{print $1}')" 2>/dev/null
    fi
fi