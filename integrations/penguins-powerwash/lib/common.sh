#!/usr/bin/env bash
# lib/common.sh — shared constants, logging, and utility functions

set -euo pipefail

# ── Version ────────────────────────────────────────────────────────────────────
# shellcheck disable=SC2034  # exported constants for consumers of this library
readonly PW_VERSION="0.1.0"
# shellcheck disable=SC2034
readonly PW_NAME="Penguins Powerwash"

# ── Paths ──────────────────────────────────────────────────────────────────────
# shellcheck disable=SC2155  # readonly + subshell assignment is intentional here
readonly PW_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC2155
readonly PW_ROOT_DIR="$(cd "${PW_LIB_DIR}/.." && pwd)"
# shellcheck disable=SC2034  # exported constant for consumers
readonly PW_PLUGIN_DIR="${PW_ROOT_DIR}/plugins"
readonly PW_BACKUP_DIR="${PW_BACKUP_DIR:-/var/lib/powerwash/backups}"
readonly PW_STATE_DIR="/var/lib/powerwash"
readonly PW_LOG_FILE="${PW_LOG_FILE:-/var/log/powerwash.log}"
readonly PW_CONF_FILE="${PW_CONF_FILE:-/etc/powerwash/powerwash.conf}"

# ── Colour codes (disabled when not a tty) ────────────────────────────────────
if [[ -t 1 ]]; then
    C_RED='\033[0;31m'
    C_YEL='\033[0;33m'
    C_GRN='\033[0;32m'
    C_BLU='\033[0;34m'
    C_CYN='\033[0;36m'
    C_BLD='\033[1m'
    C_RST='\033[0m'
else
    C_RED='' C_YEL='' C_GRN='' C_BLU='' C_CYN='' C_BLD='' C_RST=''
fi

# ── Logging ────────────────────────────────────────────────────────────────────
_pw_log() {
    local level="$1"; shift
    local msg="$*"
    local ts
    ts="$(date '+%Y-%m-%d %H:%M:%S')"
    # Always write to log file if writable
    if [[ -w "$(dirname "${PW_LOG_FILE}")" ]] || [[ -w "${PW_LOG_FILE}" ]]; then
        printf '[%s] [%s] %s\n' "${ts}" "${level}" "${msg}" >> "${PW_LOG_FILE}"
    fi
    # Print to stderr for WARN/ERROR, stdout for others
    case "${level}" in
        ERROR) printf "${C_RED}[ERROR]${C_RST} %s\n" "${msg}" >&2 ;;
        WARN)  printf "${C_YEL}[WARN]${C_RST}  %s\n" "${msg}" >&2 ;;
        INFO)  printf "${C_GRN}[INFO]${C_RST}  %s\n" "${msg}" ;;
        DEBUG) [[ "${PW_DEBUG:-0}" == "1" ]] && printf "${C_CYN}[DEBUG]${C_RST} %s\n" "${msg}" ;;
        STEP)  printf "\n${C_BLD}${C_BLU}==> %s${C_RST}\n" "${msg}" ;;
    esac
}

pw_info()  { _pw_log INFO  "$@"; }
pw_warn()  { _pw_log WARN  "$@"; }
pw_error() { _pw_log ERROR "$@"; }
pw_debug() { _pw_log DEBUG "$@"; }
pw_step()  { _pw_log STEP  "$@"; }

pw_die() {
    pw_error "$@"
    exit 1
}

# ── Privilege check ────────────────────────────────────────────────────────────
pw_require_root() {
    [[ "${EUID}" -eq 0 ]] || pw_die "This operation requires root. Run with sudo."
}

# ── Dry-run gate ───────────────────────────────────────────────────────────────
# All destructive commands must go through pw_run.
# In dry-run mode it prints the command instead of executing it.
PW_DRY_RUN="${PW_DRY_RUN:-0}"

pw_run() {
    if [[ "${PW_DRY_RUN}" == "1" ]]; then
        printf "${C_YEL}[DRY-RUN]${C_RST} %s\n" "$*"
    else
        pw_debug "exec: $*"
        "$@"
    fi
}

# ── Confirmation prompt ────────────────────────────────────────────────────────
pw_confirm() {
    local prompt="${1:-Are you sure?}"
    local answer
    printf "${C_YEL}%s [y/N] ${C_RST}" "${prompt}"
    read -r answer
    [[ "${answer,,}" == "y" || "${answer,,}" == "yes" ]]
}

# ── Dependency check ───────────────────────────────────────────────────────────
pw_require_cmd() {
    local cmd
    for cmd in "$@"; do
        command -v "${cmd}" &>/dev/null || pw_die "Required command not found: ${cmd}"
    done
}

pw_has_cmd() {
    command -v "$1" &>/dev/null
}

# ── State directory bootstrap ──────────────────────────────────────────────────
pw_init_state_dir() {
    [[ -d "${PW_STATE_DIR}" ]] || pw_run mkdir -p "${PW_STATE_DIR}"
    [[ -d "${PW_BACKUP_DIR}" ]] || pw_run mkdir -p "${PW_BACKUP_DIR}"
}

# ── Timestamp helper ───────────────────────────────────────────────────────────
pw_timestamp() {
    date '+%Y%m%d_%H%M%S'
}

# ── Source a plugin safely ─────────────────────────────────────────────────────
pw_source_plugin() {
    local plugin_path="$1"
    [[ -f "${plugin_path}" ]] || pw_die "Plugin not found: ${plugin_path}"
    # shellcheck disable=SC1090
    source "${plugin_path}"
}
