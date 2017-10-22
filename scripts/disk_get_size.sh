#!/bin/bash
get_size_dev=`parted -s $1 unit b print free | grep Free | awk '{print $3}' | cut -d "M" -f1`
echo $get_size_dev
