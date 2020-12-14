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
import path = require('path')
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

    create(root = "/") {
        this.createScript(root)
        this.createService(root)
        process.exit(1)
    }

    /**
     * 
     */
    createScript(root = '/') {
        shx.cp(path.resolve(__dirname, '../../scripts/pve-live.sh'), root + '/usr/bin/')
    }

    /**
     * 
     */
    createService(root = '/') {
        shx.cp(path.resolve(__dirname, '../../scripts/pve-live.service'), root + '/etc/systemd/system/')
    }
}