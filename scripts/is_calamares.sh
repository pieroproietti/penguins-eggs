#!/bin/bash
IS_CALAMARES=$(dpkg -l|grep calamares)
if [[ -z $IS_CALAMARES ]]; then
  echo "0"
else
  echo "1"
fi


