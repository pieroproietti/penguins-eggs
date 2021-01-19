#!/bin/bash
sudo rm /usr/local/man -rf
sudo mkdir -p /usr/local/man/man1
ronn -r eggs.1.md --style=toc,80c 
sudo cp eggs.1.md.1 /usr/local/man/man1/eggs.1
sudo mandb
man eggs
