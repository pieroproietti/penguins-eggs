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

    create(root="/") {
        this.createScript(root)
        this.createService(root)
    }

    /**
     * 
     */
    createScript(root = '/') {
        shx.cp(__dirname +`../../scripts/pve-lvte.sh`, `${root}/usr/bin`)
    }

    /**
     * 
     */
    createService(root = '/') {
        shx.cp(__dirname +`../../scripts/pve-live.service`, `${root}/etc/systemd/system/`)
    }
}