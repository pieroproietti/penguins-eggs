#!/bin/sh
#
# setup alpine build environment
# https://wiki.alpinelinux.org/wiki/Creating_an_Alpine_package#Setup_your_system_and_account
#
mkdir -p /var/cache/distfiles
chmod a+w /var/cache/distfiles
chgrp abuild /var/cache/distfiles
chmod g+w /var/cache/distfiles
su - alpine
abuild-keygen -a -i
