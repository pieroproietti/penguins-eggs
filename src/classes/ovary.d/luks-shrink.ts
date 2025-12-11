/**
 * ./src/classes/ovary.d/luks-shrink.ts
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

const noop = () => { };
type ConditionalLoggers = {
  log: (...args: any[]) => void;
  warning: (msg: string) => void;
  success: (msg: string) => void;
  info: (msg: string) => void;
}

/**
 * 
 * @param this 
 */
export async function luksShrink(this: Ovary) {

    const loggers: ConditionalLoggers = {
        log: this.hidden ? noop : console.log,
        warning: this.hidden ? noop : Utils.warning,
        success: this.hidden ? noop : Utils.success,
        info: this.hidden ? noop : Utils.info,
    };

    const { log, warning, success, info } = loggers;

      warning(`Unmounting ${this.luksMountpoint} to perform shrinking...`)
      await exec(`umount ${this.luksMountpoint}`, this.echo)
  
      // 1. Controllo integrità (obbligatorio prima del resize)
      warning(`Checking filesystem integrity...`)
      await exec(`e2fsck -f -y ${this.luksDevice}`, this.echo)
  
      // 2. Riduzione del filesystem al minimo
      warning(`Shrinking filesystem to minimum size...`)
      await exec(`resize2fs -M ${this.luksDevice}`, this.echo)
  
      // 3. Calcolo della nuova dimensione del filesystem
      warning(`Calculating new sizes...`)
  
      // Usiamo tune2fs per ottenere block count e block size in modo pulito
      const tuneOutput = (await exec(`tune2fs -l ${this.luksDevice}`, { capture: true })).data
  
      const blockSizeMatch = tuneOutput.match(/Block size:\s+(\d+)/)
      const blockCountMatch = tuneOutput.match(/Block count:\s+(\d+)/)
  
      if (!blockSizeMatch || !blockCountMatch) {
        throw new Error("Could not determine filesystem size from tune2fs")
      }
  
      const blockSize = parseInt(blockSizeMatch[1], 10)
      const blockCount = parseInt(blockCountMatch[1], 10)
      const fsSizeBytes = blockSize * blockCount
  
      // 4. Calcolo dell'offset LUKS (Header size) senza usare l'helper
      // Eseguiamo cryptsetup status direttamente e catturiamo l'output
      const statusOutput = (await exec(`cryptsetup status ${this.luksMappedName}`, { capture: true })).data
  
      // Cerchiamo la riga "offset:  4096 sectors"
      const offsetMatch = statusOutput.match(/offset:\s+(\d+)\s+sectors/)
  
      let luksHeaderBytes = 0
      if (offsetMatch && offsetMatch[1]) {
        // I settori in questo contesto sono sempre 512 bytes
        luksHeaderBytes = parseInt(offsetMatch[1], 10) * 512
        warning(`Detected LUKS header: ${bytesToGB(luksHeaderBytes)}`)
      } else {
        // Fallback sicuro: LUKS2 usa max 16MB, mettiamo 32MB per stare larghi
        luksHeaderBytes = 32 * 1024 * 1024
        warning(`Could not detect LUKS offset, using safe fallback: 32MB`)
      }
  
      // 5. Calcolo dimensione finale + Margine di sicurezza
      // Aggiungiamo 50MB extra per evitare errori di arrotondamento o metadati
      const safetyMargin = 50 * 1024 * 1024
      const finalFileSize = fsSizeBytes + luksHeaderBytes + safetyMargin
  
      warning(`Final minimized size: ${bytesToGB(finalFileSize)}`)
  
      // 6. Chiusura volume
      warning(`Closing LUKS volume ${this.luksMappedName}...`)
      await this.luksExecuteCommand('cryptsetup', ['close', this.luksMappedName])
  
      // 7. Truncate finale
      warning(`Truncating ${this.luksFile} to release unused space...`)
      await exec(`truncate -s ${finalFileSize} ${this.luksFile}`, this.echo)
}

/**
 * Converte bytes in gigabytes per la visualizzazione.
 */
function bytesToGB(bytes: number): string {
  if (bytes === 0) return '0.00 GB';
  const gigabytes = bytes / (1024 * 1024 * 1024);
  return gigabytes.toFixed(2) + ' GB';
}
