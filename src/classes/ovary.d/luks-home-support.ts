/**
 * ./src/classes/ovary.d/luks-home-support.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import { spawn, StdioOptions } from 'node:child_process'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import { exec } from '../../lib/utils.js'
import path from 'path'

/**
 * Installa i file necessari per sbloccare home.img LUKS durante il boot
 */
export function installEncryptedHomeSupport(this: Ovary): void {
  Utils.warning('Installing encrypted home support...')

  const squashfsRoot = this.settings.work_dir.merged

  const homeImg = this.distroLliveMediumPath + `live/home.img`


  // Script bash per sbloccare e montare
  const mountScript = `#!/bin/bash
# Script per sbloccare e montare home.img LUKS cifrato

set -e

HOME_IMG=${homeImg}
LUKS_NAME="live-home"
MOUNT_POINT="/home"

# Verifica se home.img esiste
if [ ! -f "\${HOME_IMG}" ]; then
    echo "home.img not found at \${HOME_IMG}"
    exit 0
fi

# Verifica se è davvero un volume LUKS
if ! cryptsetup isLuks "\${HOME_IMG}"; then
    echo "ERROR: \${HOME_IMG} is not a LUKS volume"
    exit 1
fi

echo "Found encrypted home.img"
echo "Please enter the passphrase to unlock your home directory:"

# Prova a sbloccare il volume LUKS
if cryptsetup open "\${HOME_IMG}" "\${LUKS_NAME}"; then
    echo "LUKS volume unlocked successfully"
    
    mkdir -p "\${MOUNT_POINT}"
    
    if mount "/dev/mapper/\${LUKS_NAME}" "\${MOUNT_POINT}"; then
        echo "Home directory mounted successfully"
        exit 0
    else
        echo "ERROR: Failed to mount decrypted volume"
        cryptsetup close "\${LUKS_NAME}"
        exit 1
    fi
else
    echo "ERROR: Failed to unlock LUKS volume"
    exit 1
fi
`

  // Systemd service
  const systemdService = `[Unit]
Description=Unlock and mount encrypted home.img
DefaultDependencies=no
After=systemd-udev-settle.service local-fs-pre.target
Before=local-fs.target display-manager.service
ConditionPathExists=/live/home.img

[Service]
Type=oneshot
RemainAfterExit=yes
StandardInput=tty
StandardOutput=tty
TTYPath=/dev/console
TTYReset=yes
TTYVHangup=yes
ExecStart=/usr/local/bin/mount-encrypted-home.sh
ExecStop=/bin/bash -c 'umount /home && cryptsetup close live-home'

[Install]
WantedBy=local-fs.target
`

  // Percorsi di destinazione
  const scriptPath = path.join(squashfsRoot, 'usr/local/bin/mount-encrypted-home.sh')
  const servicePath = path.join(squashfsRoot, 'etc/systemd/system/mount-encrypted-home.service')
  const symlinkDir = path.join(squashfsRoot, 'etc/systemd/system/local-fs.target.wants')
  const symlinkPath = path.join(symlinkDir, 'mount-encrypted-home.service')

  // Crea le directory necessarie
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true })
  fs.mkdirSync(path.dirname(servicePath), { recursive: true })
  fs.mkdirSync(symlinkDir, { recursive: true })

  // Scrivi lo script
  fs.writeFileSync(scriptPath, mountScript)
  fs.chmodSync(scriptPath, 0o755)

  // Scrivi il service
  fs.writeFileSync(servicePath, systemdService)

  // Crea il symlink per abilitare il service
  if (fs.existsSync(symlinkPath)) {
    fs.unlinkSync(symlinkPath)
  }
  fs.symlinkSync('../mount-encrypted-home.service', symlinkPath)
}

/**
 * Verifica che i file siano stati installati correttamente
 */
export function verifyEncryptedHomeSupport(this: Ovary) : boolean {
  const squashfsRoot = this.settings.work_dir.merged
  const checks = [
    path.join(squashfsRoot, 'usr/local/bin/mount-encrypted-home.sh'),
    path.join(squashfsRoot, 'etc/systemd/system/mount-encrypted-home.service'),
    path.join(squashfsRoot, 'etc/systemd/system/local-fs.target.wants/mount-encrypted-home.service')
  ]

  let allOk = true
  for (const file of checks) {
    if (fs.existsSync(file)) {
      console.log(`✓ ${path.relative(squashfsRoot, file)}`)
    } else {
      console.error(`✗ ${path.relative(squashfsRoot, file)} NOT FOUND`)
      allOk = false
    }
  }

  return allOk
}
