/**
 * 
 */

// libraries
const exec = require('../lib/utils').exec


export default class Pve {

    /**
     * enable PveLIve
     */
    enable () {

    }

    /**
     * disable
     */
    disable() {

    }

    // Edita hosts 
    
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
}