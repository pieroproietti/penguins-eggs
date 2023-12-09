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

  /**
   * populate
   */
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

  /**
   * fast
   * @returns 
   */
  fast(): string {
    let comp = 'gzip'
    if (this.isEnabled.zstd) {
      comp = 'zstd -b 256K -Xcompression-level 1'
    } else if (this.isEnabled.lz4) {
      comp = 'lz4'
    }
    return comp
  }

  /**
   * standard
   * @returns 
   */
  standard(): string {
    let comp = 'xz -b 256K'
    return comp
  }

  /**
   * max 
   * @returns
   */
  max(): string {
    let comp = 'xz -Xbcj x86 -b 256K -no-duplicates -no-recovery -always-use-fragments'
    if (process.arch === 'arm64') {
      /**
       * comp = 'xz -Xbcj arm -b 1M -no-duplicates -no-recovery -always-use-fragments' 
       *      I removed -Xbcj arm per problemi di memoria
       */
      comp = 'xz -b 256K -no-duplicates -no-recovery -always-use-fragments'
    }
    return comp
  }

  /**
   * prepareCheck
   */
  private async prepareCheck() {
    shx.exec('rm -rf ' + this.source, {silent: true})
    shx.exec('mkdir ' + this.source, {silent: true})
  }

  /**
   * removeCheck
   */
  private async removeCheck() {
    shx.exec('rm -rf ' + this.source, {silent: true})
    shx.exec('rm -f  ' + this.dest, {silent: true})
  }

  /**
   * check mksquashfs exists
   * @param compressor 
   * @returns 
   */
  private async check(compressor: string): Promise<boolean> {
    let result = false

    const stderr = shx.exec('mksquashfs ' + this.source + ' ' + this.dest + ' -comp ' + compressor + ' -ef ' + this.dest, {silent: true}).stderr
    if (stderr === '') {
      result = true
    }
    return result
  }
}
