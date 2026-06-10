#!/bin/bash
set -e

ISODIR="$1"
PRETTY_NAME="$2"
BOOT_PARAMS="$3"

if [ -z "$ISODIR" ] || [ -z "$PRETTY_NAME" ]; then
    echo "Errore: Parametri ISODIR o PRETTY_NAME mancanti."
    exit 1
fi

echo "Generazione menu GRUB e ISOLINUX in corso..."

# 1. Generazione GRUB.cfg principale
cat <<EOF > "$ISODIR/boot/grub/grub.cfg"
set timeout=5
set default=2

insmod efi_gop
insmod efi_uga
insmod all_video
insmod gfxterm
insmod png
insmod part_gpt
insmod part_msdos
insmod fat
insmod iso9660

search --no-floppy --set=root --label OA_LIVE

if loadfont /boot/grub/font.pf2; then
    set gfxmode=auto
    terminal_output gfxterm
fi

background_image /boot/grub/splash.png

# ==========================================
# COLORI MENU PRINCIPALE
# ==========================================
set menu_color_normal=white/black
set menu_color_highlight=white/blue

# ==========================================
# COLORI EDITOR E TERMINALE
# ==========================================
set color_normal=white/black
set color_highlight=white/blue

menuentry "--- oa-tools ---" {
    true
}
menuentry "" {
    true
}
menuentry "Start $PRETTY_NAME" {
    linux /live/vmlinuz $BOOT_PARAMS
    initrd /live/initrd.img
}
menuentry "Start $PRETTY_NAME - RAM mode" {
    linux /live/vmlinuz $BOOT_PARAMS toram
    initrd /live/initrd.img
}
EOF

# 2. Generazione ISOLINUX.cfg
cat <<EOF > "$ISODIR/isolinux/isolinux.cfg"
UI vesamenu.c32
TIMEOUT 50
DEFAULT live

MENU BACKGROUND splash.png
MENU TITLE oa-tools

LABEL live
    MENU LABEL Start $PRETTY_NAME
    LINUX /live/vmlinuz
    APPEND $BOOT_PARAMS
    INITRD /live/initrd.img

LABEL ram
    MENU LABEL Start $PRETTY_NAME - RAM mode
    LINUX /live/vmlinuz
    APPEND $BOOT_PARAMS toram
    INITRD /live/initrd.img
EOF

# 3. Trampolino EFI (Attenzione agli escape \$ per preservare le variabili per GRUB)
cat <<EOF > "$ISODIR/EFI/BOOT/grub.cfg"
search --set=root --file /live/filesystem.squashfs
set prefix=(\$root)/boot/grub
configfile \$prefix/grub.cfg
EOF

echo "Menu generati con successo."
