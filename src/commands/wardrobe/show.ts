import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { ICostume } from '../../interfaces'

// libraries
import chalk from 'chalk'

/**
 * 
 */
export default class Show extends Command {
    static description = 'show costumes'

    static flags = {
        wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
        costume: Flags.string({ char: 'c', description: 'costume' }),
        json: Flags.boolean({ char: 'j', description: 'output JSON' }),
        verbose: Flags.boolean({ char: 'v' }),
        help: Flags.help({ char: 'h' })
    }

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Show)

        let costume = "xfce4"
        if (flags.costume !== undefined) {
            costume = flags.costume
        }
        let verbose = flags.verbose
        let json = flags.json

        const echo = Utils.setEcho(verbose)
        Utils.titles(this.id + ' ' + this.argv)

        let wardrobe = `${path.resolve(__dirname, '../../../wardrobe.d')}`

        let position = "eggs"
        if (flags.wardrobe !== undefined) {
            position = "external"
            wardrobe = flags.wardrobe
        }

        console.log(chalk.green(`${position} wardrobe: `) + wardrobe)
        console.log()

        if (fs.existsSync(`${wardrobe}/${costume}/index.yml`)) {
            const materials = yaml.load(fs.readFileSync(`${wardrobe}/${costume}/index.yml`, 'utf-8')) as ICostume
            if (json) {
                console.log(JSON.stringify(materials, null, ' '))
            } else {
                console.log(yaml.dump(materials))
            }
        } else {
            console.log('costume '  + chalk.cyan(costume) + ' not found in ' + position + ' wardrobe: ' + chalk.green(wardrobe))
        }
    }
}

