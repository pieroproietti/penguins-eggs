/* eslint-disable no-negated-condition */
/* eslint-disable no-process-exit */
/* eslint-disable no-console */
import { Command, flags } from '@oclif/command'
import fs = require('fs')
import path = require('path')
import yaml = require('js-yaml')
import shx = require('shelljs')

import Utils from './classes/utils'
import Dir from './classes/dir'
import Dpkg from './classes/dpkg'
import Man from './classes/man'

import { IPackage } from './interfaces'
import convertHtml from './classes/convert-html'

class Perrisbrewery extends Command {
    static description = 'describe the command here'

    static flags = {
        // add --version flag to show CLI version
        version: flags.version({ char: 'v' }),
        help: flags.help({ char: 'h' }),
        mantain: flags.boolean({ char: 'm' }),
    }

    static args = [{ name: 'pathSource' }]

    async run() {
        const { args, flags } = this.parse(Perrisbrewery)

        const u = new Utils()
        u.titles(this.id + ' ' + this.argv)

        let pbPackage = {} as IPackage

        this.log()

        const here = process.cwd() + '/'
        let pathSource = here
        if (args.pathSource !== undefined) {
            pathSource = args.pathSource
        }

        if (!fs.existsSync(`${here}/perrisbrewery`)) {
            fs.mkdirSync(`${here}/perrisbrewery`)
            fs.mkdirSync(`${here}/perrisbrewery/workdir`)
            shx.cp('-r', path.resolve(__dirname, `../perrisbrewery/template`), `${here}/perrisbrewery`)
            shx.cp('-r', path.resolve(__dirname, `../perrisbrewery/scripts`), `${here}/perrisbrewery`)
            console.log('perrisbrewery dir created in: ' + pathSource)
            console.log('Edit configuration in template e scripts. Include /perribrewery/workdir in .gitignore.')
            console.log('After sudo npm run deb (build deb package with @oclif/cli-dev')
            console.log('Finally run pb to rebuild your packages with manual, scripts, etc')
            process.exit(0)
        }

        if (!fs.existsSync(`${here}/perrisbrewery/workdir`)) {
            fs.mkdirSync(`${here}/perrisbrewery/workdir`)
        }

        this.log('-pathSource: ' + pathSource)

        const dpkg = new Dpkg()
        const dir = new Dir()
        const filenames = dir.analyze(pathSource)

        const man = new Man(pathSource + '/README.md')
        filenames.forEach((file: string) => {
            this.log('-file: ' + file)
            pbPackage = dpkg.analyze(pathSource + 'dist/deb/' + file)
            fs.writeFileSync('pb.yaml', yaml.dump(pbPackage), 'utf-8')
            dpkg.disclose()
            dpkg.makeScripts()
            dpkg.makeControl()
            man.createMd()
            man.convertToMan()
            convertHtml()
            dpkg.close(pbPackage)
            if (!flags.mantain) {
                shx.exec(`rm ${pbPackage.tempDir} -rf`)
            }
        })
    }
}

export = Perrisbrewery
