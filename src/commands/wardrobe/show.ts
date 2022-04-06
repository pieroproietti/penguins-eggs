import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import os from 'os'
import { ICostume } from '../../interfaces'

// libraries
import chalk from 'chalk'

/**
 * 
 */
export default class Show extends Command {
    static description = 'show costumes/accessories in wardrobe'

    static flags = {
        costume: Flags.string({ char: 'c', description: 'costume' }),
        wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
        json: Flags.boolean({ char: 'j', description: 'output JSON' }),
        verbose: Flags.boolean({ char: 'v' }),
        help: Flags.help({ char: 'h' })
    }

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Show)

        let costume = "colibri"
        if (flags.costume !== undefined) {
            costume = flags.costume
        }
        let verbose = flags.verbose
        let json = flags.json

        const echo = Utils.setEcho(verbose)
        Utils.titles(this.id + ' ' + this.argv)

        let wardrobe = `${os.homedir()}/.penguins-eggs/wardrobe.d`
        if (flags.wardrobe !== undefined) {
            wardrobe = flags.wardrobe
        }

        console.log(chalk.green(`wardrobe: `) + wardrobe)
        console.log()

        let tailorList = `${wardrobe}/${costume}/index.yml`
        if (!fs.existsSync(tailorList)) {
            tailorList = `${wardrobe}/accessories/${costume}/index.yml`
            if (!fs.existsSync(tailorList)) {
                console.log('costume ' + chalk.cyan(costume) + ' not found in wardrobe: ' + chalk.green(wardrobe) + ', not in accessories')
                process.exit()
            }
        }

        const materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as ICostume
        if (json) {
            console.log(JSON.stringify(materials, null, ' '))
        } else {
            console.log(yaml.dump(materials))
        }
    }
}

