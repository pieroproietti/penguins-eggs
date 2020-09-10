/**
* penguins-eggs: fisherman.ts
*
* author: Piero Proietti
* mail: piero.proietti@gmail.com
*/

import fs = require('fs')
import shx = require('shelljs')
import yaml = require('js-yaml')
import path = require('path')

import { IRemix, IDistro } from '../../interfaces'

const exec = require('../../lib/utils').exec

interface IReplaces {
    search: string
    replace: string
}

export default class Fisherman {
    dirModules = ''
    dirCalamaresModules = ''
    rootTemplate = ''
    verbose = false

    constructor(dirModules: string, dirCalamaresModules: string, rootTemplate: string, verbose: boolean = false) {
        this.dirModules = dirModules
        this.dirCalamaresModules = dirCalamaresModules
        this.rootTemplate = rootTemplate
        this.verbose = verbose
    }

    /**
     * 
     * @param name 
     */
    async shellprocess(name: string) {
        const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/shellprocess_${name}.conf`)
        const moduleDest = `${this.dirModules}/shellprocess_${name}.conf`
        if (fs.existsSync(moduleSource)) {
            if (this.verbose) console.log(`calamares: creating shellprocess ${name}`)
            shx.cp(moduleSource, moduleDest)
        } else if (this.verbose) {
            console.log(`calamares: shellprocess ${name}, nothing to do`)
        }
    }

    /**
    * 
    * @param name 
    */
   async contextualprocess(name: string) {
        const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/${name}_context.conf`)
        const moduleDest = `${this.dirModules}/${name}_context.conf`
        if (fs.existsSync(moduleSource)) {
            if (this.verbose) console.log(`calamares: creating contextualprocess ${name}`)
            shx.cp(moduleSource, moduleDest)
        } else if (this.verbose) {
                console.log(`calamares: contextualprocess ${name}, nothing to do!`)
        }
    }

    /**
     * 
     * @param name 
     * @param replaces [['search','replace']]
     */
    async buildModule(name: string) {
        const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/${name}.conf`)
        const moduleDest = `${this.dirModules}/${name}.conf`
        if (fs.existsSync(moduleSource)) {
            if (this.verbose) console.log(`calamares: creating module ${name}`)
            shx.cp(moduleSource, moduleDest)
        } else if (this.verbose) {
                console.log(`calamares: module ${name}, nothing to do`)
        }
    }


    /**
     * 
     * @param name 
     * @param isScript 
     */
    async buildCalamaresModule(name: string, isScript: boolean = true) {
        const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/calamares-modules/${name}/`)
        const moduleDest = this.dirCalamaresModules + '/' + name
        const moduleScript = `/usr/sbin/${name}.sh`



        if (this.verbose) console.log(`calamares: creating moduleCalamares ${name}`)

        if (!fs.existsSync(moduleDest)) {
            fs.mkdirSync(moduleDest)
        }
        shx.cp(`${moduleSource}/module.desc`, moduleDest)
        if (isScript) {
            shx.cp(`${moduleSource}/module.sh`, moduleScript)
            await exec(`chmod +x ${moduleScript}`)
        }
    }


    /**
     * 
     * @param name 
     */
    async buildCalamaresPy(name: string) {
        const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/calamares-modules/${name}/`)
        const moduleDest = this.dirCalamaresModules + '/' + name

        if (this.verbose) console.log(`calamares: creating module Python ${name}`)
        if (!fs.existsSync(moduleDest)) {
            fs.mkdirSync(moduleDest)
        }
        shx.cp(`${moduleSource}/module.desc`, moduleDest)
        shx.cp(`${moduleSource}/${name}.conf`, moduleDest)
        shx.cp(`${moduleSource}/main.py`, moduleDest)
        await exec(`chmod +x ${moduleSource}/main.py`)
    }
}
