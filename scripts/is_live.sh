#!/bin/bash
#
# parameter: none
#
IS_LIVE=$(mount|grep squashfs)
if [[ -z $IS_LIVE ]]; then
  # True
  echo "1"
else
  ## False
  echo "0"
fi
