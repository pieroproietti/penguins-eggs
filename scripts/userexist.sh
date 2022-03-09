#!/bin/sh
if  getent passwd "$1"  > /dev/null; then
    echo "user: $1 exists"
else
    echo "user: $1 NOT exists"
fi
