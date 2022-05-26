#!/bin/bash
rm /etc/locale.gen
apt-get install locales --reinstall
if [ -z "$1" ]; then
    LANG='en_US.UTF.8'
else
    LANG=$1
fi
sed -i -e "s/# ${LANG}.*/${LANG} UTF-8/" /etc/locale.gen
dpkg-reconfigure --frontend=noninteractive locales
update-locale LANG=${LANG}
