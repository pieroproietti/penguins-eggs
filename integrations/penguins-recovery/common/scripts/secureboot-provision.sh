#!/bin/bash
# secureboot-provision.sh -- Create and install UEFI Secure Boot variables.
#
# Usage: sudo ./secureboot-provision.sh
#
# Inspired by pbatard/Mosby. Provides tools to create custom Secure Boot
# key sets (PK, KEK, db) and install them into UEFI firmware, or reset
# Secure Boot to factory defaults. Useful in recovery when Secure Boot
# keys are corrupted or need to be replaced.
#
# Requires: efitools, openssl, efivar or efi-updatevar

set -euo pipefail

info()  { echo -e "\033[1;32m[sb-provision]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[sb-provision]\033[0m $*"; }
error() { echo -e "\033[1;31m[sb-provision]\033[0m $*" >&2; }

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

if [ ! -d /sys/firmware/efi ]; then
    error "System did not boot in UEFI mode."
    exit 1
fi

# Check for required tools
MISSING=""
for tool in openssl cert-to-efi-sig-list sign-efi-sig-list; do
    if ! command -v "$tool" &>/dev/null; then
        MISSING="$MISSING $tool"
    fi
done
if [ -n "$MISSING" ]; then
    error "Missing required tools:$MISSING"
    echo "Install: efitools, openssl"
    exit 1
fi

KEY_DIR="/tmp/secureboot-keys-$(date +%Y%m%d-%H%M%S)"

# --- Check current Secure Boot mode ---
show_status() {
    echo "=== Secure Boot Status ==="
    if command -v mokutil &>/dev/null; then
        mokutil --sb-state 2>/dev/null || true
    fi

    # Check setup mode
    SETUP_MODE="unknown"
    if [ -f /sys/firmware/efi/efivars/SetupMode-8be4df61-93ca-11d2-aa0d-00e098032b8c ]; then
        SM_VAL=$(od -An -t u1 -j4 -N1 /sys/firmware/efi/efivars/SetupMode-8be4df61-93ca-11d2-aa0d-00e098032b8c 2>/dev/null | tr -d ' ')
        if [ "$SM_VAL" = "1" ]; then
            SETUP_MODE="enabled"
            info "Setup Mode: ENABLED (keys can be enrolled without authentication)"
        else
            SETUP_MODE="disabled"
            info "Setup Mode: DISABLED (key changes require existing PK)"
        fi
    fi

    echo ""
    echo "Current variables:"
    for var in PK KEK db dbx; do
        VARFILE="/sys/firmware/efi/efivars/${var}-d719b2cb-3d3a-4596-a3bc-dad00e67656f"
        if [ -f "$VARFILE" ]; then
            SIZE=$(stat -c%s "$VARFILE" 2>/dev/null || echo "?")
            echo "  $var: present ($SIZE bytes)"
        else
            echo "  $var: not set"
        fi
    done
}

# --- Generate a new key set ---
generate_keys() {
    mkdir -p "$KEY_DIR"
    info "Generating keys in $KEY_DIR"

    local GUID
    GUID=$(uuidgen)
    echo "$GUID" > "$KEY_DIR/GUID.txt"
    info "Owner GUID: $GUID"

    # Platform Key (PK)
    info "Generating Platform Key (PK)..."
    openssl req -new -x509 -newkey rsa:2048 -sha256 -days 3650 \
        -subj "/CN=Penguins Recovery PK/" -keyout "$KEY_DIR/PK.key" \
        -out "$KEY_DIR/PK.crt" -nodes 2>/dev/null
    cert-to-efi-sig-list -g "$GUID" "$KEY_DIR/PK.crt" "$KEY_DIR/PK.esl"
    sign-efi-sig-list -g "$GUID" -k "$KEY_DIR/PK.key" -c "$KEY_DIR/PK.crt" \
        PK "$KEY_DIR/PK.esl" "$KEY_DIR/PK.auth" 2>/dev/null

    # Key Exchange Key (KEK)
    info "Generating Key Exchange Key (KEK)..."
    openssl req -new -x509 -newkey rsa:2048 -sha256 -days 3650 \
        -subj "/CN=Penguins Recovery KEK/" -keyout "$KEY_DIR/KEK.key" \
        -out "$KEY_DIR/KEK.crt" -nodes 2>/dev/null
    cert-to-efi-sig-list -g "$GUID" "$KEY_DIR/KEK.crt" "$KEY_DIR/KEK.esl"
    sign-efi-sig-list -g "$GUID" -k "$KEY_DIR/PK.key" -c "$KEY_DIR/PK.crt" \
        KEK "$KEY_DIR/KEK.esl" "$KEY_DIR/KEK.auth" 2>/dev/null

    # Signature Database (db)
    info "Generating Signature Database (db)..."
    openssl req -new -x509 -newkey rsa:2048 -sha256 -days 3650 \
        -subj "/CN=Penguins Recovery db/" -keyout "$KEY_DIR/db.key" \
        -out "$KEY_DIR/db.crt" -nodes 2>/dev/null
    cert-to-efi-sig-list -g "$GUID" "$KEY_DIR/db.crt" "$KEY_DIR/db.esl"
    sign-efi-sig-list -g "$GUID" -k "$KEY_DIR/KEK.key" -c "$KEY_DIR/KEK.crt" \
        db "$KEY_DIR/db.esl" "$KEY_DIR/db.auth" 2>/dev/null

    info "Keys generated in $KEY_DIR"
    echo ""
    echo "Files:"
    ls -la "$KEY_DIR"/*.auth "$KEY_DIR"/*.crt "$KEY_DIR"/*.key 2>/dev/null
    echo ""
    warn "IMPORTANT: Back up $KEY_DIR/PK.key and KEK.key securely."
    warn "Losing the PK key means you cannot modify Secure Boot variables."
}

# --- Add Microsoft keys to db ---
add_microsoft_keys() {
    if [ ! -d "$KEY_DIR" ] || [ ! -f "$KEY_DIR/KEK.key" ]; then
        error "Generate keys first (option 1)."
        return
    fi

    info "Downloading Microsoft UEFI certificates..."

    local MS_DIR="$KEY_DIR/microsoft"
    mkdir -p "$MS_DIR"

    # Microsoft Production PCA 2011 (signs Windows bootloaders)
    local MS_PROD_URL="https://www.microsoft.com/pkiops/certs/MicWinProPCA2011_2011-10-19.crt"
    # Microsoft UEFI CA 2011 (signs third-party UEFI drivers/bootloaders)
    local MS_UEFI_URL="https://www.microsoft.com/pkiops/certs/MicCorUEFCA2011_2011-06-27.crt"

    if command -v wget &>/dev/null; then
        wget -q -O "$MS_DIR/ms-prod.crt" "$MS_PROD_URL" 2>/dev/null || true
        wget -q -O "$MS_DIR/ms-uefi.crt" "$MS_UEFI_URL" 2>/dev/null || true
    elif command -v curl &>/dev/null; then
        curl -sL -o "$MS_DIR/ms-prod.crt" "$MS_PROD_URL" 2>/dev/null || true
        curl -sL -o "$MS_DIR/ms-uefi.crt" "$MS_UEFI_URL" 2>/dev/null || true
    else
        warn "Neither wget nor curl found. Download Microsoft certs manually."
        return
    fi

    local GUID
    GUID=$(cat "$KEY_DIR/GUID.txt")

    if [ -f "$MS_DIR/ms-prod.crt" ] && [ -s "$MS_DIR/ms-prod.crt" ]; then
        # Convert DER to PEM if needed, then to ESL
        openssl x509 -inform DER -in "$MS_DIR/ms-prod.crt" -out "$MS_DIR/ms-prod.pem" 2>/dev/null || \
            cp "$MS_DIR/ms-prod.crt" "$MS_DIR/ms-prod.pem"
        cert-to-efi-sig-list -g "$GUID" "$MS_DIR/ms-prod.pem" "$MS_DIR/ms-prod.esl" 2>/dev/null
        info "Microsoft Production PCA 2011 converted."
    fi

    if [ -f "$MS_DIR/ms-uefi.crt" ] && [ -s "$MS_DIR/ms-uefi.crt" ]; then
        openssl x509 -inform DER -in "$MS_DIR/ms-uefi.crt" -out "$MS_DIR/ms-uefi.pem" 2>/dev/null || \
            cp "$MS_DIR/ms-uefi.crt" "$MS_DIR/ms-uefi.pem"
        cert-to-efi-sig-list -g "$GUID" "$MS_DIR/ms-uefi.pem" "$MS_DIR/ms-uefi.esl" 2>/dev/null
        info "Microsoft UEFI CA 2011 converted."
    fi

    # Combine with existing db
    if [ -f "$MS_DIR/ms-prod.esl" ] && [ -f "$MS_DIR/ms-uefi.esl" ]; then
        cat "$KEY_DIR/db.esl" "$MS_DIR/ms-prod.esl" "$MS_DIR/ms-uefi.esl" > "$KEY_DIR/db-with-ms.esl"
        sign-efi-sig-list -g "$GUID" -k "$KEY_DIR/KEK.key" -c "$KEY_DIR/KEK.crt" \
            db "$KEY_DIR/db-with-ms.esl" "$KEY_DIR/db-with-ms.auth" 2>/dev/null
        info "Combined db created: $KEY_DIR/db-with-ms.auth"
        info "Use this instead of db.auth to allow Microsoft-signed binaries."
    else
        warn "Could not download Microsoft certificates."
    fi
}

# --- Enroll keys into firmware ---
enroll_keys() {
    if [ ! -d "$KEY_DIR" ] || [ ! -f "$KEY_DIR/PK.auth" ]; then
        error "Generate keys first (option 1)."
        return
    fi

    echo ""
    warn "=== KEY ENROLLMENT ==="
    warn "This will REPLACE the current Secure Boot keys in firmware."
    warn "If done incorrectly, the system may not boot signed OS loaders."
    echo ""
    echo "  Available auth files:"
    ls "$KEY_DIR"/*.auth 2>/dev/null | sed 's/^/    /'
    echo ""
    echo "  1) Enroll custom keys only (PK + KEK + db)"
    echo "  2) Enroll custom keys + Microsoft (PK + KEK + db-with-ms)"
    echo "  3) Cancel"
    echo ""

    read -rp "Select [1-3]: " ENROLL_OPT

    local DB_AUTH
    case "$ENROLL_OPT" in
        1) DB_AUTH="$KEY_DIR/db.auth" ;;
        2)
            DB_AUTH="$KEY_DIR/db-with-ms.auth"
            if [ ! -f "$DB_AUTH" ]; then
                error "Run 'Add Microsoft keys' first (option 2)."
                return
            fi
            ;;
        3) return ;;
        *) warn "Cancelled."; return ;;
    esac

    if ! command -v efi-updatevar &>/dev/null; then
        error "efi-updatevar not found (part of efitools)."
        return
    fi

    warn "Enrolling keys. Order matters: db first, then KEK, then PK."
    read -rp "Final confirmation - proceed? [y/N]: " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        return
    fi

    echo ""
    info "Enrolling db..."
    efi-updatevar -e -f "$DB_AUTH" db 2>&1 && info "  db enrolled." || error "  db enrollment failed."

    info "Enrolling KEK..."
    efi-updatevar -e -f "$KEY_DIR/KEK.auth" KEK 2>&1 && info "  KEK enrolled." || error "  KEK enrollment failed."

    info "Enrolling PK (this activates Secure Boot)..."
    efi-updatevar -f "$KEY_DIR/PK.auth" PK 2>&1 && info "  PK enrolled." || error "  PK enrollment failed."

    echo ""
    info "Key enrollment complete. Verify with option 5 (show status)."
}

# --- Clear PK to enter Setup Mode ---
clear_pk() {
    warn "Clearing the Platform Key puts the firmware into Setup Mode."
    warn "This effectively disables Secure Boot enforcement."
    read -rp "Proceed? [y/N]: " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        return
    fi

    if command -v efi-updatevar &>/dev/null; then
        # Create an empty signed PK update (requires current PK key)
        if [ -f "$KEY_DIR/PK.key" ] && [ -f "$KEY_DIR/PK.crt" ]; then
            local GUID
            GUID=$(cat "$KEY_DIR/GUID.txt" 2>/dev/null || uuidgen)
            sign-efi-sig-list -g "$GUID" -k "$KEY_DIR/PK.key" -c "$KEY_DIR/PK.crt" \
                PK /dev/null "$KEY_DIR/noPK.auth" 2>/dev/null
            efi-updatevar -f "$KEY_DIR/noPK.auth" PK 2>&1 \
                && info "PK cleared. System is now in Setup Mode." \
                || error "Failed to clear PK."
        else
            warn "No PK key available. Try clearing from UEFI firmware settings instead."
        fi
    else
        error "efi-updatevar not found."
    fi
}

# --- Main menu ---
show_status

echo ""
echo "=== Secure Boot Key Provisioning ==="
echo "  1) Generate new key set (PK, KEK, db)"
echo "  2) Add Microsoft keys to db"
echo "  3) Enroll keys into firmware"
echo "  4) Clear PK (enter Setup Mode)"
echo "  5) Show current status"
echo "  6) Exit"
echo ""

while true; do
    read -rp "Select action [1-6]: " ACTION
    case "$ACTION" in
        1) generate_keys ;;
        2) add_microsoft_keys ;;
        3) enroll_keys ;;
        4) clear_pk ;;
        5) show_status ;;
        6) exit 0 ;;
        *) warn "Invalid selection." ;;
    esac
    echo ""
done
