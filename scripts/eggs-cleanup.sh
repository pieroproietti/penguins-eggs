#!/bin/bash

MOTD=/etc/motd
ISSUE=/etc/issue
/usr/bin/sed -i '/^eggs-start-message/,/^\eggs-end-message/{/^#/!{/^\$/!d;};}' ${MOTD}
/usr/bin/sed -i '/^eggs-start-message/,/^\eggs-ends-message/{/^#/!{/^\$/!d;};}' ${ISSUE}
exit 0
