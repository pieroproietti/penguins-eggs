/**
 * ./src/classes/ovary.d/luks-home-support.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Installa i file necessari per sbloccare home.img LUKS durante il boot
 * Supporta sia Systemd (Debian/Ubuntu) che SysVinit (Devuan)
 */
export function installHomecryptSupport(this: Ovary, squashfsRoot: string, homeImgPath: string): void {
  Utils.warning('installing encrypted home support...')

  // 1. PREPARAZIONE SCRIPT DI MONTAGGIO (Il "Motore")
  const templatePath = path.join(__dirname, '../../../scripts/mount-encrypted-home.sh')
  let bashScript = fs.readFileSync(templatePath, 'utf8')
  bashScript = bashScript.replace('__HOME_IMG_PATH__', homeImgPath)

  const mountScriptPath = path.join(squashfsRoot, 'usr/local/bin/mount-encrypted-home.sh')

  fs.mkdirSync(path.dirname(mountScriptPath), { recursive: true })
  fs.writeFileSync(mountScriptPath, bashScript)
  fs.chmodSync(mountScriptPath, 0o755)

  // ---------------------------------------------------------
  // RAMO SYSTEMD (Invariato - funziona bene con i .service)
  // ---------------------------------------------------------
  if (Utils.isSystemd()) {
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
    const servicePath = path.join(squashfsRoot, 'etc/systemd/system/mount-encrypted-home.service')
    const symlinkDir = path.join(squashfsRoot, 'etc/systemd/system/local-fs.target.wants')
    const symlinkPath = path.join(symlinkDir, 'mount-encrypted-home.service')

    fs.mkdirSync(path.dirname(servicePath), { recursive: true })
    fs.mkdirSync(symlinkDir, { recursive: true })
    fs.writeFileSync(servicePath, systemdService)

    if (fs.existsSync(symlinkPath)) fs.unlinkSync(symlinkPath)
    fs.symlinkSync('../mount-encrypted-home.service', symlinkPath)
  }
  // ---------------------------------------------------------
  // RAMO SYSVINIT (DEVUAN) - METODO INITTAB HIJACK
  // ---------------------------------------------------------
  else if (Utils.isSysvinit()) {
    Utils.warning('Configuring SysVinit via /etc/inittab hijacking (Persistent Method)...')

    // A. Creiamo un Wrapper Script che fa: Sblocco -> Poi lancia Login
    // Questo script prenderà il posto di 'agetty' su tty1
    const wrapperScript = `#!/bin/sh
# Wrapper per sbloccare la home prima del login su TTY1

# 1. Setup ambiente minimale
export TERM=linux
export PATH=/sbin:/usr/sbin:/bin:/usr/bin

# 2. Pulizia schermo e stop Plymouth
clear
if [ -x /bin/plymouth ] && /bin/plymouth --ping; then
    /bin/plymouth quit
fi

# 3. Attesa dispositivi (importante per USB)
echo "Waiting for devices..."
/sbin/udevadm settle

# 4. Esecuzione script di sblocco
echo "------------------------------------------------"
echo " CHECKING ENCRYPTED HOME STORAGE"
echo "------------------------------------------------"
/usr/local/bin/mount-encrypted-home.sh

# 5. Controllo esito (visivo)
if mountpoint -q /home; then
    echo ">> Home mounted successfully."
    sleep 1
else
    echo ">> Home NOT mounted. Continuing unencrypted..."
    sleep 2
fi

# 6. LANCIO DEL VERO LOGIN (Sostituisce questo processo)
# Nota: --noclear evita di cancellare i messaggi di errore precedenti
exec /sbin/agetty --noclear tty1 linux
`
    const wrapperPath = path.join(squashfsRoot, 'usr/local/bin/tty1-unlock-wrapper.sh')
    fs.writeFileSync(wrapperPath, wrapperScript)
    fs.chmodSync(wrapperPath, 0o755)

    // B. Modifichiamo /etc/inittab per usare il nostro wrapper
    const inittabPath = path.join(squashfsRoot, 'etc/inittab')

    if (fs.existsSync(inittabPath)) {
      let content = fs.readFileSync(inittabPath, 'utf8')

      // La riga standard è solitamente: 1:2345:respawn:/sbin/getty 38400 tty1
      // Oppure su Devuan: 1:2345:respawn:/sbin/agetty --noclear tty1 linux

      // Cerchiamo qualsiasi riga che inizia con "1:" (tty1)
      const regexTTY1 = /^1:.*$/m

      // La nuova riga che lancia il nostro wrapper invece di agetty diretto
      const newLine = `1:2345:respawn:/usr/local/bin/tty1-unlock-wrapper.sh`

      if (regexTTY1.test(content)) {
        content = content.replace(regexTTY1, newLine)
        Utils.warning('Patched /etc/inittab to run home unlock on TTY1')
      } else {
        // Se non la trova, la aggiungiamo in fondo (caso raro ma possibile)
        content += `\n${newLine}\n`
      }

      fs.writeFileSync(inittabPath, content)
    }

    // C. Pulizia vecchi tentativi (Rimuoviamo script init.d se presenti per evitare conflitti)
    const badSymlinks = [path.join(squashfsRoot, 'etc/rcS.d/S05mount-encrypted-home'), path.join(squashfsRoot, 'etc/rcS.d/S20mount-encrypted-home'), path.join(squashfsRoot, 'etc/rc2.d/S02mount-encrypted-home')]
    for (const link of badSymlinks) {
      if (fs.existsSync(link)) fs.unlinkSync(link)
    }

    // Rimuoviamo anche lo script init.d stesso se esiste, non serve più
    const initdFile = path.join(squashfsRoot, 'etc/init.d/mount-encrypted-home')
    if (fs.existsSync(initdFile)) fs.unlinkSync(initdFile)
  }
}
