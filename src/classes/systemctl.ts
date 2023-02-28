/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * gestione systemd
 * Presa da https://github.com/VolantisDev/node-systemctl
 */

import {exec} from '../lib/utils'
import Utils from './utils'

export default class SistemdCtl {
  echo = {}

  constructor(verbose = false) {
    this.echo = Utils.setEcho(verbose)
  }

  /**
   *
   */
  async reload(service: string) {
    await exec(`systemctl reload ${service}`, this.echo)
  }

  /**
   *
   */
  async disable(service: string, chroot = '/', report = false) {
    await exec(`chroot ${chroot}} systemctl disable ${service}`, this.echo)
    if (report) {
      console.log(`systemctl: disabled ${service} on ${chroot}`)
    }
  }

  /**
   *
   */
  async enable(service: string) {
    await exec(`systemctl enable ${service}`, this.echo)
  }

  /**
   *
   */
  async restart(service: string) {
    await exec(`systemctl restart ${service}`, this.echo)
  }

  /**
   *
   */
  async start(service: string) {
    await exec(`systemctl start ${service}`, this.echo)
  }

  /**
   *
   */
  async stop(service: string) {
    await exec(`systemctl stop ${service}`, this.echo)
  }

  /**
   *
   * @param service
   * @returns
   */
  async isActive(service: string) {
    return new Promise((resolve, reject) => {
      exec(`systemctl is-active ${service}`, this.echo)
      .then(result => {
        resolve(!result.data.includes('inactive'))
      })
      .catch(function (error) {
        resolve(false)
      })
    })
  }

  /**
   *
   */
  async isEnabled(service: string) {
    return new Promise((resolve, reject) => {
      exec(`systemctl is-enabled ${service}`, this.echo)
      .then(result => {
        resolve(result.data.includes('enabled'))
      })
      .catch(function (error) {
        resolve(false)
      })
    })
  }
}
