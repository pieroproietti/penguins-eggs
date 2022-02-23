#!/bin/bash

# Authors: Piero Proietti, Christopher Hopp

##
# waydroid dialog cli
##

function main {

   while true; do
      # 20 righe. 75 caratteri, 16 altezza menu list
      answer=$(
      whiptail --title "bro waydroid helper" --menu "Brothers in arms..." 22 75 16 \
         "install"       "install waydroid" \
         "remove"        "remove waydroid" \
         "session"       "start waydroid session" \
         "quit"            "exit" 3>&2 2>&1 1>&3
      )

      case "$answer" in 
         "quit")
            theEnd ;;

         "install")
            install ;;

         "init")
            init ;;

         "remove")
            remove ;;

         "session")
            session ;;
      esac

   done
}
################################
function install {
   clear
   sudo apt install waydroid
   press_a_key_to_continue
}

################################
function init {
   clear
   sudo waydroid init
   echo "check in /var/lib/waydroid/waydroid_base.prop"
   echo "For KVM sortware renderndi, edit:"
   echo "ro.hardware.gralloc=default"
   echo "ro.hardware.egl=swiftshader"
   echo "sudo systemctl stop waydroid-container"
   echo "sudo systemctl start waydroid-container"
   echo "waydroid show-full-ui"
   press_a_key_to_continue
}


################################
function remove {
   waydroid session stop
   sudo waydroid container stop
   sudo apt purge waydroid
   rm -rf ~/waydroid ~/.share/waydroid ~/.local/share/applications/*aydroid* ~/.local/share/waydroid
   sudo rm -rf /var/lib/waydroid 
   press_a_key_to_continue
}

################################
function session {
   XDG_SESSION_TYPE=wayland waydroid show-full-ui
   press_a_key_to_continue
}

################################
################################
################################
################################
function press_a_key_to_continue {
   read -rp "Press enter to continue"
}

################################
function theEnd {
   #clear
   exit 0
}

main
