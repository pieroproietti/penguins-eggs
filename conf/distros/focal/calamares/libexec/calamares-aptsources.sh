#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL
# SPDX-FileCopyrightText: 2020 Harald Sitter <sitter@kde.org>

# Carry nomodeset into chroot

set -ex

echo "Reinstalling ubuntu-keyring"

ls /etc/apt/sources.list.d/

apt-get install --reinstall ubuntu-keyring

ls /etc/apt/sources.list.d/
