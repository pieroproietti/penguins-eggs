#!/bin/bash
# Wrapper per forzare l'esecuzione di update-initramfs

# Esegue il comando di creazione dell'initramfs per tutti i kernel installati
update-initramfs -c -k all
