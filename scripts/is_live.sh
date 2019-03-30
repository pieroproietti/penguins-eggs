#!/bin/bash
#
# parameter: none
#
IS_LIVE=$(ls /lib/live|grep mount)
if [[ -z $IS_LIVE ]]; then
  # Non esiste mount
  echo "0"
else
  ## mount
  echo "1"
fi
