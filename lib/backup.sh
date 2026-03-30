#!/usr/bin/env bash
# lib/backup.sh — pre-reset backup subsystem
#
# Creates a timestamped backup archive before any destructive operation.
# Supports optional GPG symmetric encryption. Backup is always taken
# before a reset; the reset refuses to proceed if backup fails.

# ── Backup manifest ────────────────────────────────────────────────────────────
# Each backup directory contains:
#   manifest.txt       — metadata (timestamp, distro, fs type, mode)
#   packages.list      — user-installed package names
#   repos/             — package repository configs
#   home/              — tar.gz of selected home directories
#   system/            — /etc snapshot (tar.gz)
#   fstab              — copy of /etc/fstab
#   crontabs/          — per-user crontab exports
#   docker/            — docker image/volume lists (if docker present)
#   grub/              — grub config backup

# ── Entry point ────────────────────────────────────────────────────────────────

# Create a full pre-reset backup.
# Usage: pw_backup_create [--encrypt] [--dest <dir>] [--users <u1,u2,...>]
pw_backup_create() {
    local encrypt=0
    local dest="${PW_BACKUP_DIR}"
    local users=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --encrypt)        encrypt=1 ;;
            --dest)           dest="$2"; shift ;;
            --users)          IFS=',' read -ra users <<< "$2"; shift ;;
            *) pw_die "Unknown backup option: $1" ;;
        esac
        shift
    done

    pw_require_root
    pw_init_state_dir

    local ts
    ts=$(pw_timestamp)
    local backup_dir="${dest}/backup_${ts}"

    pw_step "Creating backup: ${backup_dir}"
    pw_run mkdir -p "${backup_dir}"/{repos,home,system,crontabs,docker,grub}

    _pw_backup_manifest  "${backup_dir}" "${ts}"
    _pw_backup_packages  "${backup_dir}"
    _pw_backup_repos     "${backup_dir}"
    _pw_backup_home      "${backup_dir}" "${users[@]+"${users[@]}"}"
    _pw_backup_system    "${backup_dir}"
    _pw_backup_fstab     "${backup_dir}"
    _pw_backup_crontabs  "${backup_dir}"
    _pw_backup_docker    "${backup_dir}"
    _pw_backup_grub      "${backup_dir}"

    if [[ "${encrypt}" -eq 1 ]]; then
        _pw_backup_encrypt "${backup_dir}"
    fi

    pw_info "Backup complete: ${backup_dir}"

    # Notify penguins-eggs so the backup path is recorded for the next ISO manifest
    if declare -f pw_eggs_post_backup &>/dev/null; then
        pw_eggs_post_backup "${backup_dir}"
    fi

    echo "${backup_dir}"   # return path for callers
}

# List available backups
pw_backup_list() {
    local dest="${PW_BACKUP_DIR}"
    if [[ ! -d "${dest}" ]] || [[ -z "$(ls -A "${dest}" 2>/dev/null)" ]]; then
        pw_info "No backups found in ${dest}."
        return 0
    fi
    printf "%-40s  %-20s  %s\n" "Backup" "Created" "Size"
    printf '%s\n' "$(printf '─%.0s' {1..70})"
    find "${dest}" -maxdepth 1 -name "backup_*" -type d | sort -r | while read -r b; do
        local name size created
        name=$(basename "${b}")
        size=$(du -sh "${b}" 2>/dev/null | cut -f1)
        created=$(awk -F': ' '/^timestamp/{print $2}' "${b}/manifest.txt" 2>/dev/null || echo "unknown")
        printf "%-40s  %-20s  %s\n" "${name}" "${created}" "${size}"
    done
}

# Restore packages from a backup
pw_backup_restore_packages() {
    local backup_dir="$1"
    [[ -f "${backup_dir}/packages.list" ]] \
        || pw_die "No package list found in backup: ${backup_dir}"
    pw_pkg_restore_list "${backup_dir}/packages.list"
}

# Restore home directories from a backup
pw_backup_restore_home() {
    local backup_dir="$1"
    local target="${2:-/}"
    local archive="${backup_dir}/home/home.tar.gz"
    [[ -f "${archive}" ]] || pw_die "No home archive found in backup: ${backup_dir}"
    pw_step "Restoring home directories from ${archive}"
    pw_run tar -xzf "${archive}" -C "${target}"
    pw_info "Home directories restored."
}

# ── Internal backup steps ──────────────────────────────────────────────────────

_pw_backup_manifest() {
    local dir="$1" ts="$2"
    cat > "${dir}/manifest.txt" <<EOF
powerwash_version: ${PW_VERSION}
timestamp: ${ts}
hostname: $(hostname -f 2>/dev/null || hostname)
distro_id: ${PW_DISTRO_ID:-unknown}
distro_family: ${PW_DISTRO_FAMILY:-unknown}
distro_version: ${PW_DISTRO_VERSION:-unknown}
pkg_manager: ${PW_PKG_MANAGER:-unknown}
fs_type: ${PW_FS_TYPE:-unknown}
kernel: $(uname -r)
arch: $(uname -m)
EOF
    pw_debug "Manifest written."
}

_pw_backup_packages() {
    local dir="$1"
    pw_step "Backing up package list"
    pw_pkg_save_list "${dir}/packages.list"
}

_pw_backup_repos() {
    local dir="$1"
    pw_step "Backing up repository configuration"
    case "${PW_PKG_MANAGER:-}" in
        apt)
            [[ -f /etc/apt/sources.list ]] \
                && pw_run cp /etc/apt/sources.list "${dir}/repos/"
            [[ -d /etc/apt/sources.list.d ]] \
                && pw_run cp -r /etc/apt/sources.list.d/. "${dir}/repos/sources.list.d/"
            ;;
        dnf|yum)
            [[ -d /etc/yum.repos.d ]] \
                && pw_run cp -r /etc/yum.repos.d/. "${dir}/repos/yum.repos.d/"
            ;;
        pacman)
            [[ -f /etc/pacman.conf ]] \
                && pw_run cp /etc/pacman.conf "${dir}/repos/"
            ;;
        zypper)
            [[ -d /etc/zypp/repos.d ]] \
                && pw_run cp -r /etc/zypp/repos.d/. "${dir}/repos/zypp.repos.d/"
            ;;
    esac
}

_pw_backup_home() {
    local dir="$1"; shift
    local users=("$@")

    pw_step "Backing up home directories"

    # If no users specified, back up all non-system users (UID >= 1000)
    if [[ ${#users[@]} -eq 0 ]]; then
        mapfile -t users < <(
            awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' /etc/passwd
        )
    fi

    if [[ ${#users[@]} -eq 0 ]]; then
        pw_warn "No user home directories found to back up."
        return 0
    fi

    local home_dirs=()
    local u
    for u in "${users[@]}"; do
        local home
        home=$(getent passwd "${u}" | cut -d: -f6)
        [[ -d "${home}" ]] && home_dirs+=("${home}")
    done

    if [[ ${#home_dirs[@]} -eq 0 ]]; then
        pw_warn "No home directories exist for specified users."
        return 0
    fi

    pw_run tar -czf "${dir}/home/home.tar.gz" \
        --warning=no-file-changed \
        "${home_dirs[@]}" 2>/dev/null || true

    pw_info "Backed up home dirs: ${home_dirs[*]}"
}

_pw_backup_system() {
    local dir="$1"
    pw_step "Backing up /etc"
    pw_run tar -czf "${dir}/system/etc.tar.gz" \
        --warning=no-file-changed \
        --exclude=/etc/mtab \
        /etc 2>/dev/null || true
}

_pw_backup_fstab() {
    local dir="$1"
    [[ -f /etc/fstab ]] && pw_run cp /etc/fstab "${dir}/fstab"
    [[ -f /etc/crypttab ]] && pw_run cp /etc/crypttab "${dir}/crypttab"
}

_pw_backup_crontabs() {
    local dir="$1"
    pw_step "Backing up crontabs"
    # System crontab
    [[ -f /etc/crontab ]] && pw_run cp /etc/crontab "${dir}/crontabs/system.crontab"
    # Per-user crontabs
    if [[ -d /var/spool/cron/crontabs ]]; then
        pw_run cp -r /var/spool/cron/crontabs/. "${dir}/crontabs/" 2>/dev/null || true
    elif [[ -d /var/spool/cron ]]; then
        pw_run cp -r /var/spool/cron/. "${dir}/crontabs/" 2>/dev/null || true
    fi
}

_pw_backup_docker() {
    local dir="$1"
    pw_has_cmd docker || return 0
    pw_step "Backing up Docker metadata"
    docker images --format '{{.Repository}}:{{.Tag}}' \
        > "${dir}/docker/images.list" 2>/dev/null || true
    docker volume ls --format '{{.Name}}' \
        > "${dir}/docker/volumes.list" 2>/dev/null || true
}

_pw_backup_grub() {
    local dir="$1"
    pw_step "Backing up GRUB configuration"
    [[ -f /etc/default/grub ]] \
        && pw_run cp /etc/default/grub "${dir}/grub/"
    [[ -f /boot/grub/grub.cfg ]] \
        && pw_run cp /boot/grub/grub.cfg "${dir}/grub/grub.cfg" 2>/dev/null || true
    [[ -f /boot/grub2/grub.cfg ]] \
        && pw_run cp /boot/grub2/grub.cfg "${dir}/grub/grub2.cfg" 2>/dev/null || true
}

# ── Encryption ─────────────────────────────────────────────────────────────────

_pw_backup_encrypt() {
    local backup_dir="$1"
    pw_require_cmd gpg tar
    pw_step "Encrypting backup with GPG symmetric encryption"

    local archive="${backup_dir}.tar.gz"
    local encrypted="${backup_dir}.tar.gz.gpg"

    # Create archive of the backup directory
    pw_run tar -czf "${archive}" -C "$(dirname "${backup_dir}")" "$(basename "${backup_dir}")"

    # Encrypt with passphrase (prompts interactively)
    pw_run gpg --symmetric --cipher-algo AES256 --output "${encrypted}" "${archive}"

    # Remove unencrypted archive and original directory
    pw_run rm -rf "${archive}" "${backup_dir}"

    pw_info "Encrypted backup: ${encrypted}"
    pw_info "Decrypt with: gpg -d ${encrypted} | tar -xz"
}

# Decrypt a backup archive
pw_backup_decrypt() {
    local encrypted="$1"
    local dest="${2:-.}"
    pw_require_cmd gpg tar
    [[ -f "${encrypted}" ]] || pw_die "Encrypted backup not found: ${encrypted}"
    pw_step "Decrypting backup: ${encrypted}"
    gpg -d "${encrypted}" | tar -xz -C "${dest}"
    pw_info "Backup decrypted to: ${dest}"
}
