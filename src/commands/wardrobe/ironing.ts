import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import os from 'os'
import { ICostume } from '../../interfaces'
import chalk from 'chalk'

// libraries
import { exec } from '../../lib/utils'

/**
 * 
 */
export default class Ironing extends Command {
    static description = 'ordered show of costumes or accessories in wardrobe'

    static flags = {
        costume: Flags.string({ char: 'c', description: 'costume' }),
        wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
        verbose: Flags.boolean({ char: 'v' }),
        help: Flags.help({ char: 'h' })
    }

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Ironing)

        let verbose = false
        if (flags.verbose) {
            verbose = true
        }

        const echo = Utils.setEcho(verbose)
        Utils.titles(this.id + ' ' + this.argv)

        // Well be usefull to have scrolling
        // Limit scrolling from line 0 to line 10.
        // await exec(`printf '\e[5;24r'`)


        let costume = "colibri"
        if (flags.costume !== undefined) {
            costume = flags.costume
        }

        let wardrobe = `${os.homedir()}/.penguins-eggs/wardrobe.d`
        if (flags.wardrobe !== undefined) {
            wardrobe = flags.wardrobe
        }

        let tailorList = `${wardrobe}/${costume}/index.yml`
        if (!fs.existsSync(tailorList)) {
            tailorList = `${wardrobe}/accessories/${costume}/index.yml`
            if (!fs.existsSync(tailorList)) {
                console.log('costume ' + chalk.cyan(costume) + ' not found in wardrobe: ' + chalk.green(wardrobe) + ', not in accessories')
                process.exit()
            }
        }

        const orig = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as ICostume
        let sorted: ICostume = orig

        sorted.name = orig.name
        sorted.description = orig.description
        sorted.author = orig.author
        sorted.release = orig.release
        sorted.distributions = orig.distributions.sort()

        if (orig.sequence.repositories !== undefined) {
            sorted.sequence.repositories = orig.sequence.repositories

            if (orig.sequence.repositories.sourcesList !== undefined) {
                sorted.sequence.repositories.sourcesList = orig.sequence.repositories.sourcesList
            }

            if (orig.sequence.repositories.sourcesListD !== undefined) {
                sorted.sequence.repositories.sourcesList = orig.sequence.repositories.sourcesList
            }
        }

        if (orig.sequence.dependencies !== undefined) {
            if (orig.sequence.dependencies[0] !== null) {
                sorted.sequence.dependencies = orig.sequence.dependencies.sort()
            }
        }

        if (orig.sequence.packages !== undefined) {
            if (orig.sequence.packages[0] !== null) {
                sorted.sequence.packages = orig.sequence.packages.sort()
            }
        }

        if (orig.sequence.noInstallRecommends !== undefined) {
            if (orig.sequence.noInstallRecommends[0] !== null) {
                sorted.sequence.noInstallRecommends = orig.sequence.noInstallRecommends.sort()
            }
        }

        if (orig.sequence.packagesPip !== undefined) {
            if (orig.sequence.packagesPip[0] !== null) {
                sorted.sequence.packagesPip = orig.sequence.packagesPip.sort()
            }
        }

        if (orig.sequence.accessories !== undefined) {
            if (orig.sequence.accessories[0] !== null) {
                sorted.sequence.accessories = orig.sequence.accessories.sort()
            }
        }

        sorted.sequence.debs = orig.sequence.debs
        sorted.sequence.dirs = orig.sequence.dirs
        sorted.sequence.hostname = orig.sequence.hostname

        if (orig.sequence.customizations !== undefined) {
            if (orig.sequence.customizations.scripts[0] !== null) {
            }
        }
        sorted.sequence.reboot = sorted.sequence.reboot

        const ironed = `# ${sorted.name}\n---\n` + yaml.dump(sorted)
        console.log(ironed)

        // Well be usefull to have scrolling
        // Set scrolling margins back to default.
        // await exec(`printf '\e[;r'`)
    }
}
