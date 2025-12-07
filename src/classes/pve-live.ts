/**
 * ./src/classes/pve-live.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
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

import path from 'node:path'
import {shx} from '../lib/utils.js'

import Systemctl from './systemctl.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default class PveLive {
  systemctl = {} as Systemctl

  constructor() {
    this.systemctl = new Systemctl()
  }

  create(root = '/') {
    // console.log("root:" + root)
    shx.cp(path.resolve(__dirname, '../../scripts/pve-live.sh'), `${root}/usr/bin/`)
    shx.exec(`chmod +x ${root}/usr/bin/pve-live.sh`)
    // console.log(`pve-live: ${root}/usr/bin/pve-live.sh`)

    shx.cp(path.resolve(__dirname, '../../scripts/pve-live.service'), `${root}/lib/systemd/system/`)
    shx.exec(`chmod +x ${root}/lib/systemd/system/pve-live.service`)
    // console.log(`pve-service: ${root}lib/systemd/system/pve-live.service`)

    // enable service
    const src = `${root}/usr/lib/systemd/system`
    const dest = `${root}/etc/systemd/system/multi-user.target.wants`
    shx.exec(`ln -s ${src}/pve-live.service ${dest}/pve-live.service`)
    // Utils.pressKeyToExit("check it!",true)
  }

  disable() {
    this.systemctl.disable('pve-live')
  }

  enable() {
    this.systemctl.enable('pve-live')
  }

  start() {
    this.systemctl.start('pve-live')
  }

  stop() {
    this.systemctl.stop('pve-live')
  }
}
