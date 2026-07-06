#!/bin/bash
set -e

ISODIR="$1"
# Estrae il PRETTY_NAME da /etc/os-release
PRETTY_NAME=$(grep ^PRETTY_NAME= /etc/os-release | cut -d= -f2 | tr -d '"')
BOOT_PARAMS="$2"
BOOT_COMMON="audit=0 splash quiet loglevel=3 systemd.show_status=auto udev.log_priority=3"
RAM_MODE_ENABLED="${3:-1}"

echo "Generazione menu per: $PRETTY_NAME"

if [ -z "$ISODIR" ] || [ -z "$PRETTY_NAME" ]; then
    echo "Errore: Parametri ISODIR o PRETTY_NAME mancanti."
    exit 1
fi

echo "Generazione menu GRUB e ISOLINUX in corso..."

MENU_TITLE="penguins-eggs (oa edition)"
START_LABEL="Start"
RAM_LABEL="RAM mode"
if [ -f "/etc/penguins-eggs.d/brain.d/assets/menu-strings.conf" ]; then
    . "/etc/penguins-eggs.d/brain.d/assets/menu-strings.conf"
fi

# Optional "RAM mode" entry: some vendors (systems typically installed
# on low-RAM hardware) prefer to omit it to avoid confusion.
# Controlled via 'coa config' (custom.yaml: ram_mode).
GRUB_RAM_ENTRY=""
ISOLINUX_RAM_ENTRY=""
if [ "$RAM_MODE_ENABLED" = "1" ]; then
    GRUB_RAM_ENTRY="menuentry \"$START_LABEL $PRETTY_NAME - $RAM_LABEL\" {
    linux /live/vmlinuz $BOOT_PARAMS $BOOT_COMMON toram
    initrd /live/initrd.img
}"
    ISOLINUX_RAM_ENTRY="
LABEL ram
    MENU LABEL $START_LABEL $PRETTY_NAME - $RAM_LABEL
    LINUX /live/vmlinuz
    APPEND $BOOT_PARAMS $BOOT_COMMON toram
    INITRD /live/initrd.img"
fi

GRUB_THEME_BLOCK="background_image /boot/grub/splash.png

# ==========================================
# COLORI MENU PRINCIPALE
# ==========================================
set menu_color_normal=white/black
set menu_color_highlight=white/blue

# ==========================================
# COLORI EDITOR E TERMINALE
# ==========================================
set color_normal=white/black
set color_highlight=white/blue"
GRUB_HEADER_ENTRIES="menuentry \"--- $MENU_TITLE ---\" {
    true
}
menuentry \"\" {
    true
}"
GRUB_DEFAULT_INDEX=2

if [ -f "$ISODIR/boot/grub/theme.cfg" ]; then
    GRUB_THEME_BLOCK="insmod gfxmenu
set theme=/boot/grub/theme.cfg"
    GRUB_HEADER_ENTRIES=""
    GRUB_DEFAULT_INDEX=0
fi

# 1. Generazione GRUB.cfg principale
cat <<EOF > "$ISODIR/boot/grub/grub.cfg"
set timeout=5
set default=$GRUB_DEFAULT_INDEX

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

$GRUB_THEME_BLOCK

$GRUB_HEADER_ENTRIES
menuentry "$START_LABEL $PRETTY_NAME" {
    linux /live/vmlinuz $BOOT_PARAMS $BOOT_COMMON
    initrd /live/initrd.img
}
$GRUB_RAM_ENTRY
EOF

# 2. Generazione ISOLINUX.cfg
ISOLINUX_HEADER="MENU BACKGROUND splash.png
MENU TITLE $MENU_TITLE"

if [ -f "$ISODIR/isolinux/isolinux.theme.cfg" ]; then
    ISOLINUX_HEADER="include isolinux.theme.cfg"
fi

cat <<EOF > "$ISODIR/isolinux/isolinux.cfg"
UI vesamenu.c32
TIMEOUT 50
DEFAULT live

$ISOLINUX_HEADER

LABEL live
    MENU LABEL $START_LABEL $PRETTY_NAME
    LINUX /live/vmlinuz
    APPEND $BOOT_PARAMS $BOOT_COMMON
    INITRD /live/initrd.img
$ISOLINUX_RAM_ENTRY
EOF

# 3. Trampolino EFI (Attenzione agli escape \$ per preservare le variabili per GRUB)
cat <<EOF > "$ISODIR/EFI/BOOT/grub.cfg"
search --set=root --label OA_LIVE
set prefix=(\$root)/boot/grub
configfile \$prefix/grub.cfg
EOF

echo "Menu generati con successo."
