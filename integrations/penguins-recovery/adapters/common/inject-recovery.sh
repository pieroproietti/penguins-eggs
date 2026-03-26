#!/bin/bash
# inject-recovery.sh -- Inject penguins-recovery tools into an extracted rootfs.
#
# Usage: source inject-recovery.sh
#   Requires: ROOTFS, RECOVERY_ROOT to be set by the caller.
#
# Injects:
#   - common/scripts/* into /usr/local/bin/
#   - common/branding/motd.txt into /etc/motd
#   - tools/rescapp/ into /opt/rescapp/ (if present and --with-rescapp)
#   - GRUB recovery menu entry into boot config

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
WITH_RESCAPP="${WITH_RESCAPP:-false}"

info()  { echo -e "\033[1;32m[inject]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[inject]\033[0m $*"; }

# 1. Inject shared rescue scripts
SCRIPTS_SRC="${RECOVERY_ROOT}/common/scripts"
SCRIPTS_DEST="${ROOTFS}/usr/local/bin"
mkdir -p "$SCRIPTS_DEST"

if [ -d "$SCRIPTS_SRC" ]; then
    info "Injecting rescue scripts into /usr/local/bin/"
    for script in "$SCRIPTS_SRC"/*.sh; do
        [ -f "$script" ] || continue
        cp "$script" "$SCRIPTS_DEST/"
        chmod +x "$SCRIPTS_DEST/$(basename "$script")"
        info "  + $(basename "$script")"
    done
else
    warn "No scripts found at $SCRIPTS_SRC"
fi

# 2. Inject MOTD
MOTD_SRC="${RECOVERY_ROOT}/common/branding/motd.txt"
if [ -f "$MOTD_SRC" ]; then
    info "Injecting MOTD"
    cp "$MOTD_SRC" "${ROOTFS}/etc/motd"
fi

# 3. Inject rescapp (optional)
if [ "$WITH_RESCAPP" = "true" ] && [ -d "${RECOVERY_ROOT}/tools/rescapp" ]; then
    info "Injecting rescapp into /opt/rescapp/"
    RESCAPP_DEST="${ROOTFS}/opt/rescapp"
    mkdir -p "$RESCAPP_DEST"
    cp -a "${RECOVERY_ROOT}/tools/rescapp/." "$RESCAPP_DEST/"

    # Create a launcher symlink
    mkdir -p "${ROOTFS}/usr/local/bin"
    cat > "${ROOTFS}/usr/local/bin/rescapp" <<'LAUNCHER'
#!/bin/bash
exec /opt/rescapp/bin/rescapp "$@"
LAUNCHER
    chmod +x "${ROOTFS}/usr/local/bin/rescapp"

    # Create desktop entry if X11/Wayland is available
    DESKTOP_DIR="${ROOTFS}/usr/share/applications"
    if [ -d "$DESKTOP_DIR" ] || [ -d "${ROOTFS}/usr/share/xsessions" ]; then
        mkdir -p "$DESKTOP_DIR"
        cat > "$DESKTOP_DIR/rescapp.desktop" <<'DESKTOP'
[Desktop Entry]
Name=Rescapp
Comment=System rescue wizard
Exec=/opt/rescapp/bin/rescapp
Icon=/opt/rescapp/logos/rescapp.png
Terminal=false
Type=Application
Categories=System;
DESKTOP
        info "  + Desktop entry created"
    fi
    info "  + rescapp installed to /opt/rescapp/"
fi

# 4. Create a recovery shell profile
PROFILE_DIR="${ROOTFS}/etc/profile.d"
mkdir -p "$PROFILE_DIR"
cat > "$PROFILE_DIR/penguins-recovery.sh" <<'PROFILE'
# penguins-recovery environment
export PATH="/usr/local/bin:$PATH"

# Show available recovery tools on login
if [ -t 1 ] && [ -z "$RECOVERY_SHOWN" ]; then
    export RECOVERY_SHOWN=1
    echo ""
    echo "Penguins-Recovery tools available:"
    for tool in /usr/local/bin/*-rescue.sh /usr/local/bin/*-restore.sh \
                /usr/local/bin/*-repair.sh /usr/local/bin/*-reset.sh \
                /usr/local/bin/detect-*.sh; do
        [ -f "$tool" ] && echo "  $(basename "$tool")"
    done
    if command -v rescapp &>/dev/null; then
        echo "  rescapp (GUI wizard)"
    fi
    echo ""
fi
PROFILE
chmod +x "$PROFILE_DIR/penguins-recovery.sh"
info "Injected recovery shell profile"

# 5. Set hostname to identify as recovery image
echo "penguins-recovery" > "${ROOTFS}/etc/hostname"
info "Set hostname to penguins-recovery"

info "Injection complete."
