#!/bin/bash

function main {

   while true; do
      answer=$(zenity --list --height 500 --width 650\
      --title="Eggs" \
      --column="Command" --column=" " --column="Description" \
      adapt " " "adapt video resolution" \
      autocomplete " " "generate or refresh autocomplete" \
      calamares " " "install and configure calamares" \
      EXPORT ">" "export /deb/docs/iso" \
      help " " "help" \
      info " " "get informations" \
      install " " "install your system on hard disk" \
      kill " " "delete ISOs" \
      prerequisites " " "install eggs prerequisites" \
      produce " " "produce and ISO of your system" \
      remove " " "remove " \
      TOOLS ">" "clean/initrd/locales/pve/sanitize/skel/yolk" \
      update " " "update" \
      EXIT " " "exit")
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
      rm /etc/bash_completion.d/eggs.bash
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

   answer= $(zenity --list --height 500 --width 530\
   --title="eggs calamares" \
   --column="command" --column="Description" \
   "eggs calamares --help" "help" \
   "sudo eggs calamares --install"  "install and configures calamares" \
   "sudo eggs calamares --install --verbose"  "install and configures calamares verbose" \
   "sudo eggs calamares" "configure calamares" \
   "sudo eggs calamares --verbose" "configure calamares verbose")

   echo ${answer}
}


################################
function EXPORT {
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
   eggs export:docs -c
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
   sudo eggs install
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
   sudo eggs produce
}

################################
function remove {
   sudo eggs remove
}


function TOOLS {
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
