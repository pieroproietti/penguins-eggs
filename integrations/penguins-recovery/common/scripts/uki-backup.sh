#!/bin/bash
# uki-backup.sh -- Back up Unified Kernel Images on the EFI System Partition.
#
# Usage: sudo ./uki-backup.sh
#
# Detects UKI-booted systems and creates backup copies on the ESP.
# If the system was booted from a UKI, the current image is copied
# to a fallback name so it can be selected from the boot menu if a
# future kernel/initrd update breaks boot.
#
# Works alongside ukibak (if installed) but does not require it.

set -euo pipefail

info()  { echo -e "\033[1;32m[INFO]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

if [ ! -d /sys/firmware/efi ]; then
    error "System did not boot in UEFI mode."
    exit 1
fi

# --- Locate the ESP ---
ESP=""
for candidate in /efi /boot/efi /boot; do
    if mountpoint -q "$candidate" 2>/dev/null && [ -d "$candidate/EFI" ]; then
        ESP="$candidate"
        break
    fi
done

if [ -z "$ESP" ]; then
    # Try to find and mount the ESP
    ESP_PART=$(lsblk -rno NAME,PARTTYPE | grep -i "c12a7328-f81f-11d2-ba4b-00a0c93ec93b" | awk '{print $1}' | head -1)
    if [ -n "$ESP_PART" ]; then
        ESP="/tmp/esp_mnt"
        mkdir -p "$ESP"
        mount "/dev/$ESP_PART" "$ESP"
        info "Mounted ESP from /dev/$ESP_PART at $ESP"
    else
        error "Could not locate EFI System Partition."
        exit 1
    fi
fi

info "ESP: $ESP"

# --- Find UKI files on the ESP ---
echo ""
echo "=== UKI Files on ESP ==="
UKI_DIR="$ESP/EFI/Linux"
if [ -d "$UKI_DIR" ]; then
    find "$UKI_DIR" -name "*.efi" -exec ls -lh {} \;
else
    echo "  No $UKI_DIR directory found."
fi

# Also check EFI/BOOT
for efi_file in "$ESP"/EFI/BOOT/*.efi "$ESP"/EFI/BOOT/*.EFI; do
    [ -f "$efi_file" ] && ls -lh "$efi_file"
done

echo ""
echo "=== Available Actions ==="
echo "  1) Back up a UKI to a fallback copy"
echo "  2) List all .efi files on ESP"
echo "  3) Restore a backup UKI as the primary"
echo "  4) Create a boot entry for a backup UKI"
echo "  5) Exit"
echo ""

while true; do
    read -rp "Select action [1-5]: " ACTION
    case "$ACTION" in
        1)
            echo ""
            echo "Available UKI files:"
            mapfile -t UKI_FILES < <(find "$ESP" -name "*.efi" -path "*/Linux/*" 2>/dev/null)
            if [ ${#UKI_FILES[@]} -eq 0 ]; then
                warn "No UKI files found in $ESP/EFI/Linux/"
                echo "Enter full path to the EFI file to back up:"
                read -rp "Path: " SRC_PATH
            else
                for i in "${!UKI_FILES[@]}"; do
                    echo "  $((i+1))) ${UKI_FILES[$i]}"
                done
                read -rp "Select file number (or enter path): " SELECTION
                if [[ "$SELECTION" =~ ^[0-9]+$ ]] && [ "$SELECTION" -ge 1 ] && [ "$SELECTION" -le ${#UKI_FILES[@]} ]; then
                    SRC_PATH="${UKI_FILES[$((SELECTION-1))]}"
                else
                    SRC_PATH="$SELECTION"
                fi
            fi

            if [ ! -f "$SRC_PATH" ]; then
                error "File not found: $SRC_PATH"
                continue
            fi

            BACKUP_NAME="${SRC_PATH%.efi}-backup.efi"
            read -rp "Backup name [$BACKUP_NAME]: " CUSTOM_NAME
            BACKUP_NAME="${CUSTOM_NAME:-$BACKUP_NAME}"

            cp -v "$SRC_PATH" "$BACKUP_NAME"
            info "Backup created: $BACKUP_NAME"
            ;;
        2)
            echo ""
            find "$ESP" -name "*.efi" -o -name "*.EFI" 2>/dev/null | sort | while read -r f; do
                ls -lh "$f"
            done
            ;;
        3)
            echo ""
            read -rp "Path to backup UKI: " BACKUP_PATH
            read -rp "Path to restore as (primary UKI): " PRIMARY_PATH
            if [ ! -f "$BACKUP_PATH" ]; then
                error "Backup not found: $BACKUP_PATH"
                continue
            fi
            cp -v "$BACKUP_PATH" "$PRIMARY_PATH"
            info "Restored $BACKUP_PATH -> $PRIMARY_PATH"
            ;;
        4)
            echo ""
            if ! command -v efibootmgr &>/dev/null; then
                error "efibootmgr not found."
                continue
            fi
            read -rp "Path to UKI on ESP (e.g. $ESP/EFI/Linux/rescue-backup.efi): " UKI_PATH
            if [ ! -f "$UKI_PATH" ]; then
                error "File not found: $UKI_PATH"
                continue
            fi
            read -rp "Label for boot entry: " LABEL

            # Convert filesystem path to EFI path
            EFI_REL="${UKI_PATH#$ESP}"
            EFI_PATH=$(echo "$EFI_REL" | sed 's|/|\\|g')

            # Find the ESP disk and partition number
            ESP_DEV=$(findmnt -n -o SOURCE "$ESP" 2>/dev/null || echo "")
            if [ -z "$ESP_DEV" ]; then
                read -rp "ESP device (e.g. /dev/sda1): " ESP_DEV
            fi
            DISK=$(echo "$ESP_DEV" | sed 's/[0-9]*$//')
            PARTNUM=$(echo "$ESP_DEV" | grep -o '[0-9]*$')

            efibootmgr -c -d "$DISK" -p "$PARTNUM" -l "$EFI_PATH" -L "$LABEL"
            info "Boot entry created: $LABEL"
            ;;
        5)
            exit 0
            ;;
        *)
            warn "Invalid selection."
            ;;
    esac
    echo ""
done
