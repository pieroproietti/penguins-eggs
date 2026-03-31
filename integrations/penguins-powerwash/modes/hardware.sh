#!/usr/bin/env bash
# modes/hardware.sh — Hardware Device Reset
#
# Resets hardware devices via sysfs unbind/rebind (for USB/PCI devices)
# and via the vendor-reset kernel module (for GPUs requiring complex
# vendor-specific reset sequences).
#
# Inspired by: bulletmark/rebind-devices, gnif/vendor-reset

pw_mode_hardware() {
    local subcommand="${1:-help}"
    shift || true

    case "${subcommand}" in
        rebind)        pw_hw_rebind "$@" ;;
        vendor-reset)  pw_hw_vendor_reset "$@" ;;
        list)          pw_hw_list_devices "$@" ;;
        help|--help|-h) _pw_hw_usage ;;
        *) pw_die "Unknown hardware subcommand: ${subcommand}. Run 'powerwash hardware help'." ;;
    esac
}

_pw_hw_usage() {
    cat <<EOF
Usage: powerwash hardware <subcommand> [options]

Subcommands:
  list                     List PCI and USB devices with their sysfs BUS IDs
  rebind <bus-id> [...]    Unbind and rebind one or more devices by sysfs BUS ID
  vendor-reset <pci-id>    Trigger a vendor-specific GPU reset via vendor-reset module

Examples:
  powerwash hardware list
  powerwash hardware rebind 0000:00:14.0
  powerwash hardware vendor-reset 0000:01:00.0
EOF
}

# ── Device listing ─────────────────────────────────────────────────────────────

pw_hw_list_devices() {
    pw_step "PCI devices"
    if pw_has_cmd lspci; then
        lspci -D | awk '{printf "  %-15s %s\n", $1, substr($0, index($0,$2))}'
    else
        pw_warn "lspci not found. Install pciutils."
    fi

    pw_step "USB devices"
    if pw_has_cmd lsusb; then
        lsusb
    else
        pw_warn "lsusb not found. Install usbutils."
    fi

    pw_step "Sysfs BUS IDs (for use with 'rebind')"
    find /sys/bus/pci/devices/ -maxdepth 1 -type l | while read -r dev; do
        local id
        id=$(basename "${dev}")
        local driver
        driver=$(readlink "${dev}/driver" 2>/dev/null | xargs basename 2>/dev/null || echo "none")
        printf "  %-15s driver=%-20s\n" "${id}" "${driver}"
    done
}

# ── Sysfs rebind (USB/PCI) ─────────────────────────────────────────────────────
# Writes the BUS ID to the driver's unbind file, then to bind.
# This is the same mechanism used by bulletmark/rebind-devices.

pw_hw_rebind() {
    [[ $# -gt 0 ]] || pw_die "Usage: powerwash hardware rebind <bus-id> [bus-id ...]"
    pw_require_root

    local bus_id
    for bus_id in "$@"; do
        _pw_hw_rebind_device "${bus_id}"
    done
}

_pw_hw_rebind_device() {
    local bus_id="$1"

    # Locate the device in sysfs
    local dev_path
    dev_path=$(find /sys/bus/pci/devices /sys/bus/usb/devices \
        -maxdepth 1 -name "${bus_id}" -type l 2>/dev/null | head -1)

    if [[ -z "${dev_path}" ]]; then
        pw_error "Device not found in sysfs: ${bus_id}"
        pw_info  "Run 'powerwash hardware list' to see available BUS IDs."
        return 1
    fi

    # Resolve the driver
    local driver_path
    driver_path=$(readlink "${dev_path}/driver" 2>/dev/null || true)

    if [[ -z "${driver_path}" ]]; then
        pw_warn "Device ${bus_id} has no driver bound. Attempting bind only."
        _pw_hw_bind "${bus_id}" "${dev_path}"
        return
    fi

    local driver_dir
    driver_dir=$(realpath "${dev_path}/driver")

    pw_step "Rebinding device: ${bus_id} (driver: $(basename "${driver_dir}"))"

    # Unbind
    pw_run bash -c "echo '${bus_id}' > '${driver_dir}/unbind'"
    sleep 0.5

    # Bind
    pw_run bash -c "echo '${bus_id}' > '${driver_dir}/bind'"
    sleep 0.5

    pw_info "Device ${bus_id} rebound successfully."
}

_pw_hw_bind() {
    local bus_id="$1"
    local dev_path="$2"

    # Try to find a suitable driver via modalias
    local modalias
    modalias=$(cat "${dev_path}/modalias" 2>/dev/null || true)
    if [[ -n "${modalias}" ]]; then
        pw_run modprobe "${modalias}" 2>/dev/null || true
        sleep 1
        pw_info "Attempted driver load for ${bus_id} via modalias."
    else
        pw_warn "Cannot determine driver for ${bus_id}. Manual intervention required."
    fi
}

# ── Vendor-reset (GPU) ─────────────────────────────────────────────────────────
# Interfaces with the gnif/vendor-reset kernel module via its ioctl interface.
# The module must be loaded (modprobe vendor-reset) before calling this.

pw_hw_vendor_reset() {
    local pci_id="${1:-}"
    [[ -n "${pci_id}" ]] || pw_die "Usage: powerwash hardware vendor-reset <pci-id>"
    pw_require_root

    # Check if vendor-reset module is loaded
    if ! lsmod 2>/dev/null | grep -q "^vendor_reset"; then
        pw_warn "vendor-reset kernel module is not loaded."
        pw_info "Attempting to load it now..."
        pw_run modprobe vendor-reset \
            || pw_die "Failed to load vendor-reset. Install it via DKMS: https://github.com/gnif/vendor-reset"
    fi

    # The vendor-reset module exposes /dev/vendor-reset
    local dev_node="/dev/vendor-reset"
    if [[ ! -c "${dev_node}" ]]; then
        pw_die "vendor-reset device node not found: ${dev_node}. Is the module loaded?"
    fi

    pw_step "Triggering vendor reset for PCI device: ${pci_id}"

    # Use the userspace helper from vendor-reset if available
    if pw_has_cmd vendor-reset; then
        pw_run vendor-reset "${pci_id}"
    else
        # Fall back to the ioctl via the bundled helper
        local helper="${PW_ROOT_DIR}/contrib/vendor-reset-helper"
        if [[ -x "${helper}" ]]; then
            pw_run "${helper}" "${pci_id}"
        else
            pw_warn "vendor-reset userspace helper not found."
            pw_info "Install vendor-reset from: https://github.com/gnif/vendor-reset"
            pw_info "Or use: modprobe vendor-reset && echo '${pci_id}' > /sys/bus/pci/devices/${pci_id}/reset"
            # Attempt basic sysfs reset as fallback
            local reset_file="/sys/bus/pci/devices/${pci_id}/reset"
            if [[ -f "${reset_file}" ]]; then
                pw_run bash -c "echo 1 > '${reset_file}'"
                pw_info "Basic PCI reset triggered for ${pci_id}."
            else
                pw_die "No reset mechanism available for ${pci_id}."
            fi
        fi
    fi

    pw_info "Vendor reset complete for ${pci_id}."
}
