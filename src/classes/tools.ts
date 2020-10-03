/**
 * tools
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import os = require('os')
import fs = require('fs')
import path = require('path')
import ini = require('ini')
import chalk = require('chalk')
import figlet = require('figlet')
import clear = require('clear')
import shx = require('shelljs')

import Utils from './utils'

const config_tools = '/etc/penguins-eggs.d/tools.conf' as string


/**
 * Utils: general porpourse utils
 * @remarks all the utilities
  */
export default class Tools {
    config_file = ''

    penguins_eggs_conf = ''

    work_dir = ''

    snapshot_dir = ''

    snapshot_basename = ''

    snapshot_name = ''

    export_host = ''

    export_user_deb = ''

    export_user_doc = ''

    export_user_iso = ''

    export_path = ''

    export_path_iso = ''

    export_path_deb = ''

    export_path_doc = ''

    local_path_deb = ''

    local_path_deb_me = ''

    file_name_deb = ''

    file_name_deb_me = ''

    local_path_doc = ''

    arch = 'amd64'

    constructor() {
        if (!fs.existsSync(config_tools)) {
            if (Utils.isRoot()) {
                let sourcePath = path.resolve(__dirname, '../../conf/penguins-tools.conf')
                Utils.titles('penguins-tools')
                Utils.warning('configuration')
            
                let destPath = config_tools
                fs.copyFileSync(sourcePath, destPath)
                console.log(chalk.redBright('Configuration not found!'))
                console.log('I\'m creating your configuration file in ' + chalk.cyanBright(config_tools))
                console.log('You can adapt it at your needs. Open it with an editor.')
                console.log('Example:')
                console.log(`sudo nano ${config_tools}`)
                process.exit()
            }
        } else {
            this.config_file = config_tools
        }
    }


    /*
    * Load configuration from /etc/penguins-eggs.conf
    * @returns {boolean} Success
    */
    async loadSettings(): Promise<boolean> {
        let foundSettings = false

        if (fs.existsSync(this.config_file)) {
            foundSettings = true
            //console.log(this.config_file)
            const settings = ini.parse(fs.readFileSync(this.config_file, 'utf-8'))
            if (settings.General.penguins_eggs_conf !== undefined) {
                this.penguins_eggs_conf = settings.General.penguins_eggs_conf.trim()
                this.export_host = settings.General.export_host
                this.export_user_deb = settings.General.export_user_deb
                this.export_user_doc = settings.General.export_user_doc
                this.export_user_iso = settings.General.export_user_iso
                this.export_path = settings.General.export_path

                this.export_path_deb = this.export_path + settings.General.export_path_deb
                this.export_path_doc = this.export_path + settings.General.export_path_doc
                this.export_path_iso = this.export_path + settings.General.export_path_iso

                this.local_path_deb = settings.General.local_path_deb
                this.local_path_deb_me = settings.General.local_path_deb_me
                this.local_path_doc = settings.General.local_path_doc
                this.arch = 'amd64'
                if (Utils.isi686()) {
                  this.arch = 'i386'
                }
                this.file_name_deb = settings.General.file_name_deb + this.arch + '.deb'
                this.file_name_deb_me = settings.General.file_name_deb_me + this.arch + '.deb'
                if (fs.existsSync(this.penguins_eggs_conf)) {
                    await this.loadSettingsEggs()
                } else {
                    console.log(`${this.penguins_eggs_conf} not found`)
                }
            }

        } else {
            console.log(`Non ho trovato: ${this.config_file}`)
            process.exit(1)
        }
        return foundSettings
    }

    /**
     * Load configuration from /etc/penguins-eggs.conf
     * @returns {boolean} Success
     */
    async loadSettingsEggs(): Promise<boolean> {
        let foundSettings: boolean

        const settings = ini.parse(fs.readFileSync(this.penguins_eggs_conf, 'utf-8'))

        if (settings.General.snapshot_dir === '') {
            foundSettings = false
        } else {
            foundSettings = true
        }
        this.snapshot_dir = settings.General.snapshot_dir.trim()
        if (!this.snapshot_dir.endsWith('/')) {
            this.snapshot_dir += '/'
        }
        this.work_dir = this.snapshot_dir + '.work/'
        this.snapshot_basename = settings.General.snapshot_basename
        if (this.snapshot_basename === 'hostname') {
            this.snapshot_basename = os.hostname()
        }
        this.snapshot_name = Utils.getFilename(this.snapshot_basename)

        return foundSettings
    }
}

