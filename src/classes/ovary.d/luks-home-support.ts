/**
 * ./src/classes/ovary.d/luks-home-support.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// classes
import Ovary from '../ovary.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Installa i file necessari per sbloccare home.img LUKS durante il boot
 */
export function installEncryptedHomeSupport(this: Ovary, squashfsRoot: string, homeImgPath: string): void {
  console.log('Installing encrypted home support...')
  console.log("squashfsRoot:", squashfsRoot)
  console.log("homeImgPath:", homeImgPath)

  // Leggi il template bash
    const templatePath = path.join(__dirname, '../../../scripts/mount-encrypted-home.sh')
  let bashScript = fs.readFileSync(templatePath, 'utf8')
  
  // Sostituisci il placeholder con il path reale
  bashScript = bashScript.replace('__HOME_IMG_PATH__', homeImgPath)

  // Systemd service
  const systemdService = `[Unit]
Description=Unlock and mount encrypted home.img
DefaultDependencies=no
After=systemd-udev-settle.service local-fs-pre.target
Before=local-fs.target display-manager.service
ConditionPathExists=${homeImgPath}

[Service]
Type=oneshot
RemainAfterExit=yes
StandardInput=tty
StandardOutput=journal+console
StandardError=journal+console
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
  fs.writeFileSync(scriptPath, bashScript)
  fs.chmodSync(scriptPath, 0o755)
  console.log(`✓ Created: ${scriptPath}`)

  // Scrivi il service
  fs.writeFileSync(servicePath, systemdService)
  console.log(`✓ Created: ${servicePath}`)

  // Crea il symlink per abilitare il service
  if (fs.existsSync(symlinkPath)) {
    fs.unlinkSync(symlinkPath)
  }
  fs.symlinkSync('../mount-encrypted-home.service', symlinkPath)
  console.log(`✓ Enabled: mount-encrypted-home.service`)

  console.log('Encrypted home support installed successfully')
  console.log('Logs will be available at: /var/log/mount-encrypted-home.log')
}