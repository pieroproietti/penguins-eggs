#!/bin/bash
#
# parameter: none
#
IS_LIVE=$(mount|grep /run/live/medium/live/)
if [[ -z $IS_LIVE ]]; then
  # True
  echo "1"
else
  ## False
  echo "0"
fi
