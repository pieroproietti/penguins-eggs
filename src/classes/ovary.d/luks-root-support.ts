/**
 * ./src/classes/ovary.d/luks-root-support.ts
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
 * Installa il supporto per root.img cifrato nell'initramfs
 */
export async function installEncryptedRootSupport(
  this: Ovary, 
  squashfsRoot: string, 
  rootImgPath: string
): Promise<void> {
  console.log('Installing encrypted root support...')
  console.log("squashfsRoot:", squashfsRoot)
  console.log("rootImgPath:", rootImgPath)

  // Leggi i template
  const scriptsDir = path.join(__dirname, '../../../scripts')
  
  // Script decrypt-root.sh
  let decryptScript = fs.readFileSync(
    path.join(scriptsDir, 'decrypt-root.sh'), 
    'utf8'
  )
  decryptScript = decryptScript.replace('__ROOT_IMG_PATH__', rootImgPath)

  // Hook initramfs
  const hookScript = fs.readFileSync(
    path.join(scriptsDir, 'cryptroot-hook'), 
    'utf8'
  )

  // Percorsi di destinazione nel filesystem che sarà compresso
  const decryptScriptPath = path.join(squashfsRoot, 'usr/local/bin/decrypt-root.sh')
  const hookPath = path.join(squashfsRoot, 'etc/initramfs-tools/hooks/cryptroot')

  // Crea le directory necessarie
  fs.mkdirSync(path.dirname(decryptScriptPath), { recursive: true })
  fs.mkdirSync(path.dirname(hookPath), { recursive: true })

  // Scrivi i file
  fs.writeFileSync(decryptScriptPath, decryptScript)
  fs.chmodSync(decryptScriptPath, 0o755)
  console.log(`✓ Created: ${decryptScriptPath}`)

  fs.writeFileSync(hookPath, hookScript)
  fs.chmodSync(hookPath, 0o755)
  console.log(`✓ Created: ${hookPath}`)

  console.log('Encrypted root support installed')
  console.log('⚠️  Remember to regenerate initramfs after squashfs is mounted!')
}

/**
 * Rigenera l'initramfs con il supporto cryptsetup
 * Questo va fatto DENTRO il filesystem montato, prima di comprimerlo
 */
export async function regenerateInitramfs(
  this: Ovary,
  squashfsRoot: string
): Promise<void> {
  console.log('Regenerating initramfs with cryptsetup support...')
  
  // Monta proc, sys, dev nel chroot
  await exec(`mount --bind /proc ${squashfsRoot}/proc`)
  await exec(`mount --bind /sys ${squashfsRoot}/sys`)
  await exec(`mount --bind /dev ${squashfsRoot}/dev`)
  
  try {
    // Trova la versione del kernel
    const kernelVersion = fs.readdirSync(path.join(squashfsRoot, 'lib/modules'))[0]
    
    console.log(`Kernel version: ${kernelVersion}`)
    
    // Rigenera initramfs in chroot
    await exec(`chroot ${squashfsRoot} update-initramfs -u -k ${kernelVersion}`)
    
    console.log('✓ Initramfs regenerated successfully')
  } finally {
    // Cleanup: smonta
    await exec(`umount ${squashfsRoot}/proc`).catch(() => {})
    await exec(`umount ${squashfsRoot}/sys`).catch(() => {})
    await exec(`umount ${squashfsRoot}/dev`).catch(() => {})
  }
}