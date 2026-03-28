#!/usr/bin/env bash
# modes/soft.sh — Soft Reset
#
# Clears user configuration files (dotfiles) for all or specified users.
# Does NOT remove installed packages or touch system files.
# Safe to run on a live desktop session (though logging out first is recommended).
#
# Inspired by: cazique/resetter-for-linux (soft reset concept)

pw_mode_soft() {
    local users=()
    local skip_backup=0

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --users)      IFS=',' read -ra users <<< "$2"; shift ;;
            --no-backup)  skip_backup=1 ;;
            *) pw_die "Unknown option: $1" ;;
        esac
        shift
    done

    pw_require_root
    pw_distro_detect
    pw_fs_detect

    pw_step "Soft Reset — clearing user configuration files"
    pw_info "Packages and system files are NOT affected."

    # Resolve target users
    if [[ ${#users[@]} -eq 0 ]]; then
        mapfile -t users < <(
            awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' /etc/passwd
        )
    fi

    [[ ${#users[@]} -gt 0 ]] || pw_die "No user accounts found."

    pw_info "Target users: ${users[*]}"

    if [[ "${PW_DRY_RUN}" != "1" ]] && [[ "${skip_backup}" -eq 0 ]]; then
        pw_info "Taking backup before reset..."
        pw_backup_create --users "$(IFS=','; echo "${users[*]}")"
    fi

    local u
    for u in "${users[@]}"; do
        _pw_soft_reset_user "${u}"
    done

    pw_info "Soft reset complete. Log out and back in for changes to take effect."
}

_pw_soft_reset_user() {
    local user="$1"
    local home
    home=$(getent passwd "${user}" | cut -d: -f6)

    [[ -d "${home}" ]] || { pw_warn "Home directory not found for ${user}: ${home}"; return; }

    pw_step "Resetting dotfiles for user: ${user} (${home})"

    # Dotfiles and dotdirs to clear — covers the most common desktop environments
    local dotfiles=(
        # Shell configs
        .bashrc .bash_profile .bash_logout .bash_history
        .zshrc .zsh_history .zprofile .zshenv
        .profile
        # Desktop environments
        .config/dconf
        .config/gtk-3.0 .config/gtk-4.0
        .config/plasma-workspace .config/plasmashellrc
        .config/kdedefaults
        .config/gnome-session
        .gconf .gnome .gnome2
        # Application caches and state
        .cache
        .local/share/recently-used.xbel
        .local/share/Trash
        # Misc
        .thumbnails
        .xsession-errors
    )

    local item
    for item in "${dotfiles[@]}"; do
        local target="${home}/${item}"
        if [[ -e "${target}" || -L "${target}" ]]; then
            pw_debug "Removing: ${target}"
            pw_run rm -rf "${target}"
        fi
    done

    # Restore skeleton files so the user gets a clean default shell config
    if [[ -d /etc/skel ]]; then
        pw_run cp -rn /etc/skel/. "${home}/" 2>/dev/null || true
        pw_run chown -R "${user}:" "${home}"
    fi

    pw_info "Dotfiles cleared for ${user}."
}
