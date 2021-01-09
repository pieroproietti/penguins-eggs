#!/bin/bash
#Penguin eggs dialog

# check for prerequisites
check = $("eggs prerequisites -c")

echo "$check"

# installa prerequisiti Eggs
if whiptail  --notags --title "Eggs prerequisites" --yesno "Do you want to install eggs prerequisites?" 8 35 3>&1 1>&2 2>&3; then
    eggs prerequisites && echo "Success: prerequisites installed"
else
    echo "Prerequisites not installed"
fi

# check per calamarer
# installa Egss Calamares
if whiptail  --notags --title "Eggs Calamares" --yesno "Do you want to install and use Calamares?" 8 35 3>&1 1>&2 2>&3; then
    eggs calamares && echo "Success: Calamares in use"
else
    echo "Calamares not installed"
fi

#check per Kill

# produce
if whiptail --title="Eggs produce iso" --yesno="Do you want to create your iso?" --no-wrap 
    then
        eggs produce -cv --basename UfficioZero --theme ufficiozero;
        whiptail  --notags --title "Success" --msgbox "Your iso is ready" 8 35 3
fi

#esport ISO
