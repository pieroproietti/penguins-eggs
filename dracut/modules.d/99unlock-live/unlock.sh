#!/bin/sh
if ! getargbool 0 rd.live.image; then
    exit 0
fi
echo "🚀 Esecuzione script di sblocco per dracut..."
LIVE_MEDIA_PATH="/run/initramfs/live"
ENCRYPTED_FILE=$(find "$LIVE_MEDIA_PATH/live" -name 'filesystem.encrypted' -print -quit)
if [ -z "$ENCRYPTED_FILE" ]; then
    echo "❌ ERRORE: filesystem.encrypted non trovato!"
    exit 1
fi
echo "✅ Trovato file criptato in: $ENCRYPTED_FILE"
cryptsetup open "$ENCRYPTED_FILE" live_decrypted
if [ $? -ne 0 ]; then
    echo "❌ ERRORE: Sblocco del volume LUKS fallito."
    exit 1
fi
echo "🔐 Volume LUKS sbloccato!"
echo 'rd.live.image=/dev/mapper/live_decrypted' > /run/initramfs/cmdline.d/99-decrypted.conf
echo "⚙️  Dracut configurato per usare il volume decriptato."
exit 0
