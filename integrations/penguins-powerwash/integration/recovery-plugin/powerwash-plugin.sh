#!/usr/bin/env bash
# integration/recovery-plugin/powerwash-plugin.sh
#
# penguins-recovery plugin for penguins-powerwash.
# Registered as a distro-type plugin; matches all distros.
#
# This plugin is the inbound side: penguins-recovery loads it so that
# recovery-aware operations can invoke powerwash where appropriate.
#
# Plugin contract (penguins-powerwash lib/plugin.sh):
#   PW_PLUGIN_NAME   -- unique identifier
#   PW_PLUGIN_TYPE   -- distro | filesystem | hardware
#   PW_PLUGIN_MATCH  -- regex matched against distro ID

# shellcheck disable=SC2034  # plugin metadata read by the powerwash plugin loader
PW_PLUGIN_NAME="penguins-powerwash-self"
PW_PLUGIN_TYPE="distro"
PW_PLUGIN_MATCH=".*"   # matches all distros

PW_SELF_BIN="${PW_SELF_BIN:-penguins-powerwash}"

_pw_self_available() { command -v "${PW_SELF_BIN}" &>/dev/null; }

pw_plugin_pre_reset() {
    # penguins-powerwash IS the reset tool; no pre-action needed from itself.
    :
}

pw_plugin_post_reset() {
    # After any reset, confirm the system is in a clean state by running info.
    _pw_self_available || return 0
    pw_info "penguins-powerwash: post-reset system state:"
    "${PW_SELF_BIN}" info 2>/dev/null || true
}
