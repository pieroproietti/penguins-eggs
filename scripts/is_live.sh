#!/bin/bash
#
# parameter: none
#
is_live=$(mount|grep squashfs)
if [ -z ${is_live+x} ]; then
  echo `false`
else
  echo `true`
fi
