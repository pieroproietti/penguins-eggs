/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * gestione systemd
 * Presa da https://github.com/VolantisDev/node-systemctl
 */

 import {exec} from'../lib/utils'

export default class SistemdCtl {

    async daemonReload() {
        return run('daemon-reload')
    }

    async disable(serviceName: string) {
        return run('disable', serviceName)
    }

    async enable(serviceName: string) {
        return run('enable', serviceName)
    }

    async isEnabled(serviceName: string) {
        return new Promise((resolve, reject) => {
            run('is-enabled', serviceName)
                .then((result) => {
                    resolve(result.stdout.indexOf('enabled') != -1)
                })
                .catch(function (err) {
                    resolve(false)
                })
        })
    }

    async restart(serviceName: string) {
        return run("restart", serviceName)
    }

    start(serviceName: string) {
        return run("start", serviceName)
    }

    stop(serviceName: string) {
        return run("stop", serviceName)
    }
}

/**
 * 
 */
async function run(cmd: string, serviceName = '') {
    let command = 'systemctl ' + cmd

    if (serviceName !== '') {
        command = command + ' ' + serviceName
    }
    console.log(command)
    return exec(command)
}
