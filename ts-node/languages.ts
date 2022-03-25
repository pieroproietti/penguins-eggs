#!/usr/bin/env ts-node


import { exec } from '../src/lib/utils'
import Utils from '../src/classes/utils'
import fs, { existsSync } from 'fs'

main()

async function main() {
    Utils.titles()

    /*
    locale-ctl
    list-locales             Show known locales
    set-keymap MAP [MAP]     Set console and X11 keyboard mappings
    list-keymaps             Show known virtual console keyboard mappings
    set-x11-keymap LAYOUT [MODEL [VARIANT [OPTIONS]]]
                           Set X11 and console keyboard mappings
    list-x11-keymap-models   Show known X11 keyboard mapping models
    list-x11-keymap-layouts  Show known X11 keyboard mapping layouts
    list-x11-keymap-variants [LAYOUT]
                           Show known X11 keyboard mapping variants
      list-x11-keymap-options       Show known X11 keyboard mapping options
    */

    const enabledLocales = await getEnabledLocales()
    const supportedLocales = await getSupportedLocales()
    const defaultLocale = await getDefaultLocale()


    console.log('Locales:')
    console.log(`-enabled: ${enabledLocales}`)
    console.log(`-supported: ${supportedLocales}`)
    console.log(`-default: ${defaultLocale}`)

    const keyboardModel = await getKeyboardModel()
    const keyboardLayout = await getkeybordLayout()
    const keyboardVariant = await getKeyboardVariant()
    const keyboardOptions = await getKeyboardOptions()

    console.log('keyboard:')
    console.log(`- model: ${keyboardModel}`)
    console.log('- keyboardModels: []')
    console.log(`- layout: ${keyboardLayout}`)
    console.log(`-variant: ${keyboardVariant}`)
    console.log(`-options: ${keyboardOptions}`)
}


async function getEnabledLocales() : Promise < string []> {
    const cmd = `localectl list-locales`
    let enabledLocales = []
    const result = await exec(cmd, { capture: true, echo: false, ignore: false })
    if (result.code === 0) {
        const lines = result.data.split('/n')
        for (const line of lines) {
            enabledLocales.push(line)
        }
    }
    return enabledLocales
}

async function getKeyboardOptions() : Promise <string> {
    const file = '/etc/default/keyboard'
    const cmd =`grep XKBOPTIONS < ${file} | cut -f2 -d= | cut -f2 "-d\\""`
    let keyboardOptions = ''
    if (fs.existsSync(file)) {
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            keyboardOptions = result.data
        }
    }
    return keyboardOptions
}




/**
 * 
 * @returns keyboardVariant
 */
async function getKeyboardVariant() : Promise <string> {
    const file = '/etc/default/keyboard'

    const cmd =`grep XKBVARIANT < ${file} | cut -f2 -d=|cut -f2 "-d\\""`
    let keyboardVariant = 'pc195'
    if (fs.existsSync(file)) {
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            keyboardVariant = result.data
        }
    }
    return keyboardVariant
}
    

/**
 * 
 * @returns 
 */
async function getkeybordLayout() : Promise <string> {
    const file = '/etc/default/keyboard'

    const cmd =`grep XKBLAYOUT < /etc/default/keyboard | cut -f2 -d= | cut -f2 "-d\\""`
    let keyboardLayout = 'pc195'
    if (fs.existsSync(file)) {
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            keyboardLayout = result.data
        }
    }
    return keyboardLayout
}

/**
 * 
 */
async function getKeyboardModel() : Promise <string> {
    const file = '/etc/default/keyboard'
    const cmd =`grep XKBMODEL < ${file} |cut -f2 -d= | cut -f2 "-d\\""`
    let keyboardModel = 'pc195'
    if (fs.existsSync(file)) {
        const result = await exec(cmd, { capture: true, echo: false, ignore: false })
        if (result.code === 0) {
            keyboardModel = result.data
        }
    }
    return keyboardModel
}





/**
 * 
 * @returns getSuppertedLocales
 */
async function getSupportedLocales(): Promise<string[]> {
    const file = '/usr/share/i18n/SUPPORTED'
    const cmd = `cut -f1 -d.|grep UTF-0 < ${file}`
    let lines: string[] = []
    if (fs.existsSync(file)) {
        lines = fs.readFileSync(file, 'utf-8').split('\n')
        // for (const line of lines) {
        //}
    }
    return lines
}


/**
 * 
 * @returns getDefaultLanguage
 */
async function getDefaultLocale(): Promise<string> {
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
