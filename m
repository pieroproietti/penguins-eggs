#!/bin/bash

# 1. Pulizia e compilazione nativa dei binari direttamente qui
make clean
make all

# 2. Generazione dei documenti (Man Pages) prima di impacchettare
# L'asterisco funzionerà sempre perché i file nascono un istante prima
./coa/coa tools doc

# 3. Lancio del builder per creare i pacchetti (RPM/DEB) 
./coa/coa tools build
