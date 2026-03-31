#!/usr/bin/env bash
# plugins/distro/ubuntu-ppa.sh — Ubuntu/Mint PPA cleanup plugin
#
# Removes all Launchpad PPAs and resets APT sources to the distribution
# default on Ubuntu, Linux Mint, and derivatives.

PW_PLUGIN_NAME="ubuntu-ppa-cleanup"
PW_PLUGIN_TYPE="distro"
PW_PLUGIN_MATCH="ubuntu|linuxmint|pop|elementary|zorin|neon"

pw_plugin_pre_reset() {
    pw_step "[ubuntu-ppa] Removing Launchpad PPAs"

    if ! pw_has_cmd add-apt-repository; then
        pw_warn "add-apt-repository not found. Install software-properties-common."
        return 0
    fi

    # List all PPAs and remove them
    local ppa_files
    mapfile -t ppa_files < <(
        find /etc/apt/sources.list.d -name "*.list" 2>/dev/null
    )

    local f
    for f in "${ppa_files[@]}"; do
        local ppa_line
        ppa_line=$(grep -m1 '^deb.*ppa.launchpad.net' "${f}" 2>/dev/null || true)
        if [[ -n "${ppa_line}" ]]; then
            # Extract ppa:user/name format
            local ppa_name
            ppa_name=$(echo "${ppa_line}" | grep -oP 'ppa\.launchpad\.net/\K[^/]+/[^/ ]+')
            if [[ -n "${ppa_name}" ]]; then
                pw_info "Removing PPA: ppa:${ppa_name}"
                pw_run add-apt-repository --remove "ppa:${ppa_name}" -y 2>/dev/null || true
            else
                pw_info "Disabling non-PPA source: ${f}"
                pw_run mv "${f}" "${f}.pw_disabled"
            fi
        fi
    done

    pw_run apt-get update -qq 2>/dev/null || true
}
