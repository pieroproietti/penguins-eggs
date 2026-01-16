/**
 * ./src/commands/wardrobe/show.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// libraries
import { Args, Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'

import Distro from '../../classes/distro.js'
import Utils from '../../classes/utils.js'
import { IMateria } from '../../interfaces/index.js'

/**
 *
 */
export default class Show extends Command {
  static args = {
    repo: Args.string({ description: 'costume to show', name: 'costume', required: false })
  }
static description = 'show costumes/accessories in wardrobe'
  // static args = [{ name: 'costume', description: 'costume', required: false }]
  static example = ['eggs wardrobe show colibri', 'eggs wardrobe show accessories/firmwares', 'eggs wardrobe show accessories/']
static flags = {
    help: Flags.help({ char: 'h' }),
    json: Flags.boolean({ char: 'j', description: 'output JSON' }),
    verbose: Flags.boolean({ char: 'v' }),
    wardrobe: Flags.string({ char: 'w', description: 'wardrobe' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Show)

    const { verbose } = flags
    const { json } = flags

    const echo = Utils.setEcho(verbose)
    Utils.titles(this.id + ' ' + this.argv)

    let wardrobe = await Utils.wardrobe()
    if (flags.wardrobe !== undefined) {
      wardrobe = flags.wardrobe
    }

    wardrobe = `${path.resolve(process.cwd(), wardrobe)}/`

    if (!fs.existsSync(wardrobe)) {
      Utils.warning(`wardrobe: ${wardrobe} not found!`)
      process.exit()
    }

    console.log(chalk.green('wardrobe: ') + wardrobe)

    /**
     * costume
     */
    let costume = 'costumes/colibri'
    if (this.argv['0'] !== undefined) {
      costume = this.argv['0']
      if (costume.slice(0, 8) !== 'costumes' && costume.slice(0, 11) !== 'accessories' && costume.slice(0, 7) !== 'servers') {
        costume = `costumes/${costume}`
      }
    }

    costume = wardrobe + costume

    if (!fs.existsSync(costume)) {
      console.log(`costume: ${chalk.green(path.basename(costume))} not found in wardrobe: ${chalk.green(wardrobe)}`)
      process.exit()
    }

    /**
     * tailorList
     */
    const distro = new Distro()
    let index = ''
    switch (distro.distroLike) {
      case 'Arch': {
        index = 'arch.yaml'

        break
      }

      case 'Debian':
      case 'Devuan': {
        index = 'debian.yaml'

        break
      }

      case 'Debian': {
        index = 'ubuntu.yaml'

        break
      }
      // No default
    }

    const tailorList = `${costume}/${index}`
    if (!fs.existsSync(tailorList)) {
      Utils.warning(`index.yaml not found in : ${costume}!`)
      process.exit()
    }

    const materials = yaml.load(fs.readFileSync(tailorList, 'utf8')) as IMateria

    if (json) {
      console.log(JSON.stringify(materials, null, ' '))
    } else {
      console.log(yaml.dump(materials))
    }
  }
}
