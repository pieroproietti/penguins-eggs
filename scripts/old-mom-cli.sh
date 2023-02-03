#!/bin/bash

# Authors: Piero Proietti, Christopher Hopp
# xdg-settings get default-web-browser

##
# eggs dialog cli
##

function main {

   while true; do
      # 20 righe. 75 caratteri, 16 altezza menu list
      answer=$(
      whiptail --title "mommy" --menu "Mama's gonna keep baby cozy and warm..." 22 75 16 \
         "adapt"           "adapt monitor resolution for VM only" \
         "calamares"       "configure calamares or install and configure it" \
         "dad"             "ask help from daddy - configuration helper" \
         "help"            "display help for eggs" \
         "kill"            "kill the eggs/free the nest" \
         "install"         "krill TUI system installer - the egg becomes a chick" \
         "produce"         "the system produces an egg: iso image of your system" \
         "status"          "eggs status and informations" \
         "update"          "update the penguin's eggs tool" \
         "documentation"   "book/book_translated/manual/man" \
         "export"          "deb/docs/iso" \
         "tools"           "clean/skel/yolk" \
         "wardrobe"        "get/list/show/wear" \
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

         "kill")
            kill ;;

         "install")
            install ;;

         "produce")
            produce ;;

         "status")
            status ;;

         "documentation")
            documentation ;;

         "export")
            Export ;;

         "tools")
            tools ;;

         "wardrobe")
            wardrobe ;;

         "update")
            update ;;

      esac

   done
}

################################
function adapt {
   adapt
}

################################
function calamares {
      answer=$(
         whiptail --title "Calamares installer" --menu "You can choose local or internet documentation, html or man" 22 75 14 \
         "configure"       "create calamares configuration" \
         "install"         "install calamares and create configuration" \
         "remove"          "remove calamares installer" \
         "quit"            "previous" 3>&2 2>&1 1>&3
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
         "quit"            "previous" 3>&2 2>&1 1>&3
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
   xdg-open "https://penguins-eggs.net/book/italiano"
}

################################
function documentation_book_translated {
   # sensible-editor sensible-pager
   xdg-open "https://translate.google.com/translate?hl=en&sl=auto&tl=en&u=https%3A%2F%2Fpenguins-eggs.net%2Fbook%2Fitaliano"
}

################################
function documentation_site {
   xdg-open "https://penguins-eggs.net"
}

################################
function documentation_man {
   man_eggs='/usr/bin/man eggs'
   ${man_eggs}
}

################################
function documentation_html {
   xdg-open "file:///usr/lib/penguins-eggs/manpages/doc/man/eggs.html"
}



################################
function Export {

      answer=$(
      whiptail --title "EXPORT" --menu "Export your eggs or packages in remote host..." 22 75 14 \
         "deb"    "export package eggs-v7-x-x-1.deb in the destination host" \
         "iso"    "export iso image in the destination host" \
         "quit"   "previous" 3>&2 2>&1 1>&3
      )

      case "$answer" in 
         "deb")
            export_deb ;;

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
function status {
   eggs status
   press_a_key_to_continue
}

################################
function kill {
   sudo eggs kill
   press_a_key_to_continue
}

################################
function install {
   sudo eggs install
   press_a_key_to_continue
}

################################
function produce {
   answer=$(
   whiptail --title "produce" --menu "Choose the prefered method of production..." 22 75 14 \
      "fast"      "create an ISO fast compression" \
      "max"       "create an ISO max compression" \
      "clone"     "create a live clone with user's data" \
      "quit"      "previous" 3>&2 2>&1 1>&3
   )

   case "$answer" in 
      "fast")
         fast ;;

      "max")
         max ;;

      "clone")
         clone;;
      
   esac
}

################################
function fast {
   sudo eggs produce --fast
}

################################
function standard {
   sudo eggs produce
}

################################
function max {
   sudo eggs produce --max
}

################################
function clone {
   sudo eggs produce --fast --clone 
}

################################
function tools {
   answer=$(
   whiptail --title "TOOLS" --menu "eggs companions tools" 22 75 14 \
      "clean"  "clean system logs, packages manager cache, etc" \
      "skel"   "update /etc/skel from current user" \
      "yolk"   "configure an internal apt repository in /var/local/yolk" \
      "quit"   "previous" 3>&2 2>&1 1>&3
   )

   case "$answer" in 
      "clean")
         tools_clean ;;

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

################################
function wardrobe {
   answer=$(
   whiptail --title "TOOLS" --menu "eggs companions tools" 22 75 14 \
      "get"       "get warorobe" \
      "list"      "list costumes" \
      "show"      "show costumes" \
      "wear"      "wear costume" \
      "quit"      "previous" 3>&2 2>&1 1>&3
   )

   case "$answer" in 
      "get")
         wardrobe_get ;;

      "list")
         wardrobe_list ;;

      "show")
         wardrobe_show ;;

      "wear")
         wardrobe_wear ;;
   esac

}

################################
function wardrobe_get {
   eggs wardrobe get
   press_a_key_to_continue
}

################################
function wardrobe_ironing {
   eggs wardrobe ironing
   press_a_key_to_continue
}

################################
function wardrobe_list {
   eggs wardrobe list
   press_a_key_to_continue
}

################################
function wardrobe_show {
   eggs wardrobe show
   press_a_key_to_continue
}

################################
function wardrobe_wear {
   sudo eggs wardrobe wear
   press_a_key_to_continue
}



function press_a_key_to_continue {
   read -rp "Press enter to continue"
}

################################
function theEnd {
   #clear
   exit 0
}

main
