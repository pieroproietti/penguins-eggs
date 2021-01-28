#!/bin/bash
rm man -rf
mkdir -p man/sources
mkdir -p man/man1
cp README.md man/sources/eggs.md
ronn --roff --html man/sources/eggs.md  --manual='eggs manual' --style=toc,80c --section 1 -o man/man1/
mv man/man1/eggs.md.1 man/man1/eggs.1
gzip man/man1/eggs.1
mv  man/man1/eggs.1.gz man/man1/eggs.1

#rm /usr/local/man/man1 -rf
#mkdir -p /usr/local/man/man1
#sudo cp man/man1/eggs.1 /usr/local/man/man1/eggs.1
#sudo mandb
#man eggs

