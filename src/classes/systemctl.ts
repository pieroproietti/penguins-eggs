/**
 * gestione systemd
 * 
 * Presa da https://github.com/VolantisDev/node-systemctl
 * 
 */

// libraries
const exec = require('../lib/utils').exec


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

/**
 * pve live service
 * /etc/systemd/system/pve-live.service:
 * abilita con systemctl enable pve
 */
/*
[Unit]
Description=pve live service
After=network.target
StartLimitIntervalSec=0
[Service]
Type=simple
Restart=always
RestartSec=1
User=root
ExecStart=/usr/bin/env php /path/to/server.php

[Install]
WantedBy=multi-user.target
*/

/**
 * hosts
*/
/*
127.0.0.1	localhost 
{{address}} {{host}} {{fqn}}
::1	localhost ip6-localhost ip6-loopback

ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
*/