#!/bin/bash

##
# eggs dialog 
##

function main {

   while true; do
      answer=$(zenity --list --height 500 --width 650\
      --title="Mumy" \
      --text="Mama's gonna keep baby cosy and warm..." \
      --column="Command" --column=" " --column="Description" \
      "adapt"           " " "adapt video resolution" \
      "autocomplete"    " " "generate or refresh autocomplete" \
      "calamares"       ">" "install and configure calamares" \
      "documentation"   ">" "documentation" \
      "export"          ">" "export /deb/docs/iso" \
      "help"            " " "help" \
      "info"            " " "get informations" \
      "install"         ">" "install your system on hard disk" \
      "kill"            " " "delete ISOs" \
      "prerequisites"   " " "install eggs prerequisites" \
      "produce"         ">" "produce and ISO of your system" \
      "remove"          ">" "remove " \
      "tools"           ">" "clean/initrd/locales/pve/sanitize/skel/yolk" \
      "update"          " " "update" \
      "EXIT"            " " "exit"
      )

      ${answer}
   done
}

################################
# adapt--
################################
function adapt {
   eggs adapt
   press_a_key_to_continue
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
      zenity --info --text "autocomplete generated" --height 300 --width 300
   else
      zenity --error --text "problem with autocomplete generation" --height 300 --width 300 
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

   ${answer}
}

################################
function documentation {
   browser=$(zenity --list  --text "Which browser?" --radiolist  --column "Pick" --column "Browser" TRUE firefox FALSE chrome FALSE chromium)
   sites=$(zenity --height=280 --width=300 --list  --text "That documentation need?" --radiolist  --column "Pick" --column "Sites" \
   TRUE https://penguins-eggs.net/ \
   FALSE https://sourceforge.com/project/penguins-eggs \
   FALSE https://github.com/pieroproietti/penguins-eggs  \
   FALSE https://www.facebook.com/penguinseggs \
   --separator=" ")
   
   for site in $sites; do
      $browser $site
   done
}

################################
function export {
   answer= $(zenity --list --height 500 --width 530 \
   --column="eggs export:" --column="Description" \
   deb "export package eggs-v7-x-x-1.deb in the destination host" \
   iso "export iso in the destination host" \
   docs "remove and export docType documentation of the sources in the destination host")
}

################################
function deb {
   eggs export:deb -c
   press_a_key_to_continue
}

################################
function  docs {
   eggs export:docs
   press_a_key_to_continue
}

################################
function iso {
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
   answer= $(zenity --list --height 500 --width 650 \
   --title "eggs install" \
   --column="Command" --column="Description" \
   "sudo calamares" "installer GUI calamares" \
   "sudo eggs install" "installer CLI eggs" )

   ${answer}
}

################################
function kill {
   sudo eggs kill
   press_a_key_to_continue
}

################################
function prerequisites {
   sudo eggs prerequisites
   press_a_key_to_continue
}

################################
function produce {
   answer= $(zenity --list --height 500 --width 650 \
   --title="eggs produce" \
   --column="command" --column="Description" \
   "eggs produce --help" "help" \
   "sudo eggs produce --fast --verbose --basename UfficioZero --theme=ufficiozero"  "create fast an ISO large" \
   "sudo eggs produce --verbose --basename UfficioZero --theme=ufficiozero"  "create an ISO" )

    ${answer}
}

################################
function remove {
   answer= $(zenity --list --height 500 --width 650 \
   --title "eggs remove" \
   --column="Command" --column="Description" \
   "sudo eggs remove --prerequisites" "remove prerequisites only" \
   "sudo eggs remove --all" "remove prerequisites and eggs" \
   "sudo eggs remove --all --purge" "remove prerequisites, eggs and purge")

   ${answer}
}


function tools {
   answer= $(zenity --list --height 500 --width 530 \
   --column="eggs tools:" --column="Description" \
   clean "clean system log, apt, etc" \
   configure_eggs "configure eggs.yaml" \
   configure_tools "configure tools.yaml" \
   initrd "Test initrd" \
   locales "install/clean locales" \
   pve "enable/start/stop pve-live" \
   sanitize "sanitize" \
   skel "update skel from home configuration" \
   yolk "configure eggs to install without internet")

   ${answer}
}

################################
function clean {
   sudo eggs tools:clean
   press_a_key_to_continue
}

################################
function configure_eggs {
   sudo nano /etc/penguins-eggs.d/eggs.yaml
   press_a_key_to_continue
}

################################
function configure_tools {
   sudo nano /etc/penguins-eggs.d/tools.yaml
   press_a_key_to_continue
}


################################
function initrd {
   sudo eggs tools:initrd
   press_a_key_to_continue
}

################################
function locales {
   sudo eggs tools:locales
   press_a_key_to_continue
}

################################
function pve {
   sudo eggs tools:pve
   press_a_key_to_continue
}

################################
function sanitize {
   sudo eggs tools:sanitize
   press_a_key_to_continue
}

################################
function skel {
   sudo eggs tools:skel
   press_a_key_to_continue
}

################################
function yolk {
   sudo eggs tools:yolk
   press_a_key_to_continue
}

################################
function update {
   sudo eggs update
   press_a_key_to_continue
}


function press_a_key_to_continue {
   #zenity --question --text="Press enter to continue"
   read -p "Press enter to continue"
}

################################
function EXIT {
   exit 0
}


main
