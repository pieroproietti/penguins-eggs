/**
 * ./src/classes/ovary.d/luks-root-ensure.ts
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
import { exec } from '../../lib/utils.js'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Verifica che cryptsetup sia disponibile nel sistema live
 */
export async function ensureCryptsetupInLive(
  this: Ovary,
  squashfsRoot: string
): Promise<void> {
  const cryptsetupPath = path.join(squashfsRoot, 'sbin/cryptsetup')
  
  if (fs.existsSync(cryptsetupPath)) {
    Utils.success('✓ cryptsetup already present in live system')
    return
  }

  Utils.warning('Installing cryptsetup in live system...')
  
  // Installa cryptsetup con chroot
  await exec(`mount --bind /proc ${squashfsRoot}/proc`)
  await exec(`mount --bind /sys ${squashfsRoot}/sys`)
  await exec(`mount --bind /dev ${squashfsRoot}/dev`)

  try {
    await exec(`chroot ${squashfsRoot} apt-get update`)
    await exec(`chroot ${squashfsRoot} apt-get install -y cryptsetup`)
    Utils.success('✓ cryptsetup installed')
  } finally {
    await exec(`umount ${squashfsRoot}/proc`).catch(() => {})
    await exec(`umount ${squashfsRoot}/sys`).catch(() => {})
    await exec(`umount ${squashfsRoot}/dev`).catch(() => {})
  }
}

/**
 * Installa l'hook live-boot nel filesystem che verrà compresso
 */
export async function installLiveBootDecryptHook(
  this: Ovary,
  squashfsRoot: string
): Promise<void> {
  Utils.warning('Installing live-boot decrypt hook...')
  console.log("squashfsRoot:", squashfsRoot)

  const scriptsDir = path.join(__dirname, '../../../scripts')
  
  try {
    // Leggi lo script hook
    const hookScript = fs.readFileSync(
      path.join(scriptsDir, 'live-boot-decrypt-hook.sh'),
      'utf8'
    )

    // Path destinazione nel filesystem
    const hookDir = path.join(squashfsRoot, 'lib/live/boot')
    const hookPath = path.join(hookDir, '9999-decrypt-root')

    // Crea directory
    fs.mkdirSync(hookDir, { recursive: true })

    // Scrivi lo script
    fs.writeFileSync(hookPath, hookScript)
    fs.chmodSync(hookPath, 0o755)

    Utils.success(`✓ Live-boot hook installed: ${hookPath}`)
    Utils.success('  Hook will execute when live-boot mounts the media')
    Utils.success('  No initramfs modification needed!')

  } catch (error) {
    Utils.error(`Failed to install live-boot hook: ${error}`)
    throw error
  }
}