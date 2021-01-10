/**
 * tools
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import os = require('os')
import fs = require('fs')
import yaml = require('js-yaml')

import Settings from './settings'

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
  */
export default class Tools {
    tools_conf = '/etc/penguins-eggs.d/tools.yaml'

    snapshot_dir = ''

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

    file_name_deb = ''

    local_path_doc = ''

    /*
    * Load configuration from /etc/penguins-eggs.yaml
    * @returns {boolean} Success
    */
    async loadSettings(): Promise<boolean> {
        let foundSettings = false

        if (fs.existsSync(this.tools_conf)) {
            foundSettings = true
            const tools = yaml.load(fs.readFileSync(this.tools_conf, 'utf-8'))
            this.export_host = tools.export_host
            this.export_user_deb = tools.export_user_deb
            this.export_user_doc = tools.export_user_doc
            this.export_user_iso = tools.export_user_iso

            this.export_path = tools.export_path

            this.export_path_deb = this.export_path + tools.export_path_deb
            this.export_path_doc = this.export_path + tools.export_path_doc
            this.export_path_iso = this.export_path + tools.export_path_iso

            this.local_path_deb = tools.local_path_deb
            this.local_path_doc = tools.local_path_doc
            let arch = 'amd64'
            if (process.arch === 'ia32') {
                arch = 'i386'
            }
            this.file_name_deb = tools.file_name_deb + arch + '.deb'

            /**
             * da eggs
             */
            const settings = new Settings()
            settings.load()
            this.snapshot_dir = settings.snapshot_dir
            arch = 'x64'
            if (process.arch === 'ia32') {
                arch = 'i386'
            }
            this.snapshot_name = settings.snapshot_basename + '-' + arch + '_'
        } else {
            console.log(`Can't find: ${this.tools_conf}`)
            process.exit(1)
        }
        return foundSettings
    }
}

