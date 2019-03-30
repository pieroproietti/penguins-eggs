#!/bin/bash
#
# parameter: none 
#
IS_LIVE=$(ls /lib/live|grep mount)
if [[ -z $IS_LIVE ]]; then
  echo "1"
else
  echo "0"
fi
