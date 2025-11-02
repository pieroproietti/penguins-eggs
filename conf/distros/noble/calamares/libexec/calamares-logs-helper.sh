#!/bin/sh
# SPDX-FileCopyrightText: 2018-2019 Harald Sitter <sitter@kde.org>
# SPDX-License-Identifier: GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL

set -ex

# may fail
root=$1
install_dir=$root/var/log/installer
log_path=".cache/calamares/session.log"
[ -d $install_dir ] || mkdir -p $install_dir

if [ -e $HOME/$log_path ]; then
       cp  $HOME/$log_path $install_dir/debug
elif [ -e /root/$log_path ] ; then
       cp  /root/$log_path $install_dir/debug
else
       echo "WARNING: Cannot find calamares/session.log"
fi

cp /run/live/mount/medium/.disk/info $install_dir/media-info
#cp /var/log/casper.log $install_dir/casper.log
cp /var/log/syslog $install_dir/syslog

gzip --stdout $root/var/lib/dpkg/status > $install_dir/initial-status.gz

# OEM id isn't a thing, when in OEM mode ubiquity would also archive that.
# https://github.com/calamares/calamares/issues/943

chmod -v 600 $install_dir/*
# Make these world readable, they can absolutely not contain anything relevant
# to security.
chmod -v 644 $install_dir/initial-status.gz
chmod -v 644 $install_dir/media-info
