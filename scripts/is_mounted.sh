#!/bin/bash
#
# parameter: none
#
CHECK=$1
IS_MOUNTED=$(mount|grep $CHECK)
#echo $IS_MOUNTED
if [[ -z $IS_MOUNTED ]]; then
  # False
  echo "0"
else
  ## True
  echo "1"
fi
