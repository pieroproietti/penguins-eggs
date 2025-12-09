#!/bin/sh
# SPDX-FileCopyrightText: 2018-2019 Harald Sitter <sitter@kde.org>
# SPDX-License-Identifier: GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL

# apt install language-selector-common

# calamares currently has subpar l10n capabilites.
# this helper is ment to aid in getting very primitive language support
# of the ground by using a helper from ubuntu's language-selector-common
# to retrieve a list of packages required for the chosen system language
# and then manually installig it.
# https://github.com/calamares/calamares/issues/924

set -ex

. /etc/default/locale

echo $LANG
echo $LC_TIME
without_ext=$(echo $LANG | cut -d. -f1)

# Calamares technically should mangle locale.gen, but it's broken
# https://github.com/calamares/calamares/issues/940
# To unbreak this call locale-gen manually with LC_TIME. This may be the same
# as LANG, which gets set up by lang-pack-en-base
# (installed by check-language-support).
# But since the pack may be any language and network might not be available
# we set up both the LANG and LC_TIME so that both are definitely set up
# regardless of network availablity or calamares bugs.
# NB: this is a special way of calling it unique to Ubuntu which will mangle
#   the config and enable it in one go
/usr/sbin/locale-gen --keep-existing "$LANG"
/usr/sbin/locale-gen --keep-existing "$LC_TIME"

apt-get update || true
# we need language-selector-common 
apt-get install language-selector-common || true
missing=$(check-language-support --language="$without_ext")
apt-get install -y $missing || true
