#!/usr/bin/env bash
# integration/eggs-plugin/pip-hook.sh
#
# Called by penguins-eggs during ISO creation.
#
# Environment variables set by penguins-eggs:
#   EGGS_WORK       -- working directory for ISO assembly
#   EGGS_ISO_ROOT   -- root of the ISO filesystem being built
#   EGGS_ISO_FILE   -- output ISO path (empty during pre-produce)
#   EGGS_HOOK       -- hook point: "produce" | "update"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# shellcheck source=../../lib/common.sh
source "${HUB_ROOT}/lib/common.sh"
_load_conf

EGGS_ISO_ROOT="${EGGS_ISO_ROOT:?EGGS_ISO_ROOT must be set by penguins-eggs}"

_embed() {
  local daemon_bin cli_bin profiles_dir
  daemon_bin="$(_pip_daemon_bin)"
  cli_bin="$(_pip_cli_bin)"
  profiles_dir="$(_pip_profiles_dir)"

  if [[ ! -x "${daemon_bin}" ]]; then
    echo "[penguins-incus-hub] penguins-incus-daemon not found at ${daemon_bin}; skipping embed."
    return 0
  fi

  local dest_bin="${EGGS_ISO_ROOT}/usr/local/bin"
  local dest_profiles="${EGGS_ISO_ROOT}/usr/local/share/penguins-incus-platform/profiles"
  local dest_systemd="${EGGS_ISO_ROOT}/etc/systemd/system"
  mkdir -p "${dest_bin}" "${dest_profiles}" "${dest_systemd}"

  if [[ "${EMBED_DAEMON}" == "1" ]]; then
    echo "[penguins-incus-hub] Embedding penguins-incus-daemon..."
    install -m 0755 "${daemon_bin}" "${dest_bin}/penguins-incus-daemon"
  fi

  if [[ "${EMBED_CLI}" == "1" && -x "${cli_bin}" ]]; then
    echo "[penguins-incus-hub] Embedding penguins-incus CLI..."
    install -m 0755 "${cli_bin}" "${dest_bin}/penguins-incus"
  fi

  if [[ "${EMBED_PROFILES}" == "1" && -n "${profiles_dir}" ]]; then
    echo "[penguins-incus-hub] Embedding Incus profiles..."
    cp -r "${profiles_dir}/." "${dest_profiles}/"
  fi

  # Write a minimal systemd unit so the daemon starts in the live environment
  cat > "${dest_systemd}/penguins-incus-daemon.service" << 'UNIT'
[Unit]
Description=Penguins Incus Platform daemon
After=network.target incus.socket
Wants=incus.socket

[Service]
Type=simple
ExecStart=/usr/local/bin/penguins-incus-daemon
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

  # Enable the unit in the ISO's systemd preset
  local wants_dir="${EGGS_ISO_ROOT}/etc/systemd/system/multi-user.target.wants"
  mkdir -p "${wants_dir}"
  ln -sf /etc/systemd/system/penguins-incus-daemon.service \
         "${wants_dir}/penguins-incus-daemon.service" 2>/dev/null || true

  echo "[penguins-incus-hub] Embedded into ISO."
}

case "${EGGS_HOOK:-produce}" in

  produce)
    # Skip pre-produce (liveroot not yet mounted)
    if [[ -z "${EGGS_ISO_FILE:-}" ]]; then
      exit 0
    fi
    _embed
    ;;

  update)
    if [[ -z "${EGGS_ISO_FILE:-}" ]]; then
      exit 0
    fi
    _embed
    ;;

esac
