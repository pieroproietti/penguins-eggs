/**
 * ./src/classes/ovary.d/dracut_verity_module.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * license: MIT
 *
 * Installs dracut modules for dm-verity verified live boot.
 *
 * Two dracut modules are managed:
 *
 * 1. dracut-verity (hatlocker/dracut-verity):
 *    A systemd generator that reads verity.usr= and verity.usrhash= from
 *    the kernel cmdline and creates a dm-verity device at boot.
 *    Used for verifying the rootfs/usr partition.
 *
 * 2. verity-squash-root dracut module (brandsimon/verity-squash-root):
 *    A mount handler that opens a dm-verity-protected squashfs and layers
 *    overlayfs on top for writability. Used for the live boot squashfs.
 *
 * These modules are installed into /usr/lib/dracut/modules.d/ so that
 * dracut includes them when generating the initramfs for the live ISO.
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec } from '../../lib/utils.js'
import Utils from '../utils.js'

const DRACUT_MODULES_DIR = '/usr/lib/dracut/modules.d'

// ============================================================================
// dracut-verity module (hatlocker/dracut-verity)
// ============================================================================

const VERITY_MODULE_DIR = '10verity'

/**
 * module-setup.sh for the dracut-verity module.
 * Installs veritysetup and the systemd generator.
 */
const VERITY_MODULE_SETUP = `#!/bin/bash
# dracut-verity module-setup.sh
# Derived from hatlocker/dracut-verity

depends() {
    echo systemd dm
}

install() {
    inst_multiple veritysetup tr
    if command -v e2size >/dev/null 2>&1; then
        inst_multiple e2size
    fi
    if command -v systemd-escape >/dev/null 2>&1; then
        inst_multiple systemd-escape
    fi
    inst_simple "$moddir/verity-generator" \\
        "$systemdutildir/system-generators/verity-generator"
}
`

/**
 * verity-generator: systemd generator that reads kernel cmdline
 * and creates a dm-verity service for the rootfs.
 *
 * Kernel cmdline params:
 *   verity.usr=LABEL=ROOT-A   (or UUID=, PARTUUID=, PARTLABEL=)
 *   verity.usrhash=<root_hash>
 */
const VERITY_GENERATOR = `#!/bin/bash
# verity-generator: systemd generator for dm-verity
# Derived from hatlocker/dracut-verity

set -e

UNIT_DIR="\${1:-/tmp}"

if [[ -n "\${VERITY_GENERATOR_CMDLINE}" ]]; then
    cmdline=( \${VERITY_GENERATOR_CMDLINE} )
else
    cmdline=( $(</proc/cmdline) )
fi

cmdline_arg() {
    local name="$1" value="$2"
    for arg in "\${cmdline[@]}"; do
        if [[ "\${arg%%=*}" == "\${name}" ]]; then
            value="\${arg#*=}"
        fi
    done
    echo "\${value}"
}

usr=$(cmdline_arg verity.usr)
usrhash=$(cmdline_arg verity.usrhash)

case "\${usr}" in
    LABEL=*)
        usr="/dev/disk/by-label/\${usr#LABEL=}"
        ;;
    UUID=*)
        usr="\${usr#UUID=}"
        usr="$(echo $usr | tr '[:upper:]' '[:lower:]')"
        usr="/dev/disk/by-uuid/\${usr}"
        ;;
    PARTUUID=*)
        usr="\${usr#PARTUUID=}"
        usr="$(echo $usr | tr '[:upper:]' '[:lower:]')"
        usr="/dev/disk/by-partuuid/\${usr}"
        ;;
    PARTLABEL=*)
        usr="/dev/disk/by-partlabel/\${usr#PARTLABEL=}"
        ;;
esac

if [[ "\${usr}" != /* ]]; then
    exit 0
fi

if [[ -n "\${usr}" && -n "\${usrhash}" ]]; then
    device=$(systemd-escape --suffix=device --path "\${usr}")

    cat >"\${UNIT_DIR}/verity-setup.service" <<-EOF
\t[Unit]
\tDescription=dm-verity Setup for rootfs
\tSourcePath=/proc/cmdline
\tDefaultDependencies=no
\tIgnoreOnIsolate=true
\tBindsTo=dev-mapper-usr.device
\tBindsTo=\${device}
\tAfter=\${device}

\t[Service]
\tType=oneshot
\tRemainAfterExit=yes
\tExecStart=/bin/sh -c '/sbin/veritysetup open usr "\${usr}" "\${usr}" "\${usrhash}"'
\tExecStop=/sbin/veritysetup remove usr
EOF

    requires_dir="\${UNIT_DIR}/dev-mapper-usr.device.requires"
    mkdir -p "\${requires_dir}"
    ln -sf "../verity-setup.service" "\${requires_dir}/verity-setup.service"
fi
`

// ============================================================================
// verity-squash-root dracut module (brandsimon/verity-squash-root)
// ============================================================================

const VSR_MODULE_DIR = '99verity-squash-root'

/**
 * module-setup.sh for verity-squash-root.
 * Installs veritysetup and the mount handler.
 */
const VSR_MODULE_SETUP = `#!/bin/bash
# verity-squash-root module-setup.sh
# Derived from brandsimon/verity-squash-root

depends() {
    echo dm
}

install() {
    inst_multiple veritysetup mount umount mkdir rm
    inst_dir /verity-squash-root-tmp
    inst_simple "$moddir/mount_handler" /usr/lib/verity-squash-root/mount_handler
    inst_simple "$moddir/functions" /usr/lib/verity-squash-root/functions
}
`

/**
 * functions: helper functions for the mount handler.
 */
const VSR_FUNCTIONS = `#!/usr/bin/sh
# verity-squash-root functions
# Derived from brandsimon/verity-squash-root

KP_NAME="verity_squash_root"

get_kparam() {
    local name="$1"
    local value=""
    for arg in $(cat /proc/cmdline); do
        case "$arg" in
            \${name}=*)
                value="\${arg#*=}"
                ;;
        esac
    done
    echo "$value"
}

get_kparam_set() {
    local name="$1"
    for arg in $(cat /proc/cmdline); do
        if [ "$arg" = "$name" ]; then
            echo "$name"
            return
        fi
    done
}
`

/**
 * mount_handler: opens dm-verity squashfs and mounts with overlayfs.
 *
 * Kernel cmdline params:
 *   verity_squash_root_hash=<root_hash>
 *   verity_squash_root_slot=a  (selects image_a.squashfs)
 *   verity_squash_root_volatile  (use tmpfs for overlay upper, optional)
 */
const VSR_MOUNT_HANDLER = `#!/usr/bin/sh
# verity-squash-root mount handler
# Derived from brandsimon/verity-squash-root
set -e
. /usr/lib/verity-squash-root/functions

SLOT="$(get_kparam "\${KP_NAME}_slot")"
ROOTHASH="$(get_kparam "\${KP_NAME}_hash")"
VOLATILE="$(get_kparam_set "\${KP_NAME}_volatile")"
ROOT="\${1}"
DEST="\${2}"
TMP="/verity-squash-root-tmp"

mkdir -p "\${TMP}/squashroot"

if [ "\${VOLATILE}" = "\${KP_NAME}_volatile" ]; then
    OLROOT="\${TMP}/tmpfs"
    mkdir -p "\${OLROOT}"
    mount -t tmpfs tmpfs "\${OLROOT}"
else
    OLROOT="\${ROOT}"
fi

rm -rf "\${OLROOT}/workdir"
mkdir -p "\${OLROOT}/overlay" "\${OLROOT}/workdir"

IMAGE="\${ROOT}/live/filesystem.squashfs"
if [ -n "\${SLOT}" ]; then
    IMAGE="\${ROOT}/image_\${SLOT}.squashfs"
fi

VERITY_IMAGE="\${IMAGE}.verity"

if [ -f "\${VERITY_IMAGE}" ] && [ -n "\${ROOTHASH}" ]; then
    # Verified boot: open squashfs with dm-verity
    veritysetup open "\${IMAGE}" rootsq "\${VERITY_IMAGE}" "\${ROOTHASH}"
    mount -o ro "/dev/mapper/rootsq" "\${TMP}/squashroot"
else
    # Unverified fallback: mount squashfs directly
    mount -o ro,loop "\${IMAGE}" "\${TMP}/squashroot"
fi

mount \\
    -t overlay overlay \\
    -o lowerdir="\${TMP}/squashroot" \\
    -o upperdir="\${OLROOT}/overlay" \\
    -o workdir="\${OLROOT}/workdir" \\
    -o index=off,metacopy=off,xino=off \\
    "\${DEST}"
`

// ============================================================================
// Installation functions
// ============================================================================

/**
 * Install the dracut-verity module into the system's dracut modules directory.
 */
export async function installDracutVerityModule(echo: object): Promise<boolean> {
  const moduleDir = path.join(DRACUT_MODULES_DIR, VERITY_MODULE_DIR)

  try {
    fs.mkdirSync(moduleDir, { recursive: true })
    fs.writeFileSync(path.join(moduleDir, 'module-setup.sh'), VERITY_MODULE_SETUP, { mode: 0o755 })
    fs.writeFileSync(path.join(moduleDir, 'verity-generator'), VERITY_GENERATOR, { mode: 0o755 })
    Utils.warning(`Installed dracut-verity module to ${moduleDir}`)
    return true
  } catch (error) {
    Utils.error(`Failed to install dracut-verity module: ${error}`)
    return false
  }
}

/**
 * Install the verity-squash-root dracut module.
 */
export async function installVeritySquashRootModule(echo: object): Promise<boolean> {
  const moduleDir = path.join(DRACUT_MODULES_DIR, VSR_MODULE_DIR)

  try {
    fs.mkdirSync(moduleDir, { recursive: true })
    fs.writeFileSync(path.join(moduleDir, 'module-setup.sh'), VSR_MODULE_SETUP, { mode: 0o755 })
    fs.writeFileSync(path.join(moduleDir, 'functions'), VSR_FUNCTIONS, { mode: 0o755 })
    fs.writeFileSync(path.join(moduleDir, 'mount_handler'), VSR_MOUNT_HANDLER, { mode: 0o755 })
    Utils.warning(`Installed verity-squash-root dracut module to ${moduleDir}`)
    return true
  } catch (error) {
    Utils.error(`Failed to install verity-squash-root module: ${error}`)
    return false
  }
}

/**
 * Install both dracut verity modules.
 */
export async function installAllVerityModules(echo: object): Promise<boolean> {
  const a = await installDracutVerityModule(echo)
  const b = await installVeritySquashRootModule(echo)
  return a && b
}

/**
 * Check if dracut verity modules are installed.
 */
export function isVerityModuleInstalled(): boolean {
  return fs.existsSync(path.join(DRACUT_MODULES_DIR, VERITY_MODULE_DIR, 'module-setup.sh'))
}

/**
 * Check if verity-squash-root module is installed.
 */
export function isVeritySquashRootModuleInstalled(): boolean {
  return fs.existsSync(path.join(DRACUT_MODULES_DIR, VSR_MODULE_DIR, 'module-setup.sh'))
}

/**
 * Remove both dracut verity modules.
 */
export async function removeAllVerityModules(): Promise<void> {
  const dirs = [
    path.join(DRACUT_MODULES_DIR, VERITY_MODULE_DIR),
    path.join(DRACUT_MODULES_DIR, VSR_MODULE_DIR),
  ]
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true })
    }
  }
}
