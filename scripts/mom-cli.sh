#!/bin/bash

##
# eggs dialog cli
##

function main {

   while true; do
      # 20 righe. 75 caratteri, 16 altezza menu list
      answer=$(
      whiptail --title "mommy" --menu "Mama's gonna keep baby cosy and warm..." 22 75 15 \
      "init"            "init eggs, install prerequisites" \
      "dad"             "lead you to configurare and iso production" \
      "help"            "help" \
      "info"            "get informations" \
      "install"         "install your system on hard disk" \
      "kill"            "delete ISOs" \
      "produce"         "produce and ISO of your system" \
      "remove"          "remove eggs" \
      "update"          "update eggs package" \
      "DOCUMENTATION"   "documentation about eggs" \
      "EXPORT"          "export /deb/docs/iso" \
      "TOOLS"           "clean/initrd/locales/pve/sanitize/skel/yolk" \
      "quit"            "exit" 3>&2 2>&1 1>&3
      )

      case "$answer" in 
         "quit")
            clear
            exit ;;

         "init")
            init ;;

         "dad")
            dad ;;

         "DOCUMENTATION")
            documentation ;;

         "EXPORT")
            export ;;

         "help")
            help ;;

         "info")
            info ;;
         
         "install")
            install ;;

         "kill")
            kill ;;

         "produce")
            produce ;;

         "remove")
            remove ;;

         "TOOLS")
            tools ;;

         "update")
            update ;;

      esac

   done
}


################################
function dad {
   sudo eggs dad
}

################################
function documentation {
      answer=$(
         whiptail --title "DOCUMENTATION" --menu "You can choose local or internet documentation, html or man" 22 75 4 \
         "site"   "https://penguins-eggs.net" \
         "manual" "manual eggs html" \
         "man"    "man eggs" \
         "quit"            "up" 3>&2 2>&1 1>&3
      )

      case "$answer" in 
         "site")
            documentation_site ;;

         "man")
            documentation_man ;;

         "manual")
            documentation_html ;;
      esac
}

################################
function documentation_site {
   sensible-browser "https://penguins-eggs.net"
}

################################
function documentation_man {
   man_eggs='/usr/bin/man eggs'
   ${man_eggs}
}

################################
function documentation_html {
   sensible-browser "file:///usr/lib/penguins-eggs/man/man1/eggs.md.1.html"
}



################################
function export {

      answer=$(
      whiptail --title "EXPORT" --menu "Export your eggs or packages in remote host..." 22 75 14 \
      "deb"    "export package eggs-v7-x-x-1.deb in the destination host" \
      "docs"   "remove and export docType documentation of the sources in the destination host" \
      "iso"    "export iso in the destination host" \
      "quit"            "up" 3>&2 2>&1 1>&3
      )

      case "$answer" in 
         "deb")
            export_deb ;;

         "docs")
            export_docs ;;

         "iso")
            export_iso ;;
      esac
}

################################
function export_deb {
   eggs export:deb -c
   press_a_key_to_continue
}

################################
function  export_docs {
   eggs export:docs
   press_a_key_to_continue
}

################################
function export_iso {
   eggs export:iso -c
   press_a_key_to_continue
} 

################################
function help {
   eggs help
   press_a_key_to_continue
}

################################
function info {
   eggs info
   press_a_key_to_continue
}

################################
function install {
   sudo eggs install 
   press_a_key_to_continue
}

################################
function kill {
   sudo eggs kill
   press_a_key_to_continue
}


################################
function init {
   sudo eggs init
   press_a_key_to_continue
}

################################
function produce {
   answer= $(
   whiptail --title "produce" --menu "Choose the prefered method..." 22 75 14 \
   "fast"    "create fast an ISO large" \
   "standard"  "create an ISO standard compressio" \
   "compress"  "create an ISO max compression" \
   "quit"      "up" 3>&2 2>&1 1>&3
   )

   case "$answer" in 
      "fast")
         fast ;;

      "standard")
         standard ;;

      "compress")
         compress ;;
   esac
}

################################
function fast {
   sudo eggs produce --fast --verbose
}

################################
function standard {
   sudo eggs produce --verbose
}

################################
function compress {
   sudo eggs produce --compress --verbose
}

################################
function remove {
   answer= $(
   whiptail --title "remove" --menu "Remove prerequisites, eggs or purge..." 22 75 14 \
   "prerequisites"   "remove prerequisites only" \
   "all"             "remove prerequisites and eggs" \
   "purge"           "remove prerequisites, eggs and purge" 
   "quit"      "up" 3>&2 2>&1 1>&3
   )

   case "$answer" in 
      "prerequisites")
         remove_prerequisites ;;

      "all")
         remove_all ;;

      "purge")
         remove_purge ;;
   esac
}

################################
function remove_prerequisites {
   sudo eggs remove --prerequisites
}

################################
function remove_all {
   sudo eggs remove --all
}

################################
function remove_purge {
   sudo eggs remove --purge
}

################################
function tools {
   answer= $(
   whiptail --title "TOOLS" --menu "eggs's companions tools" 22 75 14 \
   "clean"     "clean system log, apt, etc" \
   "initrd"    "initrd (experimental)" \
   "locales"   "install/clean locales" \
   "pve"       "enable/start/stop pve-live (experimental)" \
   "sanitize"  "remove eggs remains and sanitize" \
   "skel"      "update skel from home configuration" \
   "yolk"      "configure internal repo /usr/local/yolk" \
   "quit"      "up" 3>&2 2>&1 1>&3
   )

   ${answer}
   case "$answer" in 
      "clean")
         tools_clean ;;

      "initrd")
         tools_initrd ;;

      "locales")
         tools_locales ;;

      "pve")
         tools_pve ;;

      "sanitize")
         tools_sanitize ;;

      "skel")
         tools_skel ;;

      "yolk")
         tools_yolk ;;
   esac

}

################################
function tools_clean {
   sudo eggs tools:clean
   press_a_key_to_continue
}

################################
function tools_initrd {
   sudo eggs tools:initrd
   press_a_key_to_continue
}

################################
function tools_locales {
   sudo eggs tools:locales
   press_a_key_to_continue
}

################################
function tools_pve {
   sudo eggs tools:pve
   press_a_key_to_continue
}

################################
function tools_sanitize {
   sudo eggs tools:sanitize
   press_a_key_to_continue
}

################################
function tools_skel {
   sudo eggs tools:skel
   press_a_key_to_continue
}

################################
function tools_yolk {
   sudo eggs tools:yolk
   press_a_key_to_continue
}

################################
function update {
   sudo eggs update
   press_a_key_to_continue
}


function press_a_key_to_continue {
   read -p "Press enter to continue"
}

################################
function EXIT {
   exit 0
}

main
