#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive

####################################################################################################################################
# 1 check
cd $CMD_PATH
env
pwd
whoami

####################################################################################################################################
# 3 ppa install penguins-eggs

cd $CMD_PATH
apt update -y
apt upgrade -y
apt install sudo -y
apt install git -y
apt install linux-image-amd64 -y

mkdir ~/git/
cd ~/git/
git clone https://github.com/pieroproietti/get-eggs
cd get-eggs
./get-eggs.sh
eggs --version
eggs produce -n -v

date
