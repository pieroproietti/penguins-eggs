#!/bin/env bash
sudo eggs kill
sudo cp eui.sh /opt
sudo cp eggs-autologin.service /etc/systemd/system/getty@.service.d/override.conf
sudo cp eui.service /etc/systemd/system/
sudo systemctl enable eui.service
sudo eggs produce
sudo systemctl disable eui.service
sudo rm /etc/systemd/system/getty@.service.d/override.conf
sudo rm /etc/systemd/system/eui.service
sudo rm /opt/eui.sh
sudo eggs cuckoo
