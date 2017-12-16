#!/bin/bash
#
# parameter: none
#
IS_LIVE=$(mount|grep squashfs)
if [[ -z $IS_LIVE ]]; then
  echo false
else
  echo true
fi
