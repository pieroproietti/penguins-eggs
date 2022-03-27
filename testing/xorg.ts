#!/usr/bin/env ts-node

import { exec } from '../src/lib/utils'
import Utils from '../src/classes/utils'
import fs from 'fs'
import yaml from 'js-yaml'
import { REPL_MODE_SLOPPY } from 'repl'
import { exit } from 'process'
import { string } from '@oclif/core/lib/flags'

interface IModel {
    code: string,
    description: string
}

interface ILayout {
    code: string,
    lang: string,
    description: string
}



/**
 * 
 */
export default class Keybords {

    models: string[] = []
    layouts: string[] = []
    variants: string[] = []
    options: string[] = []

    constructor() {
        const xorg = '/usr/share/X11/xkb/rules/xorg.lst'
        if (fs.existsSync(xorg)) {
            const lines = fs.readFileSync(xorg, 'utf-8').split('\n')


            const lenght = lines.length
            let isModel = false
            let isLayout = false
            let isVariant = false
            let isOption = false

            for (let i = 0; i < lenght; i++) {
                if (lines[i].substring(0, 1) === '!') {
                    console.log(lines[i])
                    if (lines[i] === "! model") {
                        isModel = true
                        isLayout = false
                        isVariant = false
                        isOption = false
                    } else if (lines[i] === "! layout") {
                        isModel = false
                        isLayout = true
                        isVariant = false
                        isOption = false
                    } else if (lines[i] === "! variant") {
                        isModel = false
                        isLayout = false
                        isVariant = true
                        isOption = false
                    } else if (lines[i] === "! option") {
                        isModel = false
                        isLayout = false
                        isVariant = false
                        isOption = true
                    }
                    i++
                }

                if (isModel) {
                    this.models.push(lines[i])
                } else if (isLayout) {
                    this.layouts.push(lines[i])
                } else if (isVariant) {
                    this.variants.push(lines[i])
                } else if (isOption) {
                    this.options.push(lines[i])
                }
            }
        }

    }


    /**
     * 
     * @returns 
     */
    getModels(): IModel[] {
        const retvals: IModel[] = []
        for (const model of this.models) {
            let m = {} as IModel
            m.code = model.substring(2, 15).trim()
            m.description = model.substring(18).trim()
            retvals.push(m)
        }
        return retvals
    }


    getLayout() {
        const retvals: ILayout[] = []
        // '0123456789012345678901234567890123456789
        // '  urd-phonetic    in: Urdu (phonetic)',
        const l = {} as ILayout
        for (const layout of this.layouts) {
            l.code = layout.substring(2, 15).trim()
            l.lang = layout.substring(18, layout.indexOf(':')).trim()
            l.description = layout.substring(layout.indexOf(':')).trim()
            retvals.push(l)
        }
        return retvals
    }

}

const keybords = new Keybords()
console.log(keybords.getModels())
console.log(keybords.getLayout())