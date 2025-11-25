#!/bin/bash
set -e
DEST="../distro-packages"
cp arch/penguins-eggs-deps-1.0.0-1-any.pkg.tar.zst $DEST/arch
cp debs/penguins-eggs-deps_1.0.0_amd64.deb $DEST/debian
cp manjaro/penguins-eggs-deps-1.0.0-1-any.pkg.tar.zst $DEST/manjaro
cp rpm/penguins-eggs-deps-1.0.0-1.fc42.noarch.rpm $DEST/rpm
cp rpm/penguins-eggs-deps-1.0.0-1.el9.noarch.rpm $DEST/rpm
cp rpm/penguins-eggs-deps-1.0.0-1.opensuse.noarch.rpm $DEST/rpm
