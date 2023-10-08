/**
 * penguins-eggs
 * class: compressor.ts
 * test available compressor
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import shx from 'shelljs'

export default class Compressors {
  isEnabled = {
    error: false,
    gzip: true,
    lzma: false,
    lzo: false,
    lz4: false,
    xz: false,
    zstd: false,
  }

  source = '/tmp/eggs-mksquash-test'
  dest = '/tmp/eggs-mksquash-dest'

  async populate() {
    await this.prepareCheck()
    this.isEnabled.error = await this.check('error')
    this.isEnabled.lzma = await this.check('lzma')
    this.isEnabled.lzo = await this.check('lzo')
    this.isEnabled.lz4 = await this.check('lz4')
    this.isEnabled.xz = await this.check('xz')
    this.isEnabled.zstd = await this.check('zstd')
    await this.removeCheck()
  }

  // fastest
  fast(): string {
    let comp = 'gzip'
    if (this.isEnabled.zstd) {
      comp = 'zstd -b 256K -Xcompression-level 1'
    } else if (this.isEnabled.lz4) {
      comp = 'lz4'
    }
    return comp
  }

  // normal
  normal(): string {
    let comp = 'xz'
    if (this.isEnabled.zstd) {
      comp = 'zstd -b 256K -Xcompression-level 20'
    } else {
      comp = 'xz -b 256K'
    }
    return comp
  }

  /**
   * max
   * @returns
   */
  max(): string {
    let comp = 'xz -b 256K -Xbcj x86'
    if (process.arch === 'arm64') {
      comp = 'xz -b 256K' // -Xbcj arm  NOT work 
    }
    return comp
  }

  private async prepareCheck() {
    shx.exec('rm -rf ' + this.source, {silent: true})
    shx.exec('mkdir ' + this.source, {silent: true})
  }

  private async removeCheck() {
    shx.exec('rm -rf ' + this.source, {silent: true})
    shx.exec('rm -f  ' + this.dest, {silent: true})
  }

  private async check(compressor: string): Promise<boolean> {
    let result = false

    const stderr = shx.exec('mksquashfs ' + this.source + ' ' + this.dest + ' -comp ' + compressor + ' -ef ' + this.dest, {silent: true}).stderr
    if (stderr === '') {
      result = true
    }

    return result
  }
}
