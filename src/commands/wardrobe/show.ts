import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import yaml from 'js-yaml'
import fs from 'fs'
import { IMateria } from '../../interfaces'
import path from 'path'

// libraries
import chalk from 'chalk'

/**
 * 
 */
export default class Show extends Command {
    static description = 'show costumes/accessories in wardrobe'

    static args = [{ name: 'costume', description: 'costume to show', required: false }]

    static flags = {
        wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
        json: Flags.boolean({ char: 'j', description: 'output JSON' }),
        verbose: Flags.boolean({ char: 'v' }),
        help: Flags.help({ char: 'h' })
    }

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Show)

        let verbose = flags.verbose
        let json = flags.json

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


        console.log(chalk.green(`wardrobe: `) + wardrobe)
        console.log()

        /**
         * costume
         */
        let costume = wardrobe + this.argv[0]
        if (!fs.existsSync(costume)) {
            console.log(`costume: ${chalk.green(path.basename(costume))} not found in wardrobe: ${chalk.green(wardrobe)}`)
            process.exit()
        }

        /**
        * tailorList
        */
        let tailorList = `${costume}/index.yml`
        if (!fs.existsSync(tailorList)) {
            Utils.warning(`index.yml not found in : ${costume}!`)
            process.exit()
        }
        if (!fs.existsSync(tailorList)) {
            tailorList = `${wardrobe}/accessories/${costume}/index.yml`
            if (!fs.existsSync(tailorList)) {
                console.log('costume ' + chalk.cyan(costume) + ' not found in wardrobe')
                process.exit()
            }
        }

        const materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as IMateria

        if (json) {
            console.log(JSON.stringify(materials, null, ' '))
        } else {
            console.log(yaml.dump(materials))
        }
    }
}

