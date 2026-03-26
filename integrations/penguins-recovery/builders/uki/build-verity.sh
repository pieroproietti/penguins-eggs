#!/bin/bash
# builders/uki/build-verity.sh
#
# Build a dm-verity verified, Secure Boot-signed recovery UKI using mkosi.
#
# Extends the existing builders/uki/ pipeline (mkosi + systemd-ukify) with
# --verity=yes and --secure-boot=yes. The output is a signed EFI binary that
# can be placed on the ESP and booted directly.
#
# Requires mkosi >= v16.
# Install: pipx install git+https://github.com/systemd/mkosi.git
#
# Usage:
#   ./build-verity.sh [options]
#
# Options:
#   --key   <path>   Secure Boot signing key (.key)
#   --cert  <path>   Secure Boot certificate (.crt)
#   --no-sign        Skip Secure Boot signing
#   --output <path>  Output EFI path (default: mkosi.output.verity/penguins-recovery-verified.efi)
#   --help           Show this help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

KEY=""
CERT=""
SIGN="true"
OUTPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key)     KEY="$2";    shift 2 ;;
    --cert)    CERT="$2";   shift 2 ;;
    --no-sign) SIGN="false"; shift ;;
    --output)  OUTPUT="$2"; shift 2 ;;
    --help|-h) sed -n '2,/^$/s/^# //p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

info() { echo -e "\033[1;32m[uki-verity]\033[0m $*"; }
error() { echo -e "\033[1;31m[uki-verity]\033[0m $*" >&2; }

if ! command -v mkosi &>/dev/null; then
  error "mkosi not found."
  error "Install: pipx install git+https://github.com/systemd/mkosi.git"
  exit 1
fi

MKOSI_VER=$(mkosi --version 2>/dev/null | head -1)
info "Using: $MKOSI_VER"

ARGS=(
  --directory "$SCRIPT_DIR"
  --config "${SCRIPT_DIR}/mkosi-verity.conf"
  --verity=yes
)

if [[ "$SIGN" == "true" && -n "$KEY" && -n "$CERT" ]]; then
  ARGS+=(--secure-boot=yes --secure-boot-key "$KEY" --secure-boot-certificate "$CERT")
  info "Secure Boot signing: enabled"
else
  ARGS+=(--secure-boot=no)
  info "Secure Boot signing: disabled (use --key / --cert to enable)"
fi

if [[ -n "$OUTPUT" ]]; then
  ARGS+=(--output "$OUTPUT")
fi

info "Building verified recovery UKI..."
mkosi "${ARGS[@]}" build

# Locate output
OUT_DIR="${SCRIPT_DIR}/mkosi.output.verity"
EFI=$(find "$OUT_DIR" -name "*.efi" | head -1)
ROOTHASH=$(find "$OUT_DIR" -name "*.roothash" | head -1)

info "============================================"
info "Build complete!"
[[ -n "$EFI" ]]      && info "  EFI:       $EFI"
[[ -n "$ROOTHASH" ]] && info "  Root hash: $(cat "$ROOTHASH")"
info "============================================"
info "To deploy:"
info "  cp $EFI /boot/efi/EFI/Linux/"
