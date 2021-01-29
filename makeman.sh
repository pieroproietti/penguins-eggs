#!/bin/bash

# eseguo prepack per aggiornare README.md
me=`whoami`
sudo chown ${me}:${me} * -R
npm run prepack

# Rimuovo la directory man e la ricreo
rm man -rf
mkdir -p man/sources
mkdir -p man/man1

# estraggo i dati da README.md (toc, usage e commands)
#sed -n '/<!-- toc -->/,/<!-- tocstop -->/p' README.md > man/sources/toc.md
sed -n '/<!-- usage -->/,/<!-- usagestop -->/p' README.md > man/sources/usage.md
sed -n '/<!-- commands -->/,/<!-- commandsstop -->/p' README.md > man/sources/commands.md
# tolgo i tags <code> in command
sed -i 's|`||g' man/sources/commands.md
# tolgo See code: in command
sed -i 's|_See code:.*||g' man/sources/commands.md


#usage=`cat man/sources/usage.md`
command=`cat man/sources/commands.md`

lead='^<!-- usage -->'
tail='^<!-- usagestop -->'
sed -e "/$lead/,/$tail/{ /$lead/{p; r man/sources/usage.md
        }; /$tail/p; d }"  MANUAL.md > man/sources/MANUAL-usage.md

lead='^<!-- commands -->'
tail='^<!-- commandsstop -->'
sed -e "/$lead/,/$tail/{ /$lead/{p; r man/sources/commands.md
        }; /$tail/p; d }"  man/sources/MANUAL-usage.md > man/sources/eggs.md

rm man/sources/MANUAL-usage.md

# Creo il file roff
ronn --roff --html man/sources/eggs.md  --manual='eggs manual' --organization=penguins-eggs.net  --style=toc,80c --section 1 -o man/man1/
mv man/man1/eggs.md.1 man/man1/eggs.1
gzip man/man1/eggs.1
sudo mv  man/man1/eggs.1.gz man/man1/eggs.1
sudo rm /usr/local/man/man1 -rf
sudo mkdir -p /usr/local/man/man1
sudo cp man/man1/eggs.1 /usr/local/man/man1/eggs.1
sudo mandb

