/**
 * ./src/classes/ovary.d/luks-root-inject.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import path from 'path'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import { exec } from '../../lib/utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Inietta lo script decrypt-root direttamente nell'initramfs già generato
 * Senza usare hook, modifica manualmente il file initrd
 */
export async function injectDecryptScriptInInitramfs(
  this: Ovary,
  initramfsPath: string,
  rootImgPath: string
): Promise<void> {
  console.log('Injecting decrypt-root script into initramfs...')
  console.log("initramfsPath:", initramfsPath)
  console.log("rootImgPath:", rootImgPath)

  const workDir = '/tmp/initramfs-work'
  const scriptsDir = path.join(__dirname, '../../../scripts')

  try {
    // 1. Pulisci directory di lavoro
    if (fs.existsSync(workDir)) {
      await exec(`rm -rf ${workDir}`)
    }
    fs.mkdirSync(workDir, { recursive: true })

    // Rileva il formato di compressione
    Utils.warning('Detecting initramfs compression format...')
    const fileType = (await exec(`file ${initramfsPath}`, { capture: true })).data

    let decompressCmd = ''
    if (fileType.includes('gzip')) {
      decompressCmd = 'zcat'
    } else if (fileType.includes('XZ')) {
      decompressCmd = 'xzcat'
    } else if (fileType.includes('Zstandard')) {
      decompressCmd = 'zstdcat'
    } else if (fileType.includes('LZMA')) {
      decompressCmd = 'lzcat'
    } else if (fileType.includes('ASCII cpio')) {
      decompressCmd = 'cat'  // Non compresso
    } else {
      throw new Error(`Unknown initramfs format: ${fileType}`)
    }

    Utils.warning(`Format detected: ${decompressCmd}`)

    // 2. Estrai l'initramfs
    Utils.warning('Extracting initramfs...')
    await exec(`cd ${workDir} && ${decompressCmd} ${initramfsPath} | cpio -idm`)

    // 3. Leggi e prepara lo script decrypt-root
    let decryptScript = fs.readFileSync(
      path.join(scriptsDir, 'decrypt-root-initramfs.sh'),
      'utf8'
    )
    decryptScript = decryptScript.replace('__ROOT_IMG_PATH__', rootImgPath)

    // 4. Crea la directory scripts se non esiste
    const scriptsInitramfsDir = path.join(workDir, 'scripts/init-premount')
    fs.mkdirSync(scriptsInitramfsDir, { recursive: true })

    // 5. Scrivi lo script
    const scriptPath = path.join(scriptsInitramfsDir, 'decrypt-root')
    fs.writeFileSync(scriptPath, decryptScript)
    fs.chmodSync(scriptPath, 0o755)
    Utils.warning(`✓ Script injected: ${scriptPath}`)

    // 6. Verifica che cryptsetup sia presente nell'initramfs
    const cryptsetupPath = path.join(workDir, 'sbin/cryptsetup')
    if (!fs.existsSync(cryptsetupPath)) {
      Utils.warning('cryptsetup not found in initramfs, adding it...')
      
      // Copia cryptsetup
      fs.mkdirSync(path.join(workDir, 'sbin'), { recursive: true })
      await exec(`cp /sbin/cryptsetup ${cryptsetupPath}`)
      fs.chmodSync(cryptsetupPath, 0o755)
          
      // Copia librerie necessarie (trova con ldd)
      const lddOutput = (await exec('ldd /sbin/cryptsetup', {
        capture: true
      })).data
          
      const libs = lddOutput
        .split('\n')
        .filter(line => line.includes('=>'))
        .map(line => {
          const match = line.match(/=> (.+) \(/)
          return match ? match[1].trim() : null
        })
        .filter(lib => lib !== null)

      for (const lib of libs) {
        if (lib && fs.existsSync(lib)) {
          const libDest = path.join(workDir, lib.substring(1))
          fs.mkdirSync(path.dirname(libDest), { recursive: true })
          await exec(`cp ${lib} ${libDest}`)
        }
      }
      
      Utils.warning('✓ cryptsetup and dependencies added')
    } else {
      Utils.warning('✓ cryptsetup already present in initramfs')
    }

    // 7. Ricomprimi l'initramfs
    Utils.warning('Recompressing initramfs...')
    await exec(`cd ${workDir} && find . | cpio -o -H newc | gzip > ${initramfsPath}.new`)

    
    // 8. Sostituisci il vecchio initramfs
    await exec(`mv ${initramfsPath}.new ${initramfsPath}`)
    
    Utils.success('✓ Initramfs successfully modified')

  } catch (error) {
    Utils.error(`Failed to inject script: ${error}`)
    throw error
  } finally {
    // Cleanup
    if (fs.existsSync(workDir)) {
      await exec(`rm -rf ${workDir}`).catch(() => {})
    }
  }
}