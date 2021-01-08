#!/bin/bash
#Penguin eggs dialog

# installa prerequisiti Eggs
if whiptail  --notags --title "Eggs prerequisites" --yesno "Do you want to install eggs prerequisites?" 8 35 3>&1 1>&2 2>&3; then
    eggs prerequisites && echo "Success: prerequisites installed"
else
    echo "Prerequisites not installed"
fi

# installa Egss Calamares
if whiptail  --notags --title "Eggs Calamares" --yesno "Do you want to install and use Calamares?" 8 35 3>&1 1>&2 2>&3; then
    eggs calamares && echo "Success: Calamares in use"
else
    echo "Calamares not installed"
fi

user_name=""
file_name="/etc/calamares/modules/removeuser.conf"

while [ -z "$user_name"  ]; do
    user_name="$(zenity --entry --title="Add an Entry" --text="Enter your user name:" --entry-text "user name")"
    sed -i "s/username:.*/username: ${user_name}/"  "$file_name"
    case "$user_name" in
        *\ * )
        echo "User name missing or invalid"
        user_name=""
        ;;
    esac
done

if zenity --question --title="Eggs produce iso" --text="Do you want to create your iso?" --no-wrap 
    then
        eggs produce -cv --basename UfficioZero --theme ufficiozero;
        whiptail  --notags --title "Success" --msgbox "Your iso is ready" 8 35 3
fi
