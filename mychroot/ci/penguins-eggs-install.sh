#!/usr/bin/env bash

set -x

##
#
#
function arch_install {
    PENGUINS_EGGS_ARCH="./penguins-eggs-10.1.*-any.pkg.tar.zst "    

    if ls $PENGUINS_EGGS_ARCH 1> /dev/null 2>&1; then
        pacman -U $PENGUINS_EGGS_ARCH --noconfirm
    else
        tarballs_install
    fi
    
}

##
#
#
function debs_install {
    PENGUINS_EGGS_DEB="./penguins-eggs_10.1.*-*_amd64.deb"

    if ls $PENGUINS_EGGS_DEB 1> /dev/null 2>&1; then
        apt install -y $PENGUINS_EGGS_DEB
    else
        tarballs_install
    fi
}

##
#
#
function tarballs_install {
    PENGUINS_EGGS_INSTALL_DIR="/opt/penguins-eggs/"
    PENGUINS_EGGS_TARBALLS="./penguins-eggs_10.1.*-*-linux-x64.tar.gz"

    if ls $PENGUINS_EGGS_DEB 1> /dev/null 2>&1; then
        # Create /opt if not exists
        if [ ! -d "/opt" ]; then
            mkdir /opt
        fi

        # Rimozione di /opt/penguins-eggs se esiste
        if [ -d "$PENGUINS_EGGS_INSTALL_DIR" ]; then
            rm -rf "$PENGUINS_EGGS_INSTALL_DIR"
        fi

        # extract package
        tar -xf $PENGUINS_EGGS_TARBALLS 
        if [ $? -ne 0 ]; then
            echo "Error: $PENGUINS_EGGS_TARBALLS not found or error on extract!"
        fi

        mv eggs penguins-eggs
        $SUDO mv penguins-eggs /opt/

        # create link themes  grub/isolinux
        ln -sf "${PENGUINS_EGGS_INSTALL_DIR}addons/eggs/theme/livecd/isolinux.main.full.cfg" "${PENGUINS_EGGS_INSTALL_DIR}addons/eggs/theme/livecd/isolinux.main.cfg"
        ln -sf "${PENGUINS_EGGS_INSTALL_DIR}addons/eggs/theme/livecd/grub.main.full.cfg" "${PENGUINS_EGGS_INSTALL_DIR}addons/eggs/theme/livecd/grub.main.cfg"

        # Bash completions
        if [ -d "/usr/share/bash-completion/completions/" ]; then
            rm -f /usr/share/bash-completion/completions/eggs.bash
            ln -sf "${PENGUINS_EGGS_INSTALL_DIR}scripts/eggs.bash" /usr/share/bash-completion/completions/eggs.bash
        fi

        # Zsh completions
        if [ -d "/usr/share/zsh/functions/Completion/Zsh/" ]; then
            rm -f /usr/share/zsh/functions/Completion/Zsh/_eggs
            ln -sf "${PENGUINS_EGGS_INSTALL_DIR}scripts/_eggs" /usr/share/zsh/functions/Completion/Zsh/
        fi

        # Icons
        if [ -d "/usr/share/icons/" ]; then
            rm -f /usr/share/icons/eggs.png
            ln -sf "${PENGUINS_EGGS_INSTALL_DIR}assets/eggs.png" /usr/share/icons/eggs.png
        fi

        # Manual
        if [ -d "/usr/share/man/man1" ]; then
            rm -f /usr/share/man/man1/eggs.1.gz
            ln -sf "${PENGUINS_EGGS_INSTALL_DIR}manpages/doc/man/eggs.1.gz" /usr/share/man/man1/eggs.1.gz
        fi

        # Link binary
        rm -f /usr/bin/eggs
        ln -sf "${PENGUINS_EGGS_INSTALL_DIR}bin/eggs" /usr/bin/eggs
    fi
}



##
# main
#
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "debian" ]]; then
        debs_install
    elif [[ "$ID" == "devuan" ]]; then
        debs_install
    elif [[ "$ID" == "ubuntu" ]]; then
        debs_install
    elif [[ "$ID" == "arch" ]]; then
        arch_install
    else
        tarballs_install
    fi
fi
