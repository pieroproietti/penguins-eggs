/**
 * ./src/classes/compressors.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs';
import { execSync } from '../lib/utils.js'; // Assicurati che il path sia corretto

export default class Compressors {
  dest = '/tmp/eggs-mksquash-dest'
  source = '/tmp/eggs-mksquash-test'

  isEnabled = {
    error: false,
    gzip: true,
    lz4: false,
    lzma: false,
    lzo: false,
    xz: false,
    zstd: false
  }

  /**
   * fast compression
   */
  fast(): string {
    let comp = 'gzip'
    if (this.isEnabled.zstd) {
      comp = 'zstd -b 1M -Xcompression-level 3'
    } else if (this.isEnabled.lz4) {
      comp = 'lz4'
    }

    return comp
  }

  /**
   * max
   */
  max(): string {
    let filter = 'x86'
    if (process.arch === 'arm64') {
      filter = 'arm'
    }

    const options = '-b 1M -no-duplicates -no-recovery -always-use-fragments'
    // if (process.arch === 'ia32') { options = '-b 1M' }

    const comp = `xz -Xbcj ${filter} ${options}`
    return comp
  }

  pendrive(level = '15'): string {
    let comp = 'gzip'
    if (this.isEnabled.zstd) {
      comp = `zstd -b 1M -Xcompression-level ${level}`
    } else if (this.isEnabled.lz4) {
      comp = 'lz4'
    }

    return comp
  }

  /**
   * populate
   * Manteniamo async per compatibilità con chi lo chiama,
   * ma internamente ora è tutto sincrono e veloce.
   */
  async populate() {
    this.prepareCheck()
    
    // Non serve await perché check ora è sincrono
    this.isEnabled.error = this.check('error')
    this.isEnabled.lzma = this.check('lzma')
    this.isEnabled.lzo = this.check('lzo')
    this.isEnabled.lz4 = this.check('lz4')
    this.isEnabled.xz = this.check('xz')
    this.isEnabled.zstd = this.check('zstd')
    
    this.removeCheck()
  }

  /**
   * standard
   */
  standard(): string {
    const comp = 'xz -b 1M'
    return comp
  }

  /**
   * check mksquashfs exists and supports compressor
   */
  private check(compressor: string): boolean {
    let result = false
    try {
      // ignore: true silenzia output (stdio='ignore')
      // Se mksquashfs fallisce (exit code != 0), execSync lancia un errore
      execSync(`mksquashfs ${this.source} ${this.dest} -comp ${compressor} -no-xattrs -ef ${this.dest}`, { ignore: true });
      result = true
    } catch (error: any) {
      // Fallito (comando non trovato o compressore non supportato)
      result = false
    }    
    return result
  }

  /**
   * prepareCheck: Usa FS nativo invece di shelljs
   */
  private prepareCheck() {
    // rm -rf
    if (fs.existsSync(this.source)) {
      fs.rmSync(this.source, { recursive: true, force: true });
    }
    // mkdir -p
    fs.mkdirSync(this.source, { recursive: true });
  }

  /**
   * removeCheck: Usa FS nativo invece di shelljs
   */
  private removeCheck() {
    // rm -rf source
    if (fs.existsSync(this.source)) {
      fs.rmSync(this.source, { recursive: true, force: true });
    }
    // rm -f dest
    if (fs.existsSync(this.dest)) {
      fs.rmSync(this.dest, { recursive: true, force: true });
    }
  }
}