/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * gestione systemd
 * Presa da https://github.com/VolantisDev/node-systemctl
 */

import { exec } from '../lib/utils'

export default class SistemdCtl {

  /**
   * 
   */
   async daemonReload() {
    await run('daemon-reload')
  }

  /**
   * 
   */
   async disable(service: string) {
    await run('disable', service)
  }

  /**
   * 
   */
   async enable(service: string) {
    await run('enable', service)
  }

  /**
   * 
   */
   async restart(service: string) {
    await run('restart', service)
  }

  /**
   * 
   */
   async start(service: string) {
    await run('start', service)
  }

  /**
   * 
   */
   async stop(service: string) {
    await run('stop', service)
  }

  /**
   * 
   */
   async isEnabled(service: string) {
    return new Promise((resolve, reject) => {
      run('is-enabled', service)
        .then((result) => {
          resolve(result.data.includes('enabled'))
        })
        .catch(function (error) {
          resolve(false)
        })
    })
  }

}

/**
 * run
 */
async function run(cmd: string, service = '') {
  let command = 'systemctl ' + cmd

  if (service !== '') {
    command = command + ' ' + service
  }
  return await exec(command)
}
