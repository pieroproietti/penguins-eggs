#!/bin/bash

##
# eggs dialog 
##

function main {

   while true; do
      answer=$(zenity --list --height 500 --width 650\
      --title="Eggs" \
      --column="Command" --column=" " --column="Description" \
      "adapt" " " "adapt video resolution" \
      "autocomplete" " " "generate or refresh autocomplete" \
      "calamares" ">" "install and configure calamares" \
      "export" ">" "export /deb/docs/iso" \
      "help" " " "help" \
      "info" " " "get informations" \
      "install" ">" "install your system on hard disk" \
      "kill" " " "delete ISOs" \
      "prerequisites" " " "install eggs prerequisites" \
      "produce" ">" "produce and ISO of your system" \
      "remove" ">" "remove " \
      "tools" ">" "clean/initrd/locales/pve/sanitize/skel/yolk" \
      "update" " " "update" \
      "EXIT" " " "exit")
      ${answer}

   done
}

################################
# adapt--
################################
function adapt {
   eggs adapt
}

################################
# autocomplete
################################
function autocomplete {
   eggs autocomplete
   if [ ! -d "/etc/bash_completion.d/" ]; then 
      sudo mkdir /etc/bash_completion.d/
   fi

   # remove previus eggs.bash
   if [ -f "/etc/bash_completion.d/eggs.bash" ]; then
      sudo rm /etc/bash_completion.d/eggs.bash
   fi
   sudo cp ~/.cache/penguins-eggs/autocomplete/functions/bash/eggs.bash /etc/bash_completion.d/

   if [ -f "/etc/bash_completion.d/eggs.bash" ]; then
      zenity --warning --text "autocomplete generated"
   else
      zenity --error --text "problem with autocomplete generation"
   fi
}

################################
function calamares {

   answer= $(zenity --list --height 500 --width 650\
   --title="eggs calamares" \
   --column="command" --column="Description" \
   "eggs calamares --help" "help" \
   "sudo eggs calamares --install --verbose"  "install and configures calamares verbose" \
   "sudo eggs calamares --verbose" "configure calamares verbose")
}


################################
function export {
   answer= $(zenity --list --height 500 --width 530 \
   --column="eggs export:" --column="Description" \
   deb "export package eggs-v7-x-x-1.deb in the destination host" \
   iso "export iso in the destination host" \
   docs "remove and export docType documentation of the sources in the destination host")

   echo ${answer}
}

################################
function deb {
   eggs export:deb -c
}

################################
function  docs {
   eggs export:docs
}

################################
function iso {
   eggs export:iso -c
} 

################################
function help {
   eggs help
}

################################
function info {
   eggs info
}

################################
function install {
   answer= $(zenity --list --height 500 --width 650 \
   --title "eggs install" \
   --column="Command" --column="Description" \
   "sudo calamares" "installer GUI calamares" \
   "sudo eggs install" "installer CLI eggs" )
}

################################
function kill {
   sudo eggs kill
}

################################
function prerequisites {
   sudo eggs prerequisites
}

################################
function produce {
   answer= $(zenity --list --height 500 --width 650 \
   --title="eggs produce" \
   --column="command" --column="Description" \
   "eggs produce --help" "help" \
   "sudo eggs produce --fast --verbose --basename UfficioZero --theme=ufficiozero"  "create fast an ISO large" \
   "sudo eggs produce --verbose --basename UfficioZero --theme=ufficiozero"  "create an ISO" )
}

################################
function remove {
   answer= $(zenity --list --height 500 --width 650 \
   --title "eggs remove" \
   --column="Command" --column="Description" \
   "sudo eggs remove --prerequisites" "remove prerequisites only" \
   "sudo eggs remove --all" "remove prerequisites and eggs" \
   "sudo eggs remove --all --purge" "remove prerequisites, eggs and purge")
}


function tools {
   answer= $(zenity --list --height 500 --width 530 \
   --column="eggs tools:" --column="Description" \
   clean "clean system log, apt, etc" \
   initrd "Test initrd" \
   locales "install/clean locales" \
   pve "enable/start/stop pve-live" \
   sanitize "sanitize" \
   skel "update skel from home configuration" \
   yolk "configure eggs to install without internet")
}

################################
function clean {
   sudo eggs tools:clean
}

################################
function initrd {
   sudo eggs tools:initrd
}

################################
function locales {
   sudo eggs tools:locales
}

################################
function pve {
   sudo eggs tools:pve
}

################################
function sanitize {
   sudo eggs tools:sanitize
}

################################
function skel {
   sudo eggs tools:skel
}

################################
function yolk {
   sudo eggs tools:yolk
}

################################
function update {
   sudo eggs update
}

################################
function EXIT {
   exit 0
}

main
