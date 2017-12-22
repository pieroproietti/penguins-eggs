#!/bin/bash
#
# parameter: none
#
IS_MOUNTED=$(mount|grep $CHECK)
echo $IS_MOUNTED
if [[ -z $IS_MOUNTED ]]; then
  echo "1"
else
  echo "0"
fi
