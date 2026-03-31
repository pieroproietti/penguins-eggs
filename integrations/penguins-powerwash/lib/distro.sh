#!/usr/bin/env bash
# lib/distro.sh — distro detection and package manager abstraction
#
# Provides a unified interface over apt, dnf, pacman, zypper, portage, and xbps.
# All callers use pw_pkg_* functions; the underlying manager is transparent.

# ── Detection ──────────────────────────────────────────────────────────────────

# Populated by pw_distro_detect; read by all pw_pkg_* functions.
PW_DISTRO_ID=""
PW_DISTRO_FAMILY=""   # debian | redhat | arch | suse | gentoo | void
PW_DISTRO_VERSION=""
PW_PKG_MANAGER=""     # apt | dnf | yum | pacman | zypper | emerge | xbps

pw_distro_detect() {
    # Prefer /etc/os-release (systemd standard, available on all modern distros)
    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        source /etc/os-release
        PW_DISTRO_ID="${ID:-unknown}"
        PW_DISTRO_VERSION="${VERSION_ID:-unknown}"
    elif [[ -f /etc/lsb-release ]]; then
        # shellcheck disable=SC1091
        source /etc/lsb-release
        PW_DISTRO_ID="${DISTRIB_ID:-unknown}"
        PW_DISTRO_VERSION="${DISTRIB_RELEASE:-unknown}"
    else
        pw_die "Cannot detect distribution: /etc/os-release not found."
    fi

    PW_DISTRO_ID="${PW_DISTRO_ID,,}"  # lowercase

    # Map distro ID → family + package manager
    case "${PW_DISTRO_ID}" in
        ubuntu|debian|linuxmint|pop|elementary|kali|raspbian|mx|zorin|neon)
            PW_DISTRO_FAMILY="debian"
            PW_PKG_MANAGER="apt"
            ;;
        fedora|rhel|centos|almalinux|rocky|ol|scientific)
            PW_DISTRO_FAMILY="redhat"
            # Fedora 22+ and RHEL 8+ use dnf; older use yum
            if pw_has_cmd dnf; then
                PW_PKG_MANAGER="dnf"
            else
                PW_PKG_MANAGER="yum"
            fi
            ;;
        arch|manjaro|endeavouros|garuda|artix|cachyos)
            PW_DISTRO_FAMILY="arch"
            PW_PKG_MANAGER="pacman"
            ;;
        opensuse*|sles)
            PW_DISTRO_FAMILY="suse"
            PW_PKG_MANAGER="zypper"
            ;;
        gentoo)
            PW_DISTRO_FAMILY="gentoo"
            PW_PKG_MANAGER="emerge"
            ;;
        void)
            PW_DISTRO_FAMILY="void"
            PW_PKG_MANAGER="xbps"
            ;;
        *)
            # Fall back to probing for known package managers
            if pw_has_cmd apt-get;  then PW_DISTRO_FAMILY="debian"; PW_PKG_MANAGER="apt"
            elif pw_has_cmd dnf;    then PW_DISTRO_FAMILY="redhat"; PW_PKG_MANAGER="dnf"
            elif pw_has_cmd yum;    then PW_DISTRO_FAMILY="redhat"; PW_PKG_MANAGER="yum"
            elif pw_has_cmd pacman; then PW_DISTRO_FAMILY="arch";   PW_PKG_MANAGER="pacman"
            elif pw_has_cmd zypper; then PW_DISTRO_FAMILY="suse";   PW_PKG_MANAGER="zypper"
            elif pw_has_cmd emerge; then PW_DISTRO_FAMILY="gentoo"; PW_PKG_MANAGER="emerge"
            elif pw_has_cmd xbps-install; then PW_DISTRO_FAMILY="void"; PW_PKG_MANAGER="xbps"
            else
                pw_die "Unsupported distribution '${PW_DISTRO_ID}'. No known package manager found."
            fi
            ;;
    esac

    pw_debug "Detected: id=${PW_DISTRO_ID} family=${PW_DISTRO_FAMILY} pm=${PW_PKG_MANAGER} ver=${PW_DISTRO_VERSION}"
}

pw_distro_info() {
    printf "Distribution : %s\n" "${PW_DISTRO_ID}"
    printf "Family       : %s\n" "${PW_DISTRO_FAMILY}"
    printf "Version      : %s\n" "${PW_DISTRO_VERSION}"
    printf "Pkg manager  : %s\n" "${PW_PKG_MANAGER}"
}

# ── Package manager abstraction ────────────────────────────────────────────────
# All functions route through pw_run so dry-run mode is respected.

# Update package index
pw_pkg_update() {
    pw_step "Updating package index"
    case "${PW_PKG_MANAGER}" in
        apt)    pw_run apt-get update -qq ;;
        dnf)    pw_run dnf check-update --quiet || true ;;  # exits 100 when updates exist
        yum)    pw_run yum check-update --quiet || true ;;
        pacman) pw_run pacman -Sy --noconfirm ;;
        zypper) pw_run zypper refresh ;;
        emerge) pw_run emerge --sync ;;
        xbps)   pw_run xbps-install -S ;;
    esac
}

# Install one or more packages
pw_pkg_install() {
    [[ $# -gt 0 ]] || return 0
    pw_step "Installing: $*"
    case "${PW_PKG_MANAGER}" in
        apt)    pw_run apt-get install -y "$@" ;;
        dnf)    pw_run dnf install -y "$@" ;;
        yum)    pw_run yum install -y "$@" ;;
        pacman) pw_run pacman -S --noconfirm "$@" ;;
        zypper) pw_run zypper install -y "$@" ;;
        emerge) pw_run emerge "$@" ;;
        xbps)   pw_run xbps-install -y "$@" ;;
    esac
}

# Remove one or more packages (keep config files)
pw_pkg_remove() {
    [[ $# -gt 0 ]] || return 0
    pw_step "Removing: $*"
    case "${PW_PKG_MANAGER}" in
        apt)    pw_run apt-get remove -y "$@" ;;
        dnf)    pw_run dnf remove -y "$@" ;;
        yum)    pw_run yum remove -y "$@" ;;
        pacman) pw_run pacman -R --noconfirm "$@" ;;
        zypper) pw_run zypper remove -y "$@" ;;
        emerge) pw_run emerge --unmerge "$@" ;;
        xbps)   pw_run xbps-remove -y "$@" ;;
    esac
}

# Purge one or more packages (remove + config files)
pw_pkg_purge() {
    [[ $# -gt 0 ]] || return 0
    pw_step "Purging: $*"
    case "${PW_PKG_MANAGER}" in
        apt)    pw_run apt-get purge -y "$@" ;;
        dnf)    pw_run dnf remove -y "$@" ;;
        yum)    pw_run yum remove -y "$@" ;;
        pacman) pw_run pacman -Rns --noconfirm "$@" ;;
        zypper) pw_run zypper remove --clean-deps -y "$@" ;;
        emerge) pw_run emerge --unmerge "$@" ;;
        xbps)   pw_run xbps-remove -Ry "$@" ;;
    esac
}

# Remove orphaned/unneeded packages
pw_pkg_autoremove() {
    pw_step "Removing orphaned packages"
    case "${PW_PKG_MANAGER}" in
        apt)    pw_run apt-get autoremove -y ;;
        dnf)    pw_run dnf autoremove -y ;;
        yum)    pw_run yum autoremove -y ;;
        pacman)
            # List orphans; remove only if any exist
            local orphans
            orphans=$(pacman -Qdtq 2>/dev/null || true)
            if [[ -n "${orphans}" ]]; then
                # shellcheck disable=SC2086
                pw_run pacman -Rns --noconfirm ${orphans}
            else
                pw_info "No orphaned packages found."
            fi
            ;;
        zypper) pw_run zypper packages --orphaned ;;
        emerge) pw_run emerge --depclean ;;
        xbps)   pw_run xbps-remove -Oo ;;
    esac
}

# Clean package manager caches
pw_pkg_clean_cache() {
    pw_step "Cleaning package cache"
    case "${PW_PKG_MANAGER}" in
        apt)    pw_run apt-get clean && pw_run apt-get autoclean ;;
        dnf)    pw_run dnf clean all ;;
        yum)    pw_run yum clean all ;;
        pacman) pw_run pacman -Sc --noconfirm ;;
        zypper) pw_run zypper clean --all ;;
        emerge) pw_run eclean-dist --deep ;;
        xbps)   pw_run xbps-remove -O ;;
    esac
}

# List explicitly user-installed packages (excludes base/dependency packages)
# Outputs one package name per line.
pw_pkg_list_user_installed() {
    case "${PW_PKG_MANAGER}" in
        apt)
            # comm between all installed and packages installed as dependencies
            comm -23 \
                <(apt-mark showmanual | sort) \
                <(_pw_apt_base_packages | sort) \
                2>/dev/null || apt-mark showmanual
            ;;
        dnf)
            dnf history userinstalled 2>/dev/null \
                || rpm -qa --qf '%{NAME}\n' | sort
            ;;
        yum)
            yum history userinstalled 2>/dev/null \
                || rpm -qa --qf '%{NAME}\n' | sort
            ;;
        pacman)
            # Explicitly installed, not in base group
            pacman -Qqe | grep -Fxvf <(pacman -Qqg base base-devel 2>/dev/null || true)
            ;;
        zypper)
            zypper packages --installed-only | awk -F'|' 'NR>4 {gsub(/ /,"",$3); print $3}'
            ;;
        emerge)
            qlist -IC 2>/dev/null || pw_warn "Install app-portage/portage-utils for package listing."
            ;;
        xbps)
            xbps-query -m | awk '{print $1}'
            ;;
    esac
}

# Save list of user-installed packages to a file
pw_pkg_save_list() {
    local outfile="$1"
    pw_step "Saving installed package list to ${outfile}"
    pw_pkg_list_user_installed > "${outfile}"
    pw_info "Saved $(wc -l < "${outfile}") packages."
}

# Restore packages from a saved list
pw_pkg_restore_list() {
    local infile="$1"
    [[ -f "${infile}" ]] || pw_die "Package list not found: ${infile}"
    pw_step "Restoring packages from ${infile}"
    local pkgs
    mapfile -t pkgs < "${infile}"
    pw_pkg_install "${pkgs[@]}"
}

# Reset APT sources to distribution defaults (Debian/Ubuntu only)
pw_apt_reset_sources() {
    [[ "${PW_PKG_MANAGER}" == "apt" ]] || return 0
    pw_step "Resetting APT sources to distribution defaults"

    local sources_list="/etc/apt/sources.list"
    local sources_dir="/etc/apt/sources.list.d"

    # Back up current sources
    pw_run cp "${sources_list}" "${sources_list}.pw_backup_$(pw_timestamp)"

    # Remove third-party PPAs and repos
    if [[ -d "${sources_dir}" ]]; then
        pw_run find "${sources_dir}" -name "*.list" -o -name "*.sources" \
            | while read -r f; do
                pw_run mv "${f}" "${f}.pw_disabled"
            done
    fi

    pw_info "APT sources backed up and third-party repos disabled."
    pw_info "Restore originals from *.pw_backup_* files if needed."
}

# ── Internal helpers ───────────────────────────────────────────────────────────

# Approximate set of packages that ship with a base Debian/Ubuntu install.
# Used to filter them out of the "user installed" list.
_pw_apt_base_packages() {
    # tasksel --task-packages standard 2>/dev/null gives a good approximation;
    # fall back to an empty list so the caller still gets something useful.
    if pw_has_cmd tasksel; then
        tasksel --task-packages standard 2>/dev/null || true
    fi
}
