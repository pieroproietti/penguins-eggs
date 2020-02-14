#!/bin/bash
HOST='192.168.61.2'
USER='root'
PATH_DEBS='/home/artisan/sourceforge/DEBS/'
FILES='eggs_7.1.??-?_amd64.deb'
ssh ${USER}@${HOST} rm -rf ${PATH_DEBS}$FILES
scp ./dist/deb/${FILES} ${USER}@${HOST}:${PATH_DEBS}