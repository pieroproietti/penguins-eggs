/**
 * luks-root-bootstrap-builder.ts
 * 
 * Crea un filesystem.squashfs bootstrap completo con Debian
 * per sbloccare il sistema principale cifrato
 */

import fs from 'fs'
import path from 'path'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import { exec } from '../../lib/utils.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Crea il filesystem bootstrap completo
 */
export async function createBootstrapFilesystem(
  this: Ovary,
  outputSquashfs: string
): Promise<void> {

  Utils.warning('Creating full Debian bootstrap filesystem...')
  Utils.warning('This will take several minutes...')

  const scriptsDir = path.join(__dirname, '../../../scripts')
  const createScript = path.join(scriptsDir, 'luks-root-bootstrap-create.sh')
  const unlockScript = path.join(scriptsDir, 'luks-root-unlock.sh')

  // Verifica che gli script esistano
  if (!fs.existsSync(createScript)) {
    throw new Error(`Build script not found: ${createScript}`)
  }

  if (!fs.existsSync(unlockScript)) {
    throw new Error(`Unlock script not found: ${unlockScript}`)
  }

  try {
    // Esegui lo script di creazione bash
    Utils.warning('Executing bootstrap creation script...')
    await exec(`bash ${createScript} ${outputSquashfs} ${unlockScript}`, {echo: true})

    // Verifica che il file sia stato creato
    if (!fs.existsSync(outputSquashfs)) {
      throw new Error('Bootstrap filesystem was not created')
    }

    const stats = fs.statSync(outputSquashfs)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)

    Utils.success(`✓ Bootstrap filesystem created: ${sizeMB} MB`)
    Utils.success('  Full Debian system with systemd and encrypted root unlock')

  } catch (error) {
    Utils.error(`Failed to create bootstrap filesystem: ${error}`)
    throw error
  }
}