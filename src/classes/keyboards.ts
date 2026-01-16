/**
 * ./src/classes/keyboards.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti (modified)
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import path from 'node:path'

import { IXkbLayout, IXkbModel, IXkbOption, IXkbVariant } from '../interfaces/i-xkb-model.js'
import { exec } from '../lib/utils.js'

/**
 * Keyboard class - reads and manages X11 keyboard configuration
 */
export default class Keyboard {
  layouts: IXkbLayout[] = [] // New change #1: store typed objects instead of raw strings
  models: IXkbModel[] = [] // New change #1
  options: IXkbOption[] = [] // New change #1
  variants: IXkbVariant[] = [] // New change #1
  private defaultKeyboardFile = '/etc/default/keyboard' // New change #2: store default keyboard file path
  private xorgLstFile = '/usr/share/X11/xkb/rules/xorg.lst'

  constructor() {
    // New change #3: Use a safer approach to read xorg.lst
    if (fs.existsSync(this.xorgLstFile)) {
      const content = fs.readFileSync(this.xorgLstFile, 'utf8')
      this.parseXorgLst(content)
    } else {
      this.setDefaults()
    }
  }

  // Get current layout
  async getLayout(): Promise<string> {
    const layout = await this.readKeyboardConfig('XKBLAYOUT')
    return layout || 'us'
  }

  // Get all layouts
  getLayouts(): IXkbLayout[] {
    return this.layouts
  }

  // Get current model
  async getModel(): Promise<string> {
    const model = await this.readKeyboardConfig('XKBMODEL')
    return model || 'pc105'
  }

  // Get all models
  getModels(): IXkbModel[] {
    return this.models
  }

  // Get current option
  async getOption(): Promise<string> {
    return await this.readKeyboardConfig('XKBOPTIONS')
  }

  // Get all options
  getOptions(): IXkbOption[] {
    return this.options
  }

  // Get current variant
  async getVariant(): Promise<string> {
    return await this.readKeyboardConfig('XKBVARIANT')
  }

  // Get variants for a specific layout
  getVariants(layout: string): IXkbVariant[] {
    return this.variants.filter((v) => v.lang === layout)
  }

  // New change #4: parse xorg.lst with regex instead of fixed slicing
  private parseXorgLst(content: string) {
    const sections = ['model', 'layout', 'variant', 'option'] as const
    let currentSection: (typeof sections)[number] | null = null

    for (let line of content.split('\n')) {
      line = line.trim()
      if (!line) continue
      if (line.startsWith('!')) {
        const sectionName = line.slice(2).toLowerCase()
        if (sections.includes(sectionName as any)) {
          currentSection = sectionName as (typeof sections)[number]
        } else {
          currentSection = null
        }

        continue
      }

      if (!currentSection) continue

      // Separate code and description with regex
      const match = line.match(/^(\S+)\s+(.*)$/)
      if (!match) continue

      const [_, code, description] = match
      const desc = description || ''

      switch (currentSection) {
        case 'layout': {
          this.layouts.push({ code, description: desc })
          break
        }

        case 'model': {
          this.models.push({ code, description: desc })
          break
        }

        case 'option': {
          this.options.push({ code, description: desc })
          break
        }

        case 'variant': {
          // Extract language if possible
          const langMatch = desc.match(/^(\S+):\s*(.*)$/)
          this.variants.push({
            code,
            description: langMatch ? langMatch[2] : desc,
            lang: langMatch ? langMatch[1] : ''
          })
          break
        }
      }
    }
  }

  // New change #6: read keyboard configuration from file safely
  private async readKeyboardConfig(variable: string): Promise<string> {
    if (!fs.existsSync(this.defaultKeyboardFile)) return ''
    try {
      const cmd = `grep ^${variable}= ${this.defaultKeyboardFile} | cut -d= -f2 | tr -d '"'`
      const result = await exec(cmd, { capture: true, echo: false, ignore: false })
      if (result.code === 0) {
        return result.data.trim()
      }

      return ''
    } catch {
      return ''
    }
  }

  // New change #5: set default keyboard data if xorg.lst not found
  private setDefaults() {
    this.models.push({ code: 'pc105', description: 'Generic 105-key PC' })
    const defaultLayouts = ['us', 'fr', 'de', 'gb', 'es', 'it', 'ru', 'jp'] // shortened for example
    for (const l of defaultLayouts) this.layouts.push({ code: l, description: '' })
    this.variants.push({ code: 'none', description: 'none', lang: '' })
    this.options.push({ code: 'none', description: 'none' })
  }
}
