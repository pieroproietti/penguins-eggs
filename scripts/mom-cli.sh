#!/bin/bash

##
# eggs dialog cli
##

function main {

   while true; do
      # 20 righe. 75 caratteri, 16 altezza menu list
      answer=$(
      whiptail --title "mommy" --menu "Mama's gonna keep baby cosy and warm..." 22 75 16 \
         "config"          "configure eggs, install prerequisites" \
         "adapt"           "adapt monitor resolution for VM only" \
         "calamares"       "configure calamares or install and configure it" \
         "dad"             "ask help from daddy - configuration helper" \
         "help"            "display help for eggs" \
         "info"            "informations about system and eggs" \
         "install"         "system installer - the egg became a penguin" \
         "kill"            "kill the eggs/free the nest" \
         "produce"         "the system produce an egg: iso image of your system" \
         "remove"          "remove eggs and others stuff" \
         "update"          "update the penguin's eggs tool" \
         "Documentation"   "book/book_translated/manual/man" \
         "Export"          "deb/docs/iso" \
         "Tools"           "clean/locales/skel/yolk" \
         "quit"            "exit" 3>&2 2>&1 1>&3
      )

      case "$answer" in 
         "quit")
            theEnd ;;

         "config")
            config ;;

         "calamares")
            calamares ;;

         "adapt")
            adapt ;;

         "dad")
            dad ;;

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

         "Documentation")
            documentation ;;

         "Export")
            Export ;;

         "Tools")
            tools ;;

         "update")
            update ;;

      esac

   done
}

################################
function adapt {
   eggs adapt
}

################################
function config {
   sudo eggs config
   press_a_key_to_continue
}

################################
function calamares {
      answer=$(
         whiptail --title "Calamares installer" --menu "You can choose local or internet documentation, html or man" 22 75 14 \
         "configure"       "create calamares configuration" \
         "install"         "install calamares and create configuration" \
         "remove"          "remove calamares installer" \
         "quit"            "previus" 3>&2 2>&1 1>&3
      )

      case "$answer" in 
         "configure")
            calamares_configure ;;

         "install")
            calamares_install ;;

         "remove")
            calamares_remove ;;
      esac
}

################################
function calamares_configure {
   sudo eggs calamares 
}

################################
function calamares_install {
   sudo eggs calamares --install
}

################################
function calamares_remove {
   sudo eggs calamares --remove
}


################################
function dad {
   sudo eggs dad
}

################################
function documentation {
      answer=$(
         whiptail --title "DOCUMENTATION" --menu "You can choose local or internet documentation, html or man" 22 75 14 \
         "book"            "gui/internet penguin's eggs book - italian -" \
         "book_translated" "gui/internet penguin's eggs book - translated -" \
         "manual"          "gui/local man page eggs html" \
         "man"             "cli/local man page eggs" \
         "quit"            "previus" 3>&2 2>&1 1>&3
      )

      case "$answer" in 
         "book")
            documentation_book ;;
         "book_translated")
            documentation_book_translated ;;
         "man")
            documentation_man ;;
         "manual")
            documentation_html ;;
      esac
}

################################
function documentation_book {
   sensible-browser "https://penguins-eggs.net/book/italiano"
}

################################
function documentation_book_translated {
   sensible-browser "https://translate.google.com/translate?hl=en&sl=auto&tl=en&u=https%3A%2F%2Fpenguins-eggs.net%2Fbook%2Fitaliano"
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
   sensible-browser "file:///usr/lib/penguins-eggs/manpages/doc/man/eggs.1.html"
}



################################
function Export {

      answer=$(
      whiptail --title "EXPORT" --menu "Export your eggs or packages in remote host..." 22 75 14 \
         "deb"    "export package eggs-v7-x-x-1.deb in the destination host" \
         "docs"   "export docType source's documentation in the destination host" \
         "iso"    "export iso image in the destination host" \
         "quit"   "previus" 3>&2 2>&1 1>&3
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
function produce {
   answer=$(
   whiptail --title "produce" --menu "Choose the prefered method of production..." 22 75 14 \
      "fast"    "create fast an ISO (lz4 compression)" \
      "standard"  "create an ISO standard compression (xz compression)" \
      "compress"  "create an ISO max compression (xz -Xbcj x86)" \
      "quit"   "previus" 3>&2 2>&1 1>&3
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
   answer=$(
   whiptail --title "remove" --menu "Remove prerequisites, eggs or purge..." 22 75 14 \
      "all"             "remove eggs, prerequisites and purge" \
      "purge"           "remove eggs and purge"  \
      "autoremove"      "remove eggs and prerequisites" \
      "quit"   "previus" 3>&2 2>&1 1>&3
   )

   case "$answer" in 
      "all")
         remove_all ;;

      "autoremove")
         remove_autoremove ;;

      "purge")
         remove_purge ;;
   esac
}

################################
function remove_all {
   sudo eggs remove --autoremove --purge
   press_a_key_to_continue
}

################################
function remove_autoremove {
   sudo eggs remove --autoremove
   press_a_key_to_continue
}


################################
function remove_purge {
   sudo eggs remove --purge
   press_a_key_to_continue
}

################################
function tools {
   answer=$(
   whiptail --title "TOOLS" --menu "eggs companions tools" 22 75 14 \
      "clean"     "clean system logs, apt cache, etc" \
      "locales"   "install/clean locales" \
      "skel"      "update /etc/skel from current user or user configuration" \
      "yolk"      "configure an internal apt repository in /usr/local/yolk" \
      "quit"   "previus" 3>&2 2>&1 1>&3
   )

   case "$answer" in 
      "clean")
         tools_clean ;;

      "locales")
         tools_locales ;;

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
function tools_locales {
   sudo eggs tools:locales
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
function theEnd {
   clear
   exit 0
}

main
