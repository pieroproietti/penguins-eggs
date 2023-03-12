#!/bin/bash
set -Eeuo pipefail



if mountpoint -q "/lib/live/mount"; then 
    # if isLive
    echo "E G G S: the reproductive system of penguins"
    echo
    echo "WARNING: A fully automated system installation is about to start,"
    echo "         ALL data on the hard drive present will be ERASED!"
    echo


    OS_HOSTNAME="NOT-CHECKED"
    # we must to check in same wat that we are formatting

    # TO DO

    # we need to reset connection    
    nmcli networking off
    nmcli networking on
    
    echo "I will completely format local system: ${OS_HOSTNAME}"
    echo
    echo "Installation will start in one minute, press CTRL-C to abort!"
    echo 
    echo -n "Waiting...";
    for _ in {1..59}; do read -rs -n1 -t1 || printf ".";done;echo

    ##################################################
    # At the moment we need to configure manually here
    ##################################################
    # USAGE
    #
    # $ eggs install [-k] [-c <value>] [-d <value>] [-h] [-i] [-n] [-N] [-p] [-r] [-s] [-S] [-u] [-v]
    #
    # FLAGS
    # -H, --halt            Halt the system after installation
    # -N, --none            Swap none: 256M
    # -S, --suspend         Swap suspend: RAM x 2
    # -c, --custom=<value>  custom unattended configuration
    # -d, --domain=<value>  Domain name, defult: .local
    # -h, --help            Show CLI help.
    # -i, --ip              hostname as ip, eg: ip-192-168-1-33
    # -k, --crypted         Crypted CLI installation
    # -n, --nointeractive   no user interaction
    # -p, --pve             Proxmox VE install
    # -r, --random          Add random to hostname, eg: colibri-ay420dt
    # -s, --small           Swap small: RAM
    # -u, --unattended      Unattended installation
    # -v, --verbose         Verbose

    # on XFCE we are sudo
    eggs install --custom=it --domain=.local --random --nointeractive --halt
else  
    # isInstalled
    rm -f /etc/sudoers.d/eui-users
    rm -f /usr/bin/eui-start.sh
    rm -f /etc/xdg/autostart/eui.desktop
fi


