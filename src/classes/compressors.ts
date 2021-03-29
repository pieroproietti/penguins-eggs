
import { string } from '@oclif/command/lib/flags'
import { restoreDefaultPrompts } from 'inquirer'
import shx = require('shelljs')

export default class Compressors {
    isEnabled = {
        "error": false,
        "gzip": true,
        "lzma": false,
        "lzo": false,
        "lz4": false,
        "xz": false,
        "zstd": false,
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

        let stderr = shx.exec('mksquashfs ' + this.source + ' ' + this.dest + ' -comp ' + compressor + ' -ef ' + this.dest, {silent: true}).stderr
        if (stderr === "") {
            result = true
        }
        return result
    }



}

