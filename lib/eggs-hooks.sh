#!/usr/bin/env bash
# lib/eggs-hooks.sh — outbound hooks for penguins-eggs and penguins-recovery
#
# Sourced by bin/penguins-powerwash after lib/common.sh.
# All functions are no-ops when the respective binaries are absent.

# ── Configuration ─────────────────────────────────────────────────────────────
# Defaults; override in /etc/penguins-powerwash/eggs-hooks.conf
PW_EGGS_BIN="${PW_EGGS_BIN:-eggs}"
PW_RECOVERY_BIN="${PW_RECOVERY_BIN:-penguins-recovery}"
PW_PRE_RESET_SNAPSHOT="${PW_PRE_RESET_SNAPSHOT:-1}"
PW_PRE_RESET_EGGS_PRODUCE="${PW_PRE_RESET_EGGS_PRODUCE:-0}"
PW_POST_HARD_RESET_ADAPT="${PW_POST_HARD_RESET_ADAPT:-1}"

# Load site config if present
[[ -f /etc/penguins-powerwash/eggs-hooks.conf ]] && \
  source /etc/penguins-powerwash/eggs-hooks.conf

_pw_eggs_available()    { [[ -n "${PW_EGGS_BIN}" ]]     && command -v "${PW_EGGS_BIN}"     &>/dev/null; }
_pw_recovery_available(){ [[ -n "${PW_RECOVERY_BIN}" ]] && command -v "${PW_RECOVERY_BIN}" &>/dev/null; }

# ── pw_eggs_pre_reset ─────────────────────────────────────────────────────────
# Called before any reset mode runs.
# $1 = reset mode (soft | medium | hard | sysprep)
pw_eggs_pre_reset() {
    local mode="${1:-unknown}"

    # 1. Create a penguins-recovery snapshot so the user can roll back
    if [[ "${PW_PRE_RESET_SNAPSHOT}" == "1" ]] && _pw_recovery_available; then
        # shellcheck disable=SC2155  # date subshell in local assignment is intentional
        local label="pre-powerwash-${mode}-$(date +%Y%m%d_%H%M%S)"
        pw_info "penguins-recovery: creating snapshot '${label}' before ${mode} reset..."
        pw_run "${PW_RECOVERY_BIN}" snapshot create "${label}" || \
            pw_warn "penguins-recovery: snapshot failed (continuing reset)"
    fi

    # 2. Optionally produce a naked eggs ISO as a full system snapshot
    if [[ "${PW_PRE_RESET_EGGS_PRODUCE}" == "1" ]] && _pw_eggs_available; then
        pw_info "penguins-eggs: producing naked ISO snapshot before ${mode} reset..."
        pw_run "${PW_EGGS_BIN}" produce --naked --basename "pre-${mode}-reset" || \
            pw_warn "penguins-eggs: produce failed (continuing reset)"
    fi
}

# ── pw_eggs_post_reset ────────────────────────────────────────────────────────
# Called after a reset mode completes successfully.
# $1 = reset mode
pw_eggs_post_reset() {
    local mode="${1:-unknown}"

    # After hard/sysprep reset, re-layer recovery tools onto the clean system
    if [[ "${PW_POST_HARD_RESET_ADAPT}" == "1" ]] && \
       [[ "${mode}" == "hard" || "${mode}" == "sysprep" ]] && \
       _pw_recovery_available; then
        pw_info "penguins-recovery: re-layering recovery tools after ${mode} reset..."
        pw_run "${PW_RECOVERY_BIN}" adapter.sh || \
            pw_warn "penguins-recovery: adapter failed (recovery tools may be missing)"
    fi
}

# ── pw_eggs_pre_backup ────────────────────────────────────────────────────────
# Called before a backup is created.
pw_eggs_pre_backup() {
    # Nothing to do outbound; penguins-recovery's own pre_backup hook handles snapshots.
    :
}

# ── pw_eggs_post_backup ───────────────────────────────────────────────────────
# Called after a backup is created successfully.
# $1 = path to the backup archive
pw_eggs_post_backup() {
    local backup_path="${1:-}"
    if _pw_eggs_available && [[ -n "${backup_path}" ]]; then
        pw_debug "penguins-eggs: recording backup path '${backup_path}' for next ISO manifest"
        # Write a breadcrumb that the eggs pkm-hook picks up during `eggs produce`
        local state_dir="/var/lib/penguins-powerwash"
        mkdir -p "${state_dir}"
        printf '%s\n' "${backup_path}" > "${state_dir}/last-backup-path"
    fi
}
