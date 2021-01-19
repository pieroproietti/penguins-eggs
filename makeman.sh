#!/bin/bash
sudo rm /usr/local/man/man1 -rf
sudo mkdir -p /usr/local/man/man1
rm man/man1 -rf
mkdir man/man1
ronn --roff --html man/sources/eggs.md  --manual='eggs manual' --style=toc,80c --section 1 -o man/man1
mv man/man1/eggs.md.1 man/man1/eggs.1
gzip man/man1/eggs.1
mv  man/man1/eggs.1.gz man/man1/eggs.1
sudo cp man/man1/eggs.1 /usr/local/man/man1/eggs.1
sudo mandb
man eggs

