#!/usr/bin/env bash
# integration/recovery-plugin/pif-plugin.sh
#
# penguins-powerwash plugin for penguins-immutable-framework.
# Registered as a distro-type plugin; matches all distros.
#
# Hooks:
#   pw_plugin_pre_reset()   -- exit mutable mode before a factory reset
#   pw_plugin_post_reset()  -- re-initialise the PIF backend after a hard reset

PW_PLUGIN_NAME="penguins-immutable-framework"
PW_PLUGIN_TYPE="distro"
PW_PLUGIN_MATCH=".*"   # matches all distros

PIF_BIN="${PIF_BIN:-pif}"

_pif_available() { command -v "${PIF_BIN}" &>/dev/null; }

pw_plugin_pre_reset() {
    _pif_available || return 0

    # If the system is in mutable mode, exit it cleanly before the reset
    # so the filesystem is in a consistent immutable state.
    STATUS=$("${PIF_BIN}" status --json 2>/dev/null)
    MUTABLE=$(echo "${STATUS}" | python3 -c \
      "import sys,json; d=json.load(sys.stdin); print(d.get('mutable', False))" 2>/dev/null || echo "False")

    if [[ "${MUTABLE}" == "True" ]]; then
        pw_info "penguins-immutable-framework: exiting mutable mode before reset..."
        pw_run "${PIF_BIN}" mutable exit || \
            pw_warn "pif: mutable exit failed — reset continuing anyway"
    fi
}

pw_plugin_post_reset() {
    _pif_available || return 0

    # After a hard or sysprep reset the PIF backend state may be stale.
    # Re-run init with the existing config to restore the immutable setup.
    local cfg="/etc/pif/pif.toml"
    if [[ -f "${cfg}" ]]; then
        pw_info "penguins-immutable-framework: re-initialising backend after reset..."
        pw_run "${PIF_BIN}" init --config "${cfg}" || \
            pw_warn "pif: re-init failed — run 'pif init' manually"
    else
        pw_warn "penguins-immutable-framework: no pif.toml found after reset — run 'pif init' manually"
    fi
}
