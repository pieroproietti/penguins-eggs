#!/bin/bash
sudo rm /usr/local/man/man1 -rf
sudo mkdir -p /usr/local/man/man1
ronn --roff --html man/sources/eggs  --manual='eggs manual' --style=toc,80c --section 1 -o man/man1
gzip /usr/local/man/man1/eggs.1 
sudo cp man/man1/eggs.1.gz /usr/local/man/man1/eggs.1
sudo mandb
man eggs

