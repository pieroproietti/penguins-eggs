#!/bin/bash
#
# parameter: none
#
IS_MOUNTED=$(mount|grep $1)
if [[ -z $IS_MOUNTED ]]; then
  echo "0"
else
  echo "1"
fi
