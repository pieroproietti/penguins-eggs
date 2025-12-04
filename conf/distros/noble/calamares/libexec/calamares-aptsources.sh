#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL
# SPDX-FileCopyrightText: 2020 Harald Sitter <sitter@kde.org>

# Carry nomodeset into chroot

set -ex

#Do Tasks For Detected OS
. /etc/os-release

echo "Detected OS ID: $ID"

case $ID in
  ubuntu) 
    echo "Reinstalling ubuntu-keyring"
    apt install --reinstall ubuntu-keyring
    ;;
  *) 
    echo "Not pure Ubuntu Distribution. Script skipped"
    ;;
esac
