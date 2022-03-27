import { exec } from '../lib/utils'
import fs from 'fs'

/**
 * /usr/share/X11/xkb/rules/xorg.lst 
 */
export default class Keyboard {
    
    /**
     * 
     */
    async getOptions(): Promise<string[]> {
        const cmd = `localectl list-x11-keymap-options `
        let keyboardOptions: string[] = []
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            const lines = result.data.split('\n')
            for (const line of lines) {
                keyboardOptions.push(line.trim())
            }
        }
        return keyboardOptions
    }

    /**
     * 
     */
    async getVariants(keyboardLayout = 'en'): Promise<string[]> {
        const cmd = `localectl list-x11-keymap-variants ${keyboardLayout}`
        let keyboardVariants: string[] = []
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            const lines = result.data.split('\n')
            for (const line of lines) {
                keyboardVariants.push(line.trim())
            }
        }
        return keyboardVariants
    }

    /**
     * 
     */
    async getLayouts(): Promise<string[]> {
        const cmd = `localectl list-x11-keymap-layouts`
        let keybordLayouts: string[] = []
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            const lines: string [] = result.data.split('\n')
            for (const line of lines) {
                keybordLayouts.push(line.trim())
            }
        }
        return keybordLayouts
    }
    /**
     * 
     */
    async getModels(): Promise<string[]> {
        const cmd = `localectl list-x11-keymap-models`
        let keyboardModels: string[] = []
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            const lines = result.data.split('\n')
            for (const line of lines) {
                keyboardModels.push(line.trim())
            }
        }
        return keyboardModels
    }

    /**
     * 
     */
    async getVariant(): Promise<string> {
        const file = '/etc/default/keyboard'

        const cmd = `grep XKBVARIANT < ${file} | cut -f2 -d=|cut -f2 "-d\\""`
        let keyboardVariant = 'pc195'
        if (fs.existsSync(file)) {
            const result = await exec(cmd, { capture: true, echo: false, ignore: false })
            if (result.code === 0) {
                keyboardVariant = result.data.trim()
            }
        }
        return keyboardVariant
    }


    /**
     * 
     */
    async getLayout(): Promise<string> {
        const file = '/etc/default/keyboard'

        const cmd = `grep XKBLAYOUT < /etc/default/keyboard | cut -f2 -d= | cut -f2 "-d\\""`
        let keyboardLayout = 'pc195'
        if (fs.existsSync(file)) {
            const result = await exec(cmd, { capture: true, echo: false, ignore: false })
            if (result.code === 0) {
                keyboardLayout = result.data.trim()
            }
        }
        return keyboardLayout
    }

    /**
     * 
     */
    async getModel(): Promise<string> {
        const file = '/etc/default/keyboard'
        const cmd = `grep XKBMODEL < ${file} |cut -f2 -d= | cut -f2 "-d\\""`
        let keyboardModel = 'pc195'
        if (fs.existsSync(file)) {
            const result = await exec(cmd, { capture: true, echo: false, ignore: false })
            if (result.code === 0) {
                keyboardModel = result.data.trim()
            }
        }
        return keyboardModel
    }

    /**
     * 
     */
    async getOption(): Promise<string> {
        const file = '/etc/default/keyboard'
        const cmd = `grep XKBOPTIONS < ${file} | cut -f2 -d= | cut -f2 "-d\\""`
        let keyboardOption = ''
        if (fs.existsSync(file)) {
            const result = await exec(cmd, { capture: true, echo: false, ignore: false })
            if (result.code === 0) {
                keyboardOption = result.data.trim()
            }
        }
        return keyboardOption
    }
}





