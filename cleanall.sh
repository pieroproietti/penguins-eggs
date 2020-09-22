# eggs directory sorgenti
sudo rm ~/penguins-eggs-/tmp -rf
sudo rm ~/penguins-eggs-/dist -rf

sudo rm /usr/bin/add-penguins-links.sh
sudo rm /usr/bin/penguins-links-add.sh

# rimozione link
sudo rm /usr/share/applications/penguins-*
sudo rm /usr/share/applications/dw*
sudo rm /usr/share/applications/pve*
sudo rm /usr/share/applications/proxmox*
sudo rm /usr/share/applications/calamares*
sudo rm /etc/xdg/autostart/add-penguins-desktop-icons.desktop  
sudo rm /etc/xdg/autostart/add-penguins-links.desktop


#
# C A L A M A R E S
#
# moduli calamares
sudo rm /etc/calamares -rf

# script di calamares buster
sudo rm /usr/sbin/bootloader-config.*
sudo rm /usr/sbin/create-tmp.*
sudo rm /usr/sbin/remove-link.*
sudo rm /usr/sbin/sources-final.*
sudo rm /usr/sbin/sources-trusted.*

# script di ubuntu bionic
sudo rm /usr/sbin/add386arch.*
sudo rm /usr/sbin/after-bootloader.*
sudo rm /usr/sbin/before-bootloader.*
sudo rm /usr/sbin/bug.*

# moduli calamare globali buster
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/bootloader-config -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/create-tmp -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/remove-link -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/sources-final -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/sources-trusted -rf

# moduli calamare globali bionic
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/automirror -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/add386arch -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/after-bootloader -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/before-bootloader -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/bug -rf
