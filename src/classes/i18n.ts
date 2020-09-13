/* eslint-disable valid-jsdoc */
/* eslint-disable no-console */

/**
 * penguins-eggs: ovary.ts VERSIONE DEBIAN-LIVE
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

// packages
import fs = require('fs')
import path = require('path')
import os = require('os')
import shx = require('shelljs')
import chalk = require('chalk')

// interfaces
import { IMyAddons } from '../interfaces'

// libraries
const exec = require('../lib/utils').exec

// classes
import Utils from './utils'
import N8 from './n8'
import Xdg from './xdg'
import Pacman from './pacman'
import Settings from './settings'


/**
 * Ovary:
 */
export default class I18n {
    verbose = false
    settings = {} as Settings

    constructor(verbose: boolean = false) {
        this.verbose = verbose
        this.settings = new Settings()
    }

    generate() {
        if (this.verbose) {
            console.log('creating /etc/locale.gen')
            console.log('recreating /etc/locale.gen')
        }

        console.log(process.execPath)
        shx.cp(path.resolve(__dirname, `../../conf/distros/${this.settings.distro.versionId}/locales/locale.gen.template`), '/etc/locale.gen')
        shx.cp(path.resolve(__dirname, `../../conf/distros/${this.settings.distro.versionId}/locales/locale.template`), '/etc/default/locale')
        shx.sed('-i', '%locale%', 'it_IT@UTF-8', '/etc/default/locale')
        shx.exec('/usr/sbin/locale-gen')

        /**
         * che fa bleachbit?
         * Elimina 4,1kB /usr/share/i18n/locales/./ta_LK   
         * Elimina 4,1kB /usr/share/man/pl/man8/validlocale.8.gz
         * Elimina 4,1kB /usr/share/man/pl/man8
         * Elimina 4,1kB /usr/share/man/pl
         */

    }
}
