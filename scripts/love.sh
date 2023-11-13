#!/bin/bash -e

function kill {
    sudo eggs kill
}

function produce {
    sudo eggs dad --default
    sudo eggs tools clean
    sudo eggs produce
}

# main
kill
produce
