#!/bin/bash
# Script author: Piero Proietti
# Script site: https://github.com/pieroproietti/penguins-eggs
# Script date: 28/9/2019
# Script per scegliere l'installer per eggs

##
function conferma(){
zenity \
--title="Assistente di Penguin's eggs" \
--question \
--text "L'installazione si è conclusa. \
Puoi riavviare il tuo sistema o continuare ad usare la versione live" \
--ok-label="Continua con la live" \
--cancel-label="Reboot" \
--width=400 \
--height=100
case $? in
    0)
        ;;
    1)
        sudo reboot
        ;;
esac
}




zenity --title="Assistente Penguin's eggs" \
    --text-info \
    --html \
    --filename=/usr/lib/node_modules/penguins-eggs/assistant/assistant.html \
    --width=700 \
    --height=500

ans=$(zenity --list \
    --title="Assistente di Penguin's eggs" \
    --text "Puoi selezionare: \
    <i>calamares</i> installer grafico,\
    <i>hatch</i> installazione da terminale"\
    --radiolist \
    --column "Scelta" \
    --column "Opzioni" \
    FALSE "calamares" \
    FALSE "hatch" \
    TRUE "live" --separator=":" \
    --width=700 \
    --height=200)


case "$ans" in
    calamares)
        zenity \
        --title="Assistente di Penguin's eggs" \
        --question \
        --text "E' stato selezionato  l'installer grafico <b>calamares</b>\
        <i>Questo installer può cancellare il vostro disco rigido!</i>"\
        --ok-label="Si, continua con Calamares" \
        --cancel-label="No"\
        --width=400 \
        --height=100
        case $? in 
            0)
            xterm -title "Assistant GUI installer" -e sudo calamares
            ;; 
        1) 
            ;; 
        esac
        ;;

    hatch)
        zenity \
        --title="Assistente di Penguin's eggs" \
        --question \
        --text "E' stato selezionato l'installer da terminale <b>eggs hatch</b>. \
        <i>Attenzione, questo installer può cancellare il vostro disco rigido</i> \
        Sicuri di voler continuare?"\
        --ok-label="Si, installa con eggs hatch" \
        --cancel-label="No" \
        --width=400 \
        --height=100
        case $? in 
            0)
            xterm -title "Assistant CLI installer" -e sudo eggs hatch
            conferma
                ;; 
            1) 
                ;; 
        esac
        ;;
esac

