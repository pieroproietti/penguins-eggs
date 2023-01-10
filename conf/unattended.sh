#!/bin/sh
#
# read https://www.linux.it/~rubini/docs/init/init.html 
#
export PATH=/usr/bin:/bin:/sbin:/usr/sbin
eggs install --unattended
/sbin/getty tty1

