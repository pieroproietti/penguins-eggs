#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL
# SPDX-FileCopyrightText: 2020 Harald Sitter <sitter@kde.org>

# Installs a different kernel.

set -ex

export DEBIAN_FRONTEND=noninteractive

KERNEL=$1

if [ "$KERNEL" = '' ]; then
  echo 'Need a kernel identifier as first arg'
  exit 1
fi

if ! curl http://networkcheck.kde.org; then
  echo 'To install a different kernel you need internet connection!'
  exit 1
fi

. /etc/os-release

apt-get update --yes
apt-get purge --yes linux-image-* linux-headers-* linux-modules-*
# - generic-hwe
# - oem
# Could technically be others as well, this entirely depends on what calamares
# defines.
apt-get install --yes linux-$KERNEL-$VERSION_ID
