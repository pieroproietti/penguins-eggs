import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { IMaterial } from '../../interfaces'

// libraries
import chalk from 'chalk'

/**
 * 
 */
export default class Show extends Command {
    static description = 'show costumes'

    static flags = {
        gardrobe: Flags.string({ char: 'g', description: 'gardrobe' }),
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

        let gardrobe = `${path.resolve(__dirname, '../../../gardrobe.d')}`

        let position = "eggs"
        if (flags.gardrobe !== undefined) {
            position = "external"
            gardrobe = flags.gardrobe
        }

        console.log(chalk.green(`${position} gardrobe: `) + gardrobe)
        console.log()

        if (fs.existsSync(`${gardrobe}/${costume}/index.yml`)) {
            const materials = yaml.load(fs.readFileSync(`${gardrobe}/${costume}/index.yml`, 'utf-8')) as IMaterial
            if (json) {
                console.log(JSON.stringify(materials, null, ' '))
            } else {
                console.log(yaml.dump(materials))
            }
        } else {
            console.log('costume '  + chalk.cyan(costume) + ' not found in ' + position + ' gardrobe: ' + chalk.green(gardrobe))
        }
    }
}

