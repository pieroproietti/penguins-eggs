#!/bin/bash
sudo rm /usr/local/man -rf
sudo mkdir -p /usr/local/man/man1
sudo pandoc -f markdown eggs.1.md -t man -o /usr/local/man/man1/eggs.1
sudo gzip /usr/local/man/man1/eggs.1
sudo mandb
man eggs
