#! /bin/bash

action=$(yad --width 300 --entry --title "Installa sistema" \
    --image=chick-64.png \
    --button="gtk-close:1"  --button="gtk-ok:0" \
    --text "\Scegliere la modalità di installazione del sistema:\ " \
    --entry-text \
    "Calamares - metodo grafico" "Hatch - Installazione da terminale")
ret=$?

[[ $ret -eq 1 ]] && exit 0

if [[ $ret -eq 2 ]]; then
    gdmflexiserver --startnew &
    exit 0
fi

case $action in
    Calamares*) cmd="sudo -H /usr/bin/calamares" ;;
    Hatch*) cmd="sudo eggs install" ;;
    *) exit 1 ;;    
esac

eval exec $cmd
