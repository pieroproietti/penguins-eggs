#!/bin/bash
#
# parameter: none
#
is_live=$(mount|grep squashfs)
if [ -z $is_live  ]; then
  echo false
else
  echo true
fi
