#!/usr/bin/env bash

/usr/bin/sed -i '/^>>>eggs/,/^\<<<eggs/{/^#/!{/^\$/!d;};}' /etc/issue
/usr/bin/sed -i '/^>>>eggs/,/^\<<<eggs/{/^#/!{/^\$/!d;};}' /etc/motd
