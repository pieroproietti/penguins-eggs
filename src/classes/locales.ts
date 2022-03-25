import { exec } from '../lib/utils'
import fs from 'fs'

export default class Locales {

    /**
     * 
     */
     async getEnabled(): Promise<string[]> {
        const cmd = `localectl list-locales`
        let enabledLocales: string[] = []
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            const lines = result.data.split('/n')
            for (const line of lines) {
                enabledLocales.push(line.trim())
            }
        }
        return enabledLocales
    }

    /**
     * 
     */
     async getSupported(): Promise<string[]> {
        const file = '/usr/share/i18n/SUPPORTED'
        const cmd = `cut -f1 -d.|grep UTF-0 < ${file}`
        let lines: string[] = []
        if (fs.existsSync(file)) {
            lines = fs.readFileSync(file, 'utf-8').split('\n')
        }
        return lines
    }

    /**
     * 
     */
     async getDefault(): Promise<string> {
        const file = '/etc/default/locale'
        const cmd = `grep LANG < ${file}|cut -f2 -d=`
        let defaultLanguage = ""
        if (fs.existsSync(file)) {
            const result = await exec(cmd, { capture: true, echo: false, ignore: false })
            if (result.code === 0) {
                defaultLanguage = result.data
            }
        }
        return defaultLanguage
    }
}

