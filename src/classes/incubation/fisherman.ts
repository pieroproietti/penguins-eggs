/**
* penguins-eggs: fisherman.ts
*
* author: Piero Proietti
* mail: piero.proietti@gmail.com
*/

import fs = require('fs')
import shx = require('shelljs')
import path = require('path')

import { IRemix, IDistro } from '../../interfaces'
import chalk = require('chalk')
import Utils from '../utils'
import {IInstaller} from '../../interfaces/index'

const exec = require('../../lib/utils').exec

interface IReplaces {
    search: string
    replace: string
}



export default class Fisherman {

    installer = {} as IInstaller

    distro: IDistro

    verbose = false

    constructor(distro: IDistro, installer: IInstaller, verbose = false) {
        this.installer = installer
        this.distro = distro
        this.verbose = verbose
    }

    /**
    * write setting
    */
    async settings(branding = 'eggs') {
        let settings = this.installer.configuration + 'settings.conf'
        shx.cp(this.installer.template + 'settings.yml', settings)
        let s = '# '
        if (Utils.isSystemd()) {
            s = '- '
        }
        shx.sed('-i', '{{s}}', s, settings)
        shx.sed('-i', '{{branding}}', branding, settings)
    }

    /**
     * 
     * @param name 
     */
    async shellprocess(name: string) {
        const moduleSource = path.resolve(__dirname, this.installer.templateModules + 'shellprocess_' + name + '.yml')
        const moduleDest = this.installer.modules + 'shellprocess_' + name + '.conf'
        if (fs.existsSync(moduleSource)) {
            if (this.verbose) this.show(name, 'shellprocess', moduleDest)
            shx.cp(moduleSource, moduleDest)
        } else if (this.verbose) {
            console.log(`calamares: ${name} shellprocess, nothing to do`)
        }
    }

    /**
    * 
    * @param name 
    */
    async contextualprocess(name: string) {
        const moduleSource = path.resolve(__dirname, this.installer.templateModules + name + '_context.yml')
        const moduleDest = this.installer.modules + name + '_context.conf'
        if (fs.existsSync(moduleSource)) {
            if (this.verbose) this.show(name, 'contextualprocess', moduleDest)
            shx.cp(moduleSource, moduleDest)
        } else if (this.verbose) {
            console.log(`calamares: ${name} contextualprocess, nothing to do!`)
        }
    }

    /**
     * 
     * @param name 
     * @param replaces [['search','replace']]
     */
    async buildModule(name: string, vendor = '') {
        let moduleSource = path.resolve(__dirname, this.installer.modules + name + '.yml')

        /**
         * We need vendor here to have possibility to load custom modules for calamares
         * the custom modules live in: /addons/vendor/theme/calamares/modules
         * and - if exist - take priority on distro modules on /conf/distros/calamares/modules
         * 
         * example:
         * 
         * ./addons/openos/theme/calamares/modules/partition.yml 
         * take place of:
         * ./conf/distros/bullseye/calamares/modules/partition.yml
         * and end in:
         * /etc/calamares/modules/partition.conf
         * 
         * And we solve the issue of Sebastien who need btrfs
         * 
         */
        if (vendor !== '') {
            const customModuleSource = path.resolve(__dirname, `../../../addons/${vendor}/theme/calamares/modules/${name}.yml`)
            if (fs.existsSync(customModuleSource)) {
                moduleSource = customModuleSource
            }

        }

        const moduleDest = this.installer.modules + name + '.conf'
        if (fs.existsSync(moduleSource)) {
            if (this.verbose) this.show(name, 'module', moduleDest)
            shx.cp(moduleSource, moduleDest)
        } else if (this.verbose) {
            console.log('unchanged: ' + chalk.greenBright(name))
        }
    }


    /**
     * 
     * @param name 
     * @param isScript 
     */
    async buildCalamaresModule(name: string, isScript = true): Promise<string> {
        const moduleTemplate = path.resolve(__dirname, this.installer.templateMultiarch + name)
        const moduleDest = this.installer.multiarchModules + name
        const moduleScript = `/usr/sbin/${name}.sh`


        console.log('moduleDest: ' + moduleDest)
        console.log('moduleTemplate: ' + moduleTemplate)
        console.log('moduleScript: ' + moduleScript)

        if (this.verbose) this.show(name, this.installer + '_module', moduleDest)

        if (!fs.existsSync(moduleDest)) {
            fs.mkdirSync(moduleDest)
        }
        shx.cp(`${moduleTemplate}/module.yml`, `${moduleDest}/module.desc`)
        if (isScript) {
            shx.cp(`${moduleTemplate}/${name}.sh`, moduleScript)
            await exec(`chmod +x ${moduleScript}`)
        }
        return moduleScript
    }


    /**
     * 
     * @param name 
     */
    async buildCalamaresPy(name: string) {
        const moduleSource = path.resolve(__dirname, this.installer.templateMultiarch + '/' + name)
        const moduleDest = this.installer.multiarchModules + name

        if (this.verbose) this.show(name, 'python', moduleDest)
        if (!fs.existsSync(moduleDest)) {
            fs.mkdirSync(moduleDest)
        }
        shx.cp(`${moduleSource}/module.yml`, `${moduleDest}/module.desc`)
        shx.cp(`${moduleSource}/${name}.yml`, `${moduleDest}/${name}.conf`)
        shx.cp(`${moduleSource}/main.py`, moduleDest)
        await exec(`chmod +x ${moduleSource}/main.py`)
    }

    /**
     * 
     * @param module 
     * @param type 
     * @param path 
     */
    show(name: string, type: string, path: string) {
        if (type === 'module') {
            console.log('fisherman: ' + chalk.yellow(name) + ' module in ' + chalk.yellow(path))
        } else if (type === 'calamares_module') {
            console.log('fisherman: ' + chalk.cyanBright(name) + ' calamares_module in ' + chalk.cyanBright(path))
        } else if (type === 'shellprocess') {
            console.log('fisherman: ' + chalk.green(name) + ' shellprocess in ' + chalk.green(path))
        } else if (type === 'contextualprocess') {
            console.log('fisherman: ' + chalk.cyanBright(name) + ' shellprocess in ' + chalk.cyanBright(path))
        }
    }

    /**
    * ====================================================================================
    * M O D U L E S
    * ====================================================================================
    */

    /**
    * Al momento rimane con la vecchia configurazione
    */
    async moduleFinished() {
        const name = 'finished'
        await this.buildModule(name)
        const restartNowCommand = 'reboot'
        shx.sed('-i', '{{restartNowCommand}}', restartNowCommand, `${this.installer.modules}/${name}.conf`)
    }

    /**
     * Al momento rimane con la vecchia configurazione
     */
    async moduleUnpackfs() {
        const name = 'unpackfs'
        this.buildModule(name)
        shx.sed('-i', '{{source}}', this.distro.mountpointSquashFs, `${this.installer.modules}/${name}.conf`)
    }

    /**
     * usa i moduli-ts
     */
    async moduleDisplaymanager() {
        const name = 'displaymanager'
        const displaymanager = require('./fisherman-helper/displaymanager').displaymanager
        this.buildModule(name)
        shx.sed('-i', '{{displaymanagers}}', displaymanager(), `${this.installer.modules}/${name}.conf`)
    }

    /**
     * usa i moduli-ts
     */
    async modulePackages(distro: IDistro, remove = false) {
        const name = 'packages'
        const removePackages = require('./fisherman-helper/packages').remove
        const tryInstall = require('./fisherman-helper/packages').tryInstall
        this.buildModule(name)
        if (remove) {
            shx.sed('-i', '{{remove}}', removePackages(distro), `${this.installer.modules}/${name}.conf`)
        } else {
            shx.sed('-i', '{{remove}}', '', `${this.installer.modules}/${name}.conf`)
        }
        shx.sed('-i', '{{try_install}}', tryInstall(distro), `${this.installer.modules}/${name}.conf`)
    }

    /**
     * Al momento rimane con la vecchia configurazione
     */
    async moduleRemoveuser(username: string) {
        const name = 'removeuser'
        this.buildModule(name)
        shx.sed('-i', '{{username}}', username, `${this.installer.modules}${name}.conf`)
    }

}
