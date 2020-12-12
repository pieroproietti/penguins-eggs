/**
 * penguins-eggss
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * pve-live
 */

// libraries
const exec = require('../lib/utils').exec

import Systemctl from './systemctl'
import Utils from './utils'
import os = require('os')
import fs = require('fs')
import shx = require('shelljs')

export default class Pve {

    systemctl = {} as Systemctl

    constructor() {
        this.systemctl = new Systemctl()
    }

    /**
     * enable PveLIve
     */
    enable() {
        this.systemctl.enable('pve-live')
    }

    /**
     * disable
     */
    disable() {
        this.systemctl.disable('pve-live')
    }

    create() {
        this.createScript()
        this.createService()
    }

    /**
     * 
     */
    createScript() {
        shx.cp(__dirname +`../../scripts/pve-lvte.sh`, '/usr/bin')
    }

    /**
     * 
     */
    createService() {
        shx.cp(__dirname +`../../scripts/pve-live.service`, '/etc/systemd/system/')
    }
}