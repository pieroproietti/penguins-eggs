#!/usr/bin/env bash
# integration/recovery-plugin/pkm-plugin.sh
#
# penguins-powerwash plugin for penguins-kernel-manager.
# Registered as a distro-type plugin; matches all distros.
#
# Plugin contract (penguins-powerwash lib/plugin.sh):
#   PW_PLUGIN_NAME   -- unique identifier
#   PW_PLUGIN_TYPE   -- distro | filesystem | hardware
#   PW_PLUGIN_MATCH  -- regex matched against distro ID
#
# Hooks implemented:
#   pw_plugin_pre_reset()   -- snapshot kernel state before any reset
#   pw_plugin_post_reset()  -- reinstall held kernel after hard/medium reset

PW_PLUGIN_NAME="penguins-kernel-manager"
PW_PLUGIN_TYPE="distro"
PW_PLUGIN_MATCH=".*"   # matches all distros

PKM_BIN="${PKM_BIN:-penguins-kernel-manager}"

_pkm_available() { command -v "${PKM_BIN}" &>/dev/null; }

pw_plugin_pre_reset() {
    _pkm_available || return 0

    # Save the list of installed/held kernels to the powerwash state dir so
    # pw_plugin_post_reset can restore them.
    local state_file="${PW_STATE_DIR:-/var/lib/powerwash}/pkm-kernel-state.json"
    "${PKM_BIN}" list --installed --json > "${state_file}" 2>/dev/null || true
    pw_info "penguins-kernel-manager: kernel state saved to ${state_file}"
}

pw_plugin_post_reset() {
    _pkm_available || return 0

    local state_file="${PW_STATE_DIR:-/var/lib/powerwash}/pkm-kernel-state.json"
    [[ -f "${state_file}" ]] || return 0

    # Reinstall any kernels that were held before the reset.
    local held_versions
    held_versions=$(python3 -c "
import sys, json
data = json.load(open('${state_file}'))
for k in data:
    if k.get('held'):
        print(k['version'])
" 2>/dev/null || true)

    if [[ -n "${held_versions}" ]]; then
        pw_info "penguins-kernel-manager: reinstalling held kernels: ${held_versions}"
        while IFS= read -r ver; do
            pw_run "${PKM_BIN}" install "${ver}" || pw_warn "pkm: failed to reinstall ${ver}"
        done <<< "${held_versions}"
    fi
}
