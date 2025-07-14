/**
 * ./src/classes/keyboards.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'

import { IXkbLayout, IXkbModel, IXkbOption, IXkbVariant } from '../interfaces/i-xkb-model.js'
import { exec } from '../lib/utils.js'

// XkbModel - name of the model of your keyboard type
// XkbLayout - layout(s) you intend to use
// XkbVariant - variant(s) of the layout you intend to use
// XkbOptions - extra xkb configuration options

/**
 * /usr/share/X11/xkb/rules/xorg.lst
 */
export default class Keyboard {
  layouts: string[] = []
  models: string[] = []
  options: string[] = []
  variants: string[] = []

  constructor() {
    const xorg = '/usr/share/X11/xkb/rules/xorg.lst'
    if (fs.existsSync(xorg)) {
      const lines = fs.readFileSync(xorg, 'utf8').split('\n')

      const lenght = lines.length
      let isModel = false
      let isLayout = false
      let isVariant = false
      let isOption = false

      for (let i = 0; i < lenght; i++) {
        if (lines[i].slice(0, 1) === '!') {
          switch (lines[i]) {
            case '! model': {
              isModel = true
              isLayout = false
              isVariant = false
              isOption = false

              break
            }

            case '! layout': {
              isModel = false
              isLayout = true
              isVariant = false
              isOption = false

              break
            }

            case '! variant': {
              isModel = false
              isLayout = false
              isVariant = true
              isOption = false

              break
            }

            case '! option': {
              isModel = false
              isLayout = false
              isVariant = false
              isOption = true

              break
            }
            // No default
          }

          i++
        }

        if (isModel) {
          this.models.push(lines[i].trim())
        } else if (isLayout) {
          this.layouts.push(lines[i].trim())
        } else if (isVariant) {
          this.variants.push(lines[i].trim())
        } else if (isOption) {
          this.options.push(lines[i].trim())
        }
      }
    } else {
      this.models.push('pc105')
      this.layouts = [
        'af',
        'al',
        'am',
        'ara',
        'at',
        'az',
        'ba',
        'bd',
        'be',
        'bg',
        'br',
        'brai',
        'by',
        'ca',
        'ch',
        'cm',
        'cn',
        'cz',
        'de',
        'dk',
        'dz',
        'ee',
        'epo',
        'fr',
        'gb',
        'ge',
        'gh',
        'gr',
        'hr',
        'hu',
        'id',
        'ie',
        'il',
        'in',
        'iq',
        'ir',
        'is',
        'it',
        'jp',
        'ke',
        'kg',
        'kr',
        'kz',
        'la',
        'latam',
        'lk',
        'lt',
        'lv',
        'ma',
        'md',
        'me',
        'mk',
        'ml',
        'mm',
        'mt',
        'my',
        'ng',
        'nl',
        'no',
        'nz',
        'ph',
        'pk',
        'pl',
        'pt',
        'ro',
        'rs',
        'ru',
        'se',
        'si',
        'sk',
        'sy',
        'th',
        'tj',
        'tw',
        'ua',
        'us',
        'uz',
        'vn'
      ]
      this.variants.push('none')
      this.options.push('none')
    }
  }

  /**
   * XKBLAYOUT='us'
   */
  async getLayout(): Promise<string> {
    const file = '/etc/default/keyboard'

    const cmd = 'grep XKBLAYOUT < /etc/default/keyboard | cut -f2 -d= | cut -f2 "-d\\""'
    let keyboardLayout = 'us'
    if (fs.existsSync(file)) {
      const result = await exec(cmd, { capture: true, echo: false, ignore: false })
      if (result.code === 0) {
        keyboardLayout = result.data.trim()
      }
    }

    return keyboardLayout
  }

  /**
   * XKBLAYOUT=[]
   */
  getLayouts(): IXkbLayout[] {
    const oLayouts: IXkbLayout[] = []
    for (const layout of this.layouts) {
      const l = {} as IXkbLayout
      l.code = layout.slice(0, 15).trim()
      l.description = layout.slice(16)
      oLayouts.push(l)
    }

    return oLayouts
  }

  /**
   * XKBMODEL='pc105'
   */
  async getModel(): Promise<string> {
    const file = '/etc/default/keyboard'
    const cmd = `grep XKBMODEL < ${file} |cut -f2 -d= | cut -f2 "-d\\""`
    let keyboardModel = 'pc105'
    if (fs.existsSync(file)) {
      const result = await exec(cmd, { capture: true, echo: false, ignore: false })
      if (result.code === 0) {
        keyboardModel = result.data.trim()
      }
    }

    return keyboardModel
  }

  /**
   * XKBMODEL[]
   */
  getModels(): IXkbModel[] {
    // 0123456789012345678901234567890123456789
    // pc101           Generic 101-key PC
    const oModels: IXkbModel[] = []
    for (const model of this.models) {
      const m = {} as IXkbModel
      m.code = model.slice(0, 15).trim()
      m.description = model.slice(16)
      oModels.push(m)
    }

    return oModels
  }

  /**
   * XKBOPTIONS=''
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

  /**
   * XKBOPTIONS[]
   */
  getOptions(): IXkbOption[] {
    // 0123456789012345678901234567890123456789
    // grp:switch           Right Alt (while pressed)
    const aoOptions: IXkbOption[] = []
    for (const option of this.options) {
      const o = {} as IXkbOption
      o.code = option.slice(0, 15).trim()
      o.description = option.slice(21)
      aoOptions.push(o)
    }

    return aoOptions
  }

  /**
   * XKBVARIANT=''
   */
  async getVariant(): Promise<string> {
    const file = '/etc/default/keyboard'

    const cmd = `grep XKBVARIANT < ${file} | cut -f2 -d=|cut -f2 "-d\\""`
    let keyboardVariant = ''
    if (fs.existsSync(file)) {
      const result = await exec(cmd, { capture: true, echo: false, ignore: false })
      if (result.code === 0) {
        keyboardVariant = result.data.trim()
      }
    }

    return keyboardVariant
  }

  /**
   * IXkbVariant[]
   */
  getVariants(layout: string): IXkbVariant[] {
    // 0123456789012345678901234567890123456789
    // chr             us: Cherokee
    const aoVariants: IXkbVariant[] = []
    for (const variant of this.variants) {
      const v = {} as IXkbVariant
      v.code = variant.slice(0, 15).trim()
      v.lang = variant.substring(16, variant.indexOf(':')).trim()
      v.description = variant.slice(Math.max(0, variant.indexOf(':')))
      if (v.lang === layout) {
        aoVariants.push(v)
      }
    }

    return aoVariants
  }
}
