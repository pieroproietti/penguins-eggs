#!/bin/sh
curl -SsL https://pieroproietti.github.io/penguins-eggs-ppa/debian/KEY.gpg | sudo apt-key add -
sudo curl -s --compressed -o /etc/apt/sources.list.d/penguins-eggs-ppa.list "https://pieroproietti.github.io/penguins-eggs-ppa/debian/penguins-eggs-ppa.list"
