#!/bin/bash
# Configure the Alpine rootfs: hostname, services, config files, and rescue scripts.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOTFS="${SCRIPT_DIR}/build/alpine-minirootfs"
COMMON_SCRIPTS="$(cd "${SCRIPT_DIR}/../../common/scripts" && pwd)"

HOSTNAME=lifeboat
echo "$HOSTNAME" > "${ROOTFS}/etc/hostname"
echo "127.0.0.1 $HOSTNAME $HOSTNAME" >> "${ROOTFS}/etc/hosts"

# OpenRC services
cp -p "${SCRIPT_DIR}/zfiles/services/"* "${ROOTFS}/etc/init.d/"

ln -fs /etc/init.d/mdev        "${ROOTFS}/etc/runlevels/sysinit/mdev"
ln -fs /etc/init.d/devfs       "${ROOTFS}/etc/runlevels/sysinit/devfs"
ln -fs /etc/init.d/dmesg       "${ROOTFS}/etc/runlevels/sysinit/dmesg"
ln -fs /etc/init.d/syslog      "${ROOTFS}/etc/runlevels/sysinit/syslog"
ln -fs /etc/init.d/haveged     "${ROOTFS}/etc/runlevels/sysinit/haveged"
ln -fs /etc/init.d/hwdrivers   "${ROOTFS}/etc/runlevels/sysinit/hwdrivers"
ln -fs /etc/init.d/networking  "${ROOTFS}/etc/runlevels/sysinit/networking"
ln -fs /etc/init.d/userscripts "${ROOTFS}/etc/runlevels/sysinit/userscripts"

# Config files
cat "${SCRIPT_DIR}/zfiles/shadow"     > "${ROOTFS}/etc/shadow"
cat "${SCRIPT_DIR}/zfiles/inittab"    > "${ROOTFS}/etc/inittab"
cat "${SCRIPT_DIR}/zfiles/interfaces" > "${ROOTFS}/etc/network/interfaces"
cat "${SCRIPT_DIR}/zfiles/profile"    > "${ROOTFS}/etc/profile"
cat "${SCRIPT_DIR}/zfiles/motd"       > "${ROOTFS}/etc/motd"

# Init script
cat "${SCRIPT_DIR}/zfiles/init" > "${ROOTFS}/init"
chmod +x "${ROOTFS}/init"

# User resources
cp "${SCRIPT_DIR}/zfiles/README" "${ROOTFS}/root/"
cp -r "${SCRIPT_DIR}/zfiles/resources" "${ROOTFS}/root/"

# Inject penguins-recovery shared rescue scripts
if [ -d "$COMMON_SCRIPTS" ]; then
    mkdir -p "${ROOTFS}/root/rescue-scripts"
    cp "${COMMON_SCRIPTS}"/*.sh "${ROOTFS}/root/rescue-scripts/" 2>/dev/null || true
    chmod +x "${ROOTFS}/root/rescue-scripts/"*.sh 2>/dev/null || true
    echo "Injected penguins-recovery shared scripts into /root/rescue-scripts/"
fi

# Suppress login.defs warnings
touch "${ROOTFS}/etc/login.defs"
