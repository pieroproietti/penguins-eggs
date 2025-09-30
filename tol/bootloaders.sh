#!/bin/bash

_bootloadersver=25.9.8
wget -P /tmp https://github.com/pieroproietti/penguins-bootloaders/releases/download/v$_bootloadersver/bootloaders.tar.gz
sudo mkdir -p /usr/lib/penguins-eggs/
sudo tar -xf /tmp/bootloaders.tar.gz -C /usr/lib/penguins-eggs
