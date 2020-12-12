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
import Utils from './utils'
import os = require('os')
import fs = require('fs')

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

    create() {
        this.createScript()
        this.createService()
    }
    
    /**
     * 
     */
    createScript() {
        const file = '/usr/bin/pve-live.sh'
        let content = ''
        content += '#!/bin/bash\n'
        content += 'IP=`hostname -I`\n'
        content += 'HOSTNAME=`hostname`\n'
        content += 'FQN=`host -TtA $HOSTNAME|grep "has address"|awk '{ print $1 } '`\n'
        content += '#\n'
        content += '# scrive il file /etc/hosts \n'
        content += '#\n'
        content += 'cat <<EOF >/etc/hosts\n'
        content += '127.0.0.1 localhost localhost.localdomain\n'
        content += '${IP} ${HOSTNAME} ${FQN} pvelocalhost\n'
        content += '# The following lines are desirable for IPv6 capable hosts\n'
        content += '::1     ip6-localhost ip6-loopback\n'
        content += 'fe00::0 ip6-localnet\n'
        content += 'ff00::0 ip6-mcastprefix\n'
        content += 'ff02::1 ip6-allnodes\n'
        content += 'ff02::2 ip6-allrouters\n'
        content += 'ff02::3 ip6-allhosts\n'
        content += 'EOF\n'
        fs.writeFileSync(file, content)
    }

    /**
     * 
     */
    createService() {
        const file = '/etc/systemd/system/pve-live.service'
        let content = ''
        content += '\n'
        content += '[Unit]\n'
        content += 'Description=pve-live service\n'
        content += 'After=network.target\n'
        content += 'StartLimitIntervalSec=0\n'
        content += '[Service]\n'
        content += 'Type=simple\n'
        content += 'Restart=always\n'
        content += 'RestartSec=1\n'
        content += 'User=root\n'
        content += 'ExecStart=/usr/bin/pve-live.sh\n'
        content += '\n'
        content += '[Install]\n'
        content += 'WantedBy=multi-user.target\n'
        fs.writeFileSync(file, content)
    }
}