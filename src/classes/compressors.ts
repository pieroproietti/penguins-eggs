/**
 * ./src/classes/compressors.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx from 'shelljs'

export default class Compressors {
  dest = '/tmp/eggs-mksquash-dest'

  isEnabled = {
    error: false,
    gzip: true,
    lz4: false,
    lzma: false,
    lzo: false,
    xz: false,
    zstd: false
  }

  source = '/tmp/eggs-mksquash-test'

  /**
   * fast compression
   * @returns
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
   * @returns
   */
  max(): string {
    let filter = 'x86'
    if (process.arch === 'arm64') {
      filter = 'arm'
    }

    const options = '-b 1M -no-duplicates -no-recovery -always-use-fragments'
    if (process.arch === 'ia32') {
      // options = '-b 1M'
    }

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
   * standard
   * @returns
   */
  standard(): string {
    const comp = 'xz -b 1M'
    return comp
  }

  /**
   * check mksquashfs exists
   * @param compressor
   * @returns
   */
  private async check(compressor: string): Promise<boolean> {
    let result = false

    const { stderr } = shx.exec('mksquashfs ' + this.source + ' ' + this.dest + ' -comp ' + compressor + ' -no-xattrs -ef ' + this.dest, { silent: true })
    if (stderr === '') {
      result = true
    }

    return result
  }

  /**
   * prepareCheck
   */
  private async prepareCheck() {
    shx.exec('rm -rf ' + this.source, { silent: true })
    shx.exec('mkdir ' + this.source, { silent: true })
  }

  /**
   * removeCheck
   */
  private async removeCheck() {
    shx.exec('rm -rf ' + this.source, { silent: true })
    shx.exec('rm -f  ' + this.dest, { silent: true })
  }
}
