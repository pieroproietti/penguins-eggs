/**
 * 
 * @param theme 
 * @param isClone 
 */

import fs from 'fs'
import shx from 'shelljs'
import { displaymanager } from './displaymanager'
import Utils from '../../utils'
import { ISettings } from '../../../interfaces/i-settings'

/**
 * 
 * @param src 
 * @param dest 
 * @param theme 
 * @param isClone 
 */
export async function settings(src: string, dest: string, theme = 'eggs', isClone = false) {
    let branding = theme
    let settingsSrc = src + 'settings.yml'
    if (theme.includes('/')) {
        branding = theme.slice(Math.max(0, theme.lastIndexOf('/') + 1))
        if (fs.existsSync(`${theme}/theme/calamares/settings.yml`)) {
            settingsSrc = `${theme}/theme/calamares/settings.yml`
        } else {
            console.log(`cannot find: ${theme}/theme/calamares/settings.yml`)
        }
    }

    const settingsDest = dest + 'settings.conf'
    shx.cp(settingsSrc, settingsDest)
    let hasSystemd = '# '
    if (Utils.isSystemd()) {
        hasSystemd = '- '
    }

    let createUsers = '- '
    if (isClone) {
        createUsers = '# '
    }

    let hasDisplaymanager = '# '
    if (displaymanager() !== '') {
        hasDisplaymanager = '- '
    }

    shx.sed('-i', '{{hasSystemd}}', hasSystemd, settingsDest)
    shx.sed('-i', '{{hasDisplaymanager}}', hasDisplaymanager, settingsDest)
    shx.sed('-i', '{{branding}}', branding, settingsDest)
    shx.sed('-i', '{{createUsers}}', createUsers, settingsDest)

}
