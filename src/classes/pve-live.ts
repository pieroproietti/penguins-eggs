/**
 * penguins-eggs
 * class: pve.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * This will create a symbolic link from the system’s copy of the service file (usually in /lib/systemd/system or /etc/systemd/system)
 * into the location on disk where systemd looks for autostart files (usually /etc/systemd/system/some_target.target.wants.
 * We will go over what a target is later in this guide).
 * To disable the service from starting automatically, you can type:
 * sudo systemctl disable application.service
 * This will remove the symbolic link that indicated that the service should be started automatically.
 */

import Systemctl from './systemctl'
import path from 'path'
import shx from 'shelljs'

export default class PveLive {
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

  create(root = '/') {
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
  start() {
    this.systemctl.start('pve-live')
    // this.systemctl.start('lxcfs')
    // this.systemctl.start('pve-cluster')
    // this.systemctl.start('pve-firewall')
    // this.systemctl.start('pve-guests')
    // this.systemctl.start('pve-ha-crm')
    // this.systemctl.start('pve-ha-lrm')
  }

  /**
   * 
   */
  stop() {
    this.systemctl.stop('pve-live')
  }
}
