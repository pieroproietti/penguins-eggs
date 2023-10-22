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

  create(root = '/') {
    shx.cp(path.resolve(__dirname, '../../scripts/pve-live.sh'), `${root}usr/bin/`)
    shx.chmod('x',`${root}usr/bin/pve-live.sh`)

    shx.cp(path.resolve(__dirname, '../../scripts/pve-live.service'), `${root}lib/systemd/system/`)
    shx.chmod('x',`${root}lib/systemd/system/pve-live.service`)
  }

  enable() {
    this.systemctl.enable('pve-live')
  }

  disable() {
    this.systemctl.disable('pve-live')
  }

  start() {
    this.systemctl.start('pve-live')
  }

  stop() {
    this.systemctl.stop('pve-live')
  }
}
