/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs = require('fs')
import os = require('os')
import path = require('path')
import shx = require('shelljs')
import { IRemix } from '../interfaces'
import Pacman from '../classes/pacman'

import Utils from './utils'
import Distro from './distro'
import Settings from './settings'


const exec = require('../lib/utils').exec

const config_file = '/etc/penguins-eggs.d/eggs.conf' as string
const config_tools = '/etc/penguins-eggs.d/tools.conf' as string

/**
 * Basket
 */
export default class Basket {
    lastVersion = ''


    constructor() {
        this.lastVersion = ''
     }

    /**
     * 
     */
    async last(): Promise<string> {
        if (this.lastVersion === '') {
            let arch = 'amd64'

            if (process.arch === 'ia32' || process.arch === 'x32') {
                arch = 'i386'
            }
            const url = `https://penguins-eggs.net/versions/all/${arch}/`
            const axios = require('axios').default
    
            const res = await axios.get(url)
            const data = res.data
    
            // Ordino le versioni
            data.sort((a: any, b: any) => (a.version < b.version) ? 1 : ((b.version < a.version) ? -1 : 0))
            this.lastVersion = data[0].version
        }
        return this.lastVersion
    }

    /**
     * 
     * @param aptVersion 
     */
    async get() {
        if (!Pacman.packageIsInstalled('wget')) {
            Utils.titles(`Update from internet`)
            console.log('To download eggs from basket, You need to install wget!\nUse: sudo apt install wget')
            process.exit(1)
        }

        let arch = 'amd64'
        if (process.arch === 'ia32' || process.arch === 'x32') {
            arch = 'i386'
        }
        const url = `https://penguins-eggs.net/versions/all/${arch}/`
        const axios = require('axios').default

        const res = await axios.get(url)
        const data = res.data

        // Ordino le versioni
        data.sort((a: any, b: any) => (a.version < b.version) ? 1 : ((b.version < a.version) ? -1 : 0))

        const versions = []
        for (let i = 0; i < data.length && i <= 3; i++) {
            versions.push(data[i])
        }

        /**
         * choose the version
         */
        const inquirer = require('inquirer')
        const choices: string[] = ['abort']
        choices.push(new inquirer.Separator('exit without update.'))
        for (let i = 0; i < versions.length; i++) {
            choices.push(versions[i].version)
            choices.push(new inquirer.Separator(versions[i].changelog))
        }
        const questions: Array<Record<string, any>> = [
            {
                type: 'list',
                message: 'select version ',
                name: 'selected',
                choices: choices
            }
        ]
        const answer = await inquirer.prompt(questions)
        if (answer.selected === 'abort') {
            process.exit(0)
        }
        const deb = 'eggs_' + answer.selected + '-1_' + arch + '.deb'
        const download = 'https://sourceforge.net/projects/penguins-eggs/files/packages-deb/' + deb

        /**
         * downloading
         */
        Utils.titles(`downloading ${deb}`)
        if (await Utils.customConfirm(`Want to download ${deb}`)) {
            process.chdir(`/tmp`)
            if (fs.existsSync(deb)) {
                fs.unlinkSync(deb)
            }

            /**
             * Installing
             */
            await exec(`wget ${download}`)
            Utils.titles(`install ${deb}`)
            if (await Utils.customConfirm(`Want to install ${deb}`)) {
                await exec(`dpkg -i ${deb}`)
            }
        }
    }
}