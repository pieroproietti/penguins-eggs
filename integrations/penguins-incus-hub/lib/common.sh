#!/usr/bin/env bash
# lib/common.sh — shared helpers for penguins-incus-hub hook scripts

set -euo pipefail

HUB_CONF="${HUB_CONF:-/etc/penguins-incus-hub/eggs-hooks.conf}"

# Load configuration, falling back to defaults
_load_conf() {
  PIP_ROOT="/usr/lib/penguins-incus-platform"
  EMBED_DAEMON=1
  EMBED_CLI=1
  EMBED_PROFILES=1
  PRE_RESET_SNAPSHOT=1
  POST_HARD_RESET_RESTART=1

  if [[ -f "${HUB_CONF}" ]]; then
    # shellcheck source=/dev/null
    source "${HUB_CONF}"
  fi
}

# Resolve the penguins-incus-daemon binary
_pip_daemon_bin() {
  command -v penguins-incus-daemon 2>/dev/null \
    || echo "${PIP_ROOT}/bin/penguins-incus-daemon"
}

# Resolve the penguins-incus CLI binary
_pip_cli_bin() {
  command -v penguins-incus 2>/dev/null \
    || echo "${PIP_ROOT}/bin/penguins-incus"
}

# Resolve the bundled profiles directory
_pip_profiles_dir() {
  local candidates=(
    "${PIP_ROOT}/profiles"
    "/usr/share/penguins-incus-platform/profiles"
  )
  for d in "${candidates[@]}"; do
    [[ -d "${d}" ]] && echo "${d}" && return
  done
  echo ""
}

# Snapshot all running Incus instances (best-effort; never fails the hook)
snapshot_running_instances() {
  local label="${1:-pre-eggs-hook}"
  local cli
  cli="$(_pip_cli_bin)"

  if [[ ! -x "${cli}" ]]; then
    echo "[penguins-incus-hub] penguins-incus CLI not found; skipping snapshot."
    return 0
  fi

  local instances
  instances="$("${cli}" container list --format json 2>/dev/null \
    | python3 -c "import sys,json; [print(i['name']) for i in json.load(sys.stdin) if i.get('status')=='Running']" \
    2>/dev/null || true)"

  for name in ${instances}; do
    echo "[penguins-incus-hub] Snapshotting container ${name}..."
    "${cli}" snapshot create "${name}" "${label}-$(date +%Y%m%dT%H%M%S)" 2>/dev/null || true
  done

  local vms
  vms="$("${cli}" vm list --format json 2>/dev/null \
    | python3 -c "import sys,json; [print(i['name']) for i in json.load(sys.stdin) if i.get('status')=='Running']" \
    2>/dev/null || true)"

  for name in ${vms}; do
    echo "[penguins-incus-hub] Snapshotting VM ${name}..."
    "${cli}" snapshot create "${name}" "${label}-$(date +%Y%m%dT%H%M%S)" 2>/dev/null || true
  done
}
