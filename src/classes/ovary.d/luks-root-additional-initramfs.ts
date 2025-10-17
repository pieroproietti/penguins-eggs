/**
 * ./src/classes/ovary.d/luks-root-additional-initramfs.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * 
 * Crea un initramfs AGGIUNTIVO invece di modificare quello esistente
 * Più sicuro e compatibile con dracut/initramfs-tools
 */

import fs from 'fs'
import path from 'path'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import { exec } from '../../lib/utils.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Crea un initramfs aggiuntivo con solo decrypt-root
 * Non tocca l'initramfs originale!
 */
export async function createDecryptInitramfs(
  this: Ovary,
  outputPath: string,
  rootImgPath: string,
  isoLabel: string = 'ISOIMAGE'  // ← Nuovo parametro

): Promise<void> {
  Utils.warning('Creating additional initramfs for decrypt-root...')
  console.log("outputPath:", outputPath)
  console.log("rootImgPath:", rootImgPath)
  console.log("isoLabel:", isoLabel)

  const workDir = '/tmp/decrypt-initramfs'
  const scriptsDir = path.join(__dirname, '../../../scripts')

  try {
    // 1. Pulisci directory di lavoro
    if (fs.existsSync(workDir)) {
      await exec(`rm -rf ${workDir}`)
    }
    fs.mkdirSync(workDir, { recursive: true })

    // 2. Crea struttura directory minima necessaria
    Utils.warning('Creating directory structure...')
    fs.mkdirSync(`${workDir}/scripts/init-premount`, { recursive: true })
    fs.mkdirSync(`${workDir}/sbin`, { recursive: true })
    fs.mkdirSync(`${workDir}/lib/x86_64-linux-gnu`, { recursive: true })
    fs.mkdirSync(`${workDir}/lib64`, { recursive: true })
    fs.mkdirSync(`${workDir}/usr/lib/x86_64-linux-gnu`, { recursive: true })

    // 3. Copia lo script decrypt-root
    Utils.warning('Installing decrypt-root script...')
    let script = fs.readFileSync(
      path.join(scriptsDir, 'decrypt-root-initramfs.sh'),
      'utf8'
    )
    script = script.replace('__ROOT_IMG_PATH__', rootImgPath)
    script = script.replace('__ISOIMAGE__', isoLabel)

    const scriptPath = `${workDir}/scripts/init-premount/decrypt-root`
    fs.writeFileSync(scriptPath, script)
    fs.chmodSync(scriptPath, 0o755)
    Utils.success('✓ decrypt-root script installed')

    // 4. Copia cryptsetup
    Utils.warning('Installing cryptsetup...')
    await exec(`cp /sbin/cryptsetup ${workDir}/sbin/`)
    fs.chmodSync(`${workDir}/sbin/cryptsetup`, 0o755)

    // 5. Trova e copia tutte le librerie necessarie per cryptsetup
    Utils.warning('Installing cryptsetup dependencies...')
    const lddOutput = (await exec('ldd /sbin/cryptsetup', { 
      capture: true 
    })).data
    
    const libs = lddOutput
      .split('\n')
      .filter(line => line.includes('=>'))
      .map(line => {
        const match = line.match(/=> (.+?) \(/)
        return match ? match[1].trim() : null
      })
      .filter(lib => lib !== null && lib !== '')

    let copiedLibs = 0
    for (const lib of libs) {
      if (lib && fs.existsSync(lib)) {
        const dest = `${workDir}${lib}`
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        await exec(`cp -L ${lib} ${dest}`)  // -L per seguire symlink
        copiedLibs++
      }
    }
    Utils.success(`✓ Copied ${copiedLibs} libraries`)

    // 6. Copia anche il dynamic linker se presente
    const linkerPaths = [
      '/lib64/ld-linux-x86-64.so.2',
      '/lib/ld-linux-x86-64.so.2'
    ]
    
    for (const linker of linkerPaths) {
      if (fs.existsSync(linker)) {
        const dest = `${workDir}${linker}`
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        await exec(`cp -L ${linker} ${dest}`)
        Utils.success(`✓ Copied dynamic linker: ${linker}`)
        break
      }
    }

    // 7. Crea l'initramfs (cpio non compresso per semplicità)
    Utils.warning('Creating initramfs archive...')
    await exec(`cd ${workDir} && find . -print0 | cpio --null -o -H newc --quiet > ${outputPath}`)
    
    // 8. Verifica dimensione
    const stats = fs.statSync(outputPath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    
    Utils.success(`✓ Additional initramfs created: ${outputPath}`)
    Utils.success(`  Size: ${sizeMB} MB`)
    Utils.success(`  This will be loaded AFTER the main initramfs`)

  } catch (error) {
    Utils.error(`Failed to create additional initramfs: ${error}`)
    throw error
  } finally {
    // Cleanup
    if (fs.existsSync(workDir)) {
      await exec(`rm -rf ${workDir}`).catch(() => {})
    }
  }
}

/**
 * Modifica isolinux.cfg per caricare entrambi gli initramfs
 */
export async function updateIsolinuxForMultipleInitramfs(
  this: Ovary,
  isolinuxCfgPath: string,
  mainInitramfs: string = 'initrd.img',
  additionalInitramfs: string = 'initrd-decrypt.img'
): Promise<void> {
  Utils.warning('Updating isolinux.cfg for multiple initramfs...')
  console.log(`isolinuxCfgPath: ${isolinuxCfgPath}`)
  console.log(`mainInitramfs: ${mainInitramfs}`)
  console.log(`additionalInitramfs; ${additionalInitramfs}`)

  if (!fs.existsSync(isolinuxCfgPath)) {
    Utils.warning('isolinux.cfg not found, skipping...')
    return
  }

  let content = fs.readFileSync(isolinuxCfgPath, 'utf8')

  // Cerca la riga initrd e sostituiscila con entrambi
  const initrdRegex = /initrd=\/live\/[^\s]+/g
  const newInitrd = `initrd=/live/${mainInitramfs},/live/${additionalInitramfs}`

  if (content.match(initrdRegex)) {
    content = content.replace(initrdRegex, newInitrd)
    fs.writeFileSync(isolinuxCfgPath, content)
    Utils.success('✓ isolinux.cfg updated with multiple initramfs')
  } else {
    Utils.warning('Could not find initrd line in isolinux.cfg')
  }
}

/**
 * Modifica grub.cfg per caricare entrambi gli initramfs
 */
export async function updateGrubForMultipleInitramfs(
  this: Ovary,
  grubCfgPath: string,
  mainInitramfs: string = 'initrd.img',
  additionalInitramfs: string = 'initrd-decrypt.img'
): Promise<void> {
  Utils.warning('Updating grub.cfg for multiple initramfs...')

  console.log(`grubCfgPath: ${grubCfgPath}`)
  console.log(`mainInitramfs: ${mainInitramfs}`)
  console.log(`additionalInitramfs; ${additionalInitramfs}`)

  if (!fs.existsSync(grubCfgPath)) {
    Utils.warning('grub.cfg not found, skipping...')
    return
  }

  let content = fs.readFileSync(grubCfgPath, 'utf8')

  // Cerca le righe initrd e aggiungine una nuova dopo
  const initrdRegex = /(initrd\s+\/live\/[^\n]+)/g
  
  content = content.replace(initrdRegex, (match) => {
    if (!match.includes(additionalInitramfs)) {
      return `${match}\n\tinitrd /live/${additionalInitramfs}`
    }
    return match
  })

  fs.writeFileSync(grubCfgPath, content)
  Utils.success('✓ grub.cfg updated with multiple initramfs')
}