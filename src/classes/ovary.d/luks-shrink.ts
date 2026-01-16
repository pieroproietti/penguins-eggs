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

import { exec } from '../../lib/utils.js'
// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'

const noop = () => { };
type ConditionalLoggers = {
  info: (msg: string) => void;
  log: (...args: any[]) => void;
  success: (msg: string) => void;
  warning: (msg: string) => void;
}

/**
 * luksShrink
 * Riduce in sicurezza un volume LUKS (root o home) minimizzando lo spazio
 * ma garantendo l'integrità dei dati e l'allineamento dei blocchi.
 */
export async function luksShrink(this: Ovary) {

  const loggers: ConditionalLoggers = {
    info: this.hidden ? noop : Utils.info,
    log: this.hidden ? noop : console.log,
    success: this.hidden ? noop : Utils.success,
    warning: this.hidden ? noop : Utils.warning,
  };

  const { info, log, success, warning } = loggers;

  warning(`Unmounting ${this.luksMountpoint} to perform shrinking...`)
  // Usa -l (lazy) se necessario, ma meglio umount pulito
  await exec(`umount ${this.luksMountpoint}`, this.echo)
  
  // 1. Controllo integrità (CRUCIALE per homecrypt: ripara eventuali errori prima di ridimensionare)
  warning(`Checking filesystem integrity...`)
  await exec(`e2fsck -f -y ${this.luksDevice}`, this.echo)
  
  // 2. Riduzione del filesystem al minimo
  warning(`Shrinking filesystem to minimum size...`)
  // resize2fs -M è sicuro se poi lasciamo margine nel contenitore
  await exec(`resize2fs -M ${this.luksDevice}`, this.echo)
  
  // 3. Calcolo della nuova dimensione del filesystem
  warning(`Calculating new sizes...`)
  
  const tuneOutput = (await exec(`tune2fs -l ${this.luksDevice}`, { capture: true })).data
  
  const blockSizeMatch = tuneOutput.match(/Block size:\s+(\d+)/)
  const blockCountMatch = tuneOutput.match(/Block count:\s+(\d+)/)
  
  if (!blockSizeMatch || !blockCountMatch) {
    throw new Error("Could not determine filesystem size from tune2fs")
  }
  
  const blockSize = Number.parseInt(blockSizeMatch[1], 10)
  const blockCount = Number.parseInt(blockCountMatch[1], 10)
  const fsSizeBytes = blockSize * blockCount
  
  warning(`Actual Ext4 payload size: ${bytesToGB(fsSizeBytes)}`)

  // 4. Calcolo dell'offset LUKS (Header size)
  const statusOutput = (await exec(`cryptsetup status ${this.luksMappedName}`, { capture: true })).data
  const offsetMatch = statusOutput.match(/offset:\s+(\d+)\s+sectors/)
  
  let luksHeaderBytes = 0
  if (offsetMatch && offsetMatch[1]) {
    luksHeaderBytes = Number.parseInt(offsetMatch[1], 10) * 512
    warning(`Detected LUKS header: ${bytesToGB(luksHeaderBytes)}`)
  } else {
    luksHeaderBytes = 32 * 1024 * 1024 // Fallback 32MB
    warning(`Could not detect LUKS offset, using safe fallback: 32MB`)
  }
  
  // 5. Calcolo dimensione finale SICURA
  // Usiamo 200MB di margine. Su una ISO da 4GB è il 5%, un prezzo onesto per la stabilità.
  // Questo spazio extra protegge sia lo squashfs (root) che i metadati sparsi (home).
  const safetyMargin = 200 * 1024 * 1024 
  
  const rawFinalSize = fsSizeBytes + luksHeaderBytes + safetyMargin

  // ALLINEAMENTO A 1MB: Fondamentale per evitare errori di I/O su device fisici o loop
  const alignBlock = 1024 * 1024; 
  const finalFileSize = Math.ceil(rawFinalSize / alignBlock) * alignBlock;
  
  warning(`------------------------------------------------`)
  warning(`SAFE SHRINK CALCULATION:`)
  warning(`  FS Payload:   ${bytesToGB(fsSizeBytes)}`)
  warning(`  LUKS Header:  ${bytesToGB(luksHeaderBytes)}`)
  warning(`  SafetyMargin: ${bytesToGB(safetyMargin)}`)
  warning(`  Alignment:    1 MB`)
  warning(`  FINAL SIZE:   ${bytesToGB(finalFileSize)}`)
  warning(`------------------------------------------------`)

  // 6. Chiusura volume
  warning(`Closing LUKS volume ${this.luksMappedName}...`)
  await this.luksExecuteCommand('cryptsetup', ['close', this.luksMappedName])
  
  // 7. Truncate finale
  warning(`Truncating ${this.luksFile} to release unused space...`)
  await exec(`truncate -s ${finalFileSize} ${this.luksFile}`, this.echo)
}

function bytesToGB(bytes: number): string {
  if (bytes === 0) return '0.00 GB';
  const gigabytes = bytes / (1024 * 1024 * 1024);
  return gigabytes.toFixed(2) + ' GB';
}
