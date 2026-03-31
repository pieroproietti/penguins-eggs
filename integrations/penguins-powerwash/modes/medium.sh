#!/usr/bin/env bash
# modes/medium.sh — Medium Reset
#
# Removes user-installed packages and resets user dotfiles.
# Keeps base/system packages intact. Resets APT/DNF/pacman sources
# to distribution defaults. Does NOT wipe home directory data.
#
# Inspired by: gaining/Resetter, gaining/resetter-cli, cazique/resetter-for-linux

pw_mode_medium() {
    local users=()
    local skip_backup=0
    local keep_pkgs=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --users)      IFS=',' read -ra users <<< "$2"; shift ;;
            --no-backup)  skip_backup=1 ;;
            --keep)       IFS=',' read -ra keep_pkgs <<< "$2"; shift ;;
            *) pw_die "Unknown option: $1" ;;
        esac
        shift
    done

    pw_require_root
    pw_distro_detect
    pw_fs_detect

    pw_step "Medium Reset — removing user-installed packages and resetting configs"

    # Resolve target users
    if [[ ${#users[@]} -eq 0 ]]; then
        mapfile -t users < <(
            awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' /etc/passwd
        )
    fi

    # Collect user-installed packages
    pw_step "Identifying user-installed packages"
    local user_pkgs=()
    mapfile -t user_pkgs < <(pw_pkg_list_user_installed)

    # Filter out any packages the user wants to keep
    if [[ ${#keep_pkgs[@]} -gt 0 ]]; then
        local filtered=()
        local p
        for p in "${user_pkgs[@]}"; do
            local keep=0
            local k
            for k in "${keep_pkgs[@]}"; do
                [[ "${p}" == "${k}" ]] && keep=1 && break
            done
            [[ "${keep}" -eq 0 ]] && filtered+=("${p}")
        done
        user_pkgs=("${filtered[@]}")
    fi

    pw_info "Packages to remove: ${#user_pkgs[@]}"
    if [[ "${PW_DRY_RUN}" == "1" ]] || [[ ${#user_pkgs[@]} -gt 0 ]]; then
        printf '%s\n' "${user_pkgs[@]}" | column
    fi

    # Confirm before proceeding
    if [[ "${PW_DRY_RUN}" != "1" ]]; then
        pw_confirm "Remove ${#user_pkgs[@]} packages and reset user configs?" \
            || { pw_info "Medium reset cancelled."; return 0; }
    fi

    # Backup
    if [[ "${PW_DRY_RUN}" != "1" ]] && [[ "${skip_backup}" -eq 0 ]]; then
        pw_info "Taking backup before reset..."
        pw_backup_create --users "$(IFS=','; echo "${users[*]}")"
    fi

    # Native filesystem snapshot if available
    pw_fs_snapshot_create "pre_medium_reset_$(pw_timestamp)"

    # 1. Reset package sources
    pw_apt_reset_sources   # no-op on non-apt systems

    # 2. Remove user packages
    if [[ ${#user_pkgs[@]} -gt 0 ]]; then
        pw_pkg_purge "${user_pkgs[@]}"
        pw_pkg_autoremove
        pw_pkg_clean_cache
    fi

    # 3. Reset user dotfiles (reuse soft mode logic)
    local u
    for u in "${users[@]}"; do
        _pw_soft_reset_user "${u}"
    done

    pw_info "Medium reset complete. Reboot recommended."
}
