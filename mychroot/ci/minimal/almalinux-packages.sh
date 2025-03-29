#!/bin/bash

# This script installs prerequisites for penguins-eggs
# on almalinux/rocky, it is intended for development purposes 

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# check if we are on rocky or almalinux
if [ ! -f /etc/almalinux-release ]; then
    if [ ! -f /etc/fedora-release ]; then
        if [ ! -f /etc/rocky-release ]; then
            echo "This script is intended for almalinux, rocky or fedora!"
            exit 1
        fi
    fi
fi

# Create /opt if not exists
if [ ! -d "/usr/share/applications" ]; then
    mkdir /usr/share/applications -p
fi

# packages to be added for a minimal standard installation
dnf install -y \
    nano \
    sudo
