#!/bin/bash
#
# parameter: none
#
IS_LIVE=$(mount|grep squashfs)
if [[ -z $IS_LIVE ]]; then
  echo "1"
else
  ## vero
  echo "0"
fi
