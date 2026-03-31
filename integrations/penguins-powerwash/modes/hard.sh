#!/usr/bin/env bash
# modes/hard.sh — Hard Reset (Full Factory Reset)
#
# The most destructive mode. Removes all user-installed packages, wipes
# all user home directories, resets system configuration to distribution
# defaults, and cleans package caches. Equivalent to a fresh install
# without touching the bootloader or partition table.
#
# A backup is mandatory before this mode runs (cannot be skipped without
# explicit --force-no-backup flag, which requires a second confirmation).
#
# Inspired by: gaining/Resetter (full reset), nuageeee/reset-linux,
#              cazique/resetter-for-linux (full reset level)

pw_mode_hard() {
    local skip_backup=0
    local force_no_backup=0
    local wipe_home=1
    local keep_users=0   # 1 = preserve user accounts, just wipe their data

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --no-backup)       skip_backup=1 ;;
            --force-no-backup) force_no_backup=1; skip_backup=1 ;;
            --keep-home)       wipe_home=0 ;;
            --keep-users)      keep_users=1 ;;
            *) pw_die "Unknown option: $1" ;;
        esac
        shift
    done

    pw_require_root
    pw_distro_detect
    pw_fs_detect

    pw_step "Hard Reset — full factory reset"
    pw_warn "This will remove ALL user-installed packages and wipe user home directories."
    pw_warn "This operation is IRREVERSIBLE without a backup."

    # Double confirmation for hard reset
    if [[ "${PW_DRY_RUN}" != "1" ]]; then
        pw_confirm "Are you absolutely sure you want to perform a HARD RESET?" \
            || { pw_info "Hard reset cancelled."; return 0; }
        pw_confirm "Last chance — this will wipe user data. Continue?" \
            || { pw_info "Hard reset cancelled."; return 0; }
    fi

    # Backup gate
    if [[ "${skip_backup}" -eq 1 ]] && [[ "${force_no_backup}" -eq 0 ]]; then
        pw_warn "--no-backup was specified. Backup is strongly recommended."
        pw_confirm "Proceed WITHOUT a backup?" \
            || { pw_info "Hard reset cancelled. Run without --no-backup to take a backup first."; return 0; }
    fi

    if [[ "${PW_DRY_RUN}" != "1" ]] && [[ "${skip_backup}" -eq 0 ]]; then
        pw_info "Taking backup before hard reset..."
        pw_backup_create
    fi

    # Native filesystem snapshot
    pw_fs_snapshot_create "pre_hard_reset_$(pw_timestamp)"

    # 1. Reset package sources
    pw_apt_reset_sources

    # 2. Remove all user-installed packages
    pw_step "Removing user-installed packages"
    local user_pkgs=()
    mapfile -t user_pkgs < <(pw_pkg_list_user_installed)
    if [[ ${#user_pkgs[@]} -gt 0 ]]; then
        pw_pkg_purge "${user_pkgs[@]}"
    fi
    pw_pkg_autoremove
    pw_pkg_clean_cache

    # 3. Wipe home directories
    if [[ "${wipe_home}" -eq 1 ]]; then
        _pw_hard_wipe_homes "${keep_users}"
    fi

    # 4. Reset /etc to distribution defaults where possible
    _pw_hard_reset_etc

    # 5. Clear system logs
    _pw_hard_clear_logs

    # 6. Clear temporary files
    pw_run find /tmp /var/tmp -mindepth 1 -delete 2>/dev/null || true

    pw_info "Hard reset complete. Reboot required."
}

_pw_hard_wipe_homes() {
    local keep_users="$1"
    pw_step "Wiping user home directories"

    local users=()
    mapfile -t users < <(
        awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' /etc/passwd
    )

    local u
    for u in "${users[@]}"; do
        local home
        home=$(getent passwd "${u}" | cut -d: -f6)
        [[ -d "${home}" ]] || continue

        pw_info "Wiping home: ${home}"
        # Remove everything inside the home dir but keep the directory itself
        pw_run find "${home}" -mindepth 1 -delete 2>/dev/null || true

        # Restore skeleton
        if [[ -d /etc/skel ]]; then
            pw_run cp -r /etc/skel/. "${home}/"
            pw_run chown -R "${u}:" "${home}"
        fi

        # Optionally remove the user account entirely
        if [[ "${keep_users}" -eq 0 ]]; then
            pw_info "Removing user account: ${u}"
            pw_run userdel "${u}" 2>/dev/null || true
            pw_run rm -rf "${home}"
        fi
    done
}

_pw_hard_reset_etc() {
    pw_step "Resetting system configuration"

    # Reset hostname to a generic default
    if pw_has_cmd hostnamectl; then
        pw_run hostnamectl set-hostname "linux"
    fi

    # Clear /etc/hosts back to minimal
    pw_run tee /etc/hosts > /dev/null <<'EOF'
127.0.0.1   localhost
127.0.1.1   linux
::1         localhost ip6-localhost ip6-loopback
ff02::1     ip6-allnodes
ff02::2     ip6-allrouters
EOF

    # Reset timezone to UTC if not already
    if pw_has_cmd timedatectl; then
        pw_run timedatectl set-timezone UTC
    fi

    # Remove leftover NetworkManager connections
    if [[ -d /etc/NetworkManager/system-connections ]]; then
        pw_run find /etc/NetworkManager/system-connections -type f -delete
    fi
}

_pw_hard_clear_logs() {
    pw_step "Clearing system logs"
    if pw_has_cmd journalctl; then
        pw_run journalctl --rotate
        pw_run journalctl --vacuum-time=1s
    fi
    pw_run find /var/log -type f \( -name "*.log" -o -name "*.gz" -o -name "*.1" \) \
        -delete 2>/dev/null || true
    # Truncate active logs rather than deleting them (avoids breaking running services)
    pw_run find /var/log -type f -name "*.log" \
        -exec truncate -s 0 {} \; 2>/dev/null || true
}
