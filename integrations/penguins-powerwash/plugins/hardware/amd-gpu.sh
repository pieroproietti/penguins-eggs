#!/usr/bin/env bash
# plugins/hardware/amd-gpu.sh — AMD GPU vendor-reset plugin
#
# Detects AMD GPUs that require vendor-specific reset sequences and
# ensures the vendor-reset kernel module is loaded before any VFIO
# passthrough or re-initialization operation.
#
# Supported families: Polaris 10/11/12, Vega 10/20, Navi 10/12/14
# Reference: gnif/vendor-reset

PW_PLUGIN_NAME="amd-gpu-vendor-reset"
PW_PLUGIN_TYPE="hardware"
PW_PLUGIN_MATCH="always"

# Known AMD PCI device IDs that require vendor-reset
# Format: "vendor:device"
_PW_AMD_VENDOR_RESET_IDS=(
    # Polaris 10 (RX 470/480/570/580/590)
    "1002:67df" "1002:67ef"
    # Polaris 11 (RX 460/560)
    "1002:67ff"
    # Polaris 12 (RX 540/550)
    "1002:699f"
    # Vega 10 (Vega 56/64/FE)
    "1002:687f"
    # Vega 20 (Radeon VII / Instinct MI100)
    "1002:66af"
    # Navi 10 (RX 5600XT/5700/5700XT)
    "1002:731f"
    # Navi 12 (Pro 5600M)
    "1002:7360"
    # Navi 14 (RX 5300/5500XT)
    "1002:7340"
)

pw_plugin_pre_reset() {
    _pw_amd_check_and_load
}

_pw_amd_check_and_load() {
    # Only act if lspci is available
    pw_has_cmd lspci || return 0

    local found_ids=()
    local vid_did

    for vid_did in "${_PW_AMD_VENDOR_RESET_IDS[@]}"; do
        local vendor="${vid_did%%:*}"
        local device="${vid_did##*:}"
        if lspci -d "${vendor}:${device}" 2>/dev/null | grep -q .; then
            found_ids+=("${vid_did}")
        fi
    done

    if [[ ${#found_ids[@]} -eq 0 ]]; then
        pw_debug "[amd-gpu] No AMD GPUs requiring vendor-reset detected."
        return 0
    fi

    pw_step "[amd-gpu] Detected AMD GPU(s) requiring vendor-reset: ${found_ids[*]}"

    # Check if vendor-reset module is loaded
    if lsmod 2>/dev/null | grep -q "^vendor_reset"; then
        pw_info "[amd-gpu] vendor-reset module already loaded."
        return 0
    fi

    pw_info "[amd-gpu] Loading vendor-reset kernel module..."
    if pw_run modprobe vendor-reset 2>/dev/null; then
        pw_info "[amd-gpu] vendor-reset loaded successfully."
    else
        pw_warn "[amd-gpu] Could not load vendor-reset module."
        pw_warn "Install it via DKMS: https://github.com/gnif/vendor-reset"
        pw_warn "Then add 'vendor-reset' to /etc/modules for automatic loading."
    fi
}
