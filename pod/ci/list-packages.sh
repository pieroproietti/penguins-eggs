#!/bin/bash
set -x
if [ -f /etc/os-release ]; then
    source /etc/os-release
    if [[ "$ID" == "debian" ]]; then
        apt list --installed | cut -d '/' -f1
    elif [[ "$ID" == "ubuntu" ]]; then
        apt list --installed | cut -d '/' -f1
    elif [[ "$ID" == "arch" ]]; then
        pacman -Q
    fi
fi


