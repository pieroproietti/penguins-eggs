/**
 * penguins-eggss
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * pve-live
 */

 /**
  * This will create a symbolic link from the system’s copy of the service file (usually in /lib/systemd/system or /etc/systemd/system) into the location on disk where systemd looks for autostart files (usually /etc/systemd/system/some_target.target.wants. We will go over what a target is later in this guide).
  * To disable the service from starting automatically, you can type:
  * sudo systemctl disable application.service
  * This will remove the symbolic link that indicated that the service should be started automatically.
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
        shx.cp(path.resolve(__dirname, '../../scripts/pve-live.service'), root + '/lib/systemd/system/')
    }

    /**
     * 
     */
    restart(){
        this.systemctl.restart('lxcfs')
        this.systemctl.restart('pve-cluster')
        this.systemctl.restart('pve-firewall')
        this.systemctl.restart('pve-guests')
        this.systemctl.restart('pve-ha-crm')
        this.systemctl.restart('pve-ha-lrm')
    }
}