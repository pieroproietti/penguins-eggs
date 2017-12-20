#!/bin/bash
#
# parameter: none
#
IS_LIVE=$(mount|grep squashfs)
if [[ -z $IS_LIVE ]]; then
  ## falso
  echo "0"
else
  ## vero
  echo "1"
fi
