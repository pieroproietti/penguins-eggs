#!/usr/bin/env bash
# modes/sysprep.sh — OEM Sysprep Mode
#
# Prepares a Linux installation for disk imaging / cloning by removing all
# machine-specific identifiers. When the cloned image boots on a new machine,
# it generates fresh identifiers on first boot.
#
# Equivalent to Windows Sysprep /generalize. Safe to run on embedded,
# cloud, and desktop images before distribution.
#
# Inspired by: thekaleabsamuel/oem-sysprep, sgnconnects/Linux-factory-reset

pw_mode_sysprep() {
    local shutdown_after=0
    local skip_backup=0

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --shutdown)   shutdown_after=1 ;;
            --no-backup)  skip_backup=1 ;;
            *) pw_die "Unknown option: $1" ;;
        esac
        shift
    done

    pw_require_root
    pw_distro_detect

    pw_step "Sysprep — generalizing system for imaging"
    pw_warn "After sysprep, this system will regenerate identifiers on next boot."
    pw_warn "Do NOT boot this system after sysprep if you intend to clone the image."

    if [[ "${PW_DRY_RUN}" != "1" ]]; then
        pw_confirm "Proceed with sysprep?" \
            || { pw_info "Sysprep cancelled."; return 0; }
    fi

    if [[ "${PW_DRY_RUN}" != "1" ]] && [[ "${skip_backup}" -eq 0 ]]; then
        pw_backup_create --no-home
    fi

    _pw_sysprep_machine_id
    _pw_sysprep_ssh_host_keys
    _pw_sysprep_network
    _pw_sysprep_cloud_init
    _pw_sysprep_logs
    _pw_sysprep_tmp
    _pw_sysprep_package_cache
    _pw_sysprep_firstboot_service

    pw_info "Sysprep complete."

    if [[ "${shutdown_after}" -eq 1 ]] && [[ "${PW_DRY_RUN}" != "1" ]]; then
        pw_info "Shutting down in 5 seconds..."
        sleep 5
        shutdown -h now
    else
        pw_info "Power off this machine before imaging. Do not reboot."
    fi
}

# ── Sysprep steps ──────────────────────────────────────────────────────────────

_pw_sysprep_machine_id() {
    pw_step "Clearing machine-id"
    # Truncate to empty — systemd regenerates on next boot
    pw_run truncate -s 0 /etc/machine-id
    # DBus machine-id (may be a symlink to /etc/machine-id)
    if [[ -f /var/lib/dbus/machine-id ]] && [[ ! -L /var/lib/dbus/machine-id ]]; then
        pw_run truncate -s 0 /var/lib/dbus/machine-id
    fi
}

_pw_sysprep_ssh_host_keys() {
    pw_step "Removing SSH host keys"
    pw_run rm -f /etc/ssh/ssh_host_*
    # On next boot, sshd (or ssh-keygen via firstboot) regenerates them.
    # We install a firstboot service to handle this — see _pw_sysprep_firstboot_service.
}

_pw_sysprep_network() {
    pw_step "Clearing network configuration"

    # Remove NetworkManager persistent connections
    if [[ -d /etc/NetworkManager/system-connections ]]; then
        pw_run find /etc/NetworkManager/system-connections -type f -delete
    fi

    # Remove systemd-networkd leases
    if [[ -d /var/lib/systemd/network ]]; then
        pw_run find /var/lib/systemd/network -name "*.lease" -delete
    fi

    # Remove dhclient leases
    pw_run find /var/lib/dhcp -name "*.leases" -delete 2>/dev/null || true
    pw_run find /var/lib/dhclient -name "*.leases" -delete 2>/dev/null || true

    # Remove udev persistent net rules (old-style)
    pw_run rm -f /etc/udev/rules.d/70-persistent-net.rules

    # Reset hostname
    pw_run truncate -s 0 /etc/hostname
    if pw_has_cmd hostnamectl; then
        pw_run hostnamectl set-hostname ""
    fi
}

_pw_sysprep_cloud_init() {
    pw_step "Resetting cloud-init state"
    if pw_has_cmd cloud-init; then
        pw_run cloud-init clean --logs 2>/dev/null || true
    fi
    # Remove cloud-init instance data
    pw_run rm -rf /var/lib/cloud/instances
    pw_run rm -rf /var/lib/cloud/instance
}

_pw_sysprep_logs() {
    pw_step "Clearing logs"
    if pw_has_cmd journalctl; then
        pw_run journalctl --rotate 2>/dev/null || true
        pw_run journalctl --vacuum-time=1s 2>/dev/null || true
    fi
    pw_run find /var/log -type f \
        \( -name "*.log" -o -name "*.gz" -o -name "*.1" -o -name "*.old" \) \
        -delete 2>/dev/null || true
    pw_run find /var/log -type f -exec truncate -s 0 {} \; 2>/dev/null || true
}

_pw_sysprep_tmp() {
    pw_step "Clearing temporary files"
    pw_run find /tmp /var/tmp -mindepth 1 -delete 2>/dev/null || true
}

_pw_sysprep_package_cache() {
    pw_step "Clearing package cache"
    pw_pkg_clean_cache
}

# Install a one-shot systemd service that regenerates machine-specific
# identifiers on the first boot of the cloned image.
_pw_sysprep_firstboot_service() {
    pw_step "Installing firstboot regeneration service"

    local service_file="/etc/systemd/system/powerwash-firstboot.service"

    pw_run tee "${service_file}" > /dev/null <<'EOF'
[Unit]
Description=Penguins Powerwash — first-boot identity regeneration
DefaultDependencies=no
After=local-fs.target
Before=network.target sysinit.target
ConditionPathExists=!/var/lib/powerwash/.firstboot-done

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/bash -c '\
    systemd-machine-id-setup; \
    dbus-uuidgen --ensure=/var/lib/dbus/machine-id 2>/dev/null || true; \
    ssh-keygen -A; \
    hostname $(cat /etc/hostname 2>/dev/null || echo linux); \
    mkdir -p /var/lib/powerwash && touch /var/lib/powerwash/.firstboot-done'

[Install]
WantedBy=sysinit.target
EOF

    if [[ "${PW_DRY_RUN}" != "1" ]]; then
        pw_run systemctl enable powerwash-firstboot.service 2>/dev/null || true
    fi

    pw_info "First-boot service installed: ${service_file}"
}
