#!/usr/bin/env bash
# setup.sh — fetch OSs-security hardening scripts from upstream
#
# Usage:
#   bash setup.sh [linux|macos|windows]   # fetch scripts for one OS (default: linux)
#   bash setup.sh all                     # fetch scripts for all three OSes
#
# The scripts are placed in:
#   plugins/security-audit/os-hardening/scripts/<os>/
#
# This script is safe to re-run; it will update an existing checkout.

set -euo pipefail

UPSTREAM_REPO="https://github.com/Opsek/OSs-security"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}/scripts"
UPSTREAM_DIR="${SCRIPTS_DIR}/upstream"

TARGET="${1:-linux}"

fetch_os() {
  local os="$1"

  if [[ ! "$os" =~ ^(linux|macos|windows)$ ]]; then
    echo "Error: unknown OS target '${os}'. Must be linux, macos, or windows." >&2
    exit 1
  fi

  echo "→ Fetching OSs-security scripts for: ${os}"

  mkdir -p "${SCRIPTS_DIR}"

  if [[ -d "${UPSTREAM_DIR}/.git" ]]; then
    echo "  Updating existing checkout..."
    git -C "${UPSTREAM_DIR}" pull --quiet
  else
    echo "  Cloning upstream (sparse, depth=1)..."
    git clone \
      --depth 1 \
      --filter=blob:none \
      --sparse \
      "${UPSTREAM_REPO}" \
      "${UPSTREAM_DIR}"
  fi

  echo "  Setting sparse-checkout for '${os}'..."
  git -C "${UPSTREAM_DIR}" sparse-checkout set "${os}"

  # Symlink into the scripts root for easy access by the plugin
  local link="${SCRIPTS_DIR}/${os}"
  if [[ ! -e "${link}" ]]; then
    ln -s "${UPSTREAM_DIR}/${os}" "${link}"
    echo "  Linked: ${link} → ${UPSTREAM_DIR}/${os}"
  else
    echo "  Already linked: ${link}"
  fi

  echo "✓ Scripts ready at: ${link}"
}

if [[ "${TARGET}" == "all" ]]; then
  for os in linux macos windows; do
    fetch_os "${os}"
  done
else
  fetch_os "${TARGET}"
fi
