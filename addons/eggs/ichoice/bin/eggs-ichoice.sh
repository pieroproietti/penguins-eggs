#!/bin/bash
# Script author: Piero Proietti
# Script site: https://github.com/pieroproietti/penguins-eggs
# Script date: 28/9/2019
# Script per scegliere l'installer per eggs

##
function main() {
      answer=$(
      whiptail --title "penguin's eggs" --menu "Choose the system installer" 22 75 10 \
         "gui"      "use gui installer calamares (reccomanded)" \
         "cli"      "use CLI installer eggs (servers just CLI)" \
         "quit"     "exit" 3>&2 2>&1 1>&3
      )

        case "$answer" in 
         "quit")
            theEnd ;;

         "cli")
            eggs ;;

         "gui")
            calamares ;;
       esac
}

################################
function eggs {
   sudo eggs install --cli
}

################################
function calamares {
   sudo calamares
}

################################
function theEnd {
   clear
   exit 0
}

main