
sudo rm /usr/bin/add-penguins-links.sh
sudo rm /usr/bin/penguins-links-add.sh

sudo rm /usr/sbin/before-bootloader.*
sudo rm /usr/sbin/before-bootloader-mkdirs*
sudo rm /usr/sbin/bug*
suro rm /usr/sbin/after-bootloader*

sudo rm /usr/share/applications/penguins-*
sudo rm /usr/share/applications/dw*
sudo rm /usr/share/applications/pve*
sudo rm /usr/share/applications/proxmox*
sudo rm /usr/share/applications/calamares*
sudo rm /etc/xdg/autostart/add-penguins-desktop-icons.desktop  
sudo rm /etc/xdg/autostart/add-penguins-links.desktop

# moduli calamares
sudo rm /etc/calamares -rf

/usr/sbin/remove-link.sh

sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/automirror/ -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/bootloader-config/ -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/create-tmp/ -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/remove-link/ -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/sources-final/ -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/sources-trusted/ -rf
sudo rm /usr/lib/x86_64-linux-gnu/calamares/modules/sources-trusted-unmount/ -rf

sudo rm /usr/lib/calamares/modules/automirror/ -rf
sudo rm /usr/lib/calamares/modules/bootloader-config/ -rf
sudo rm /usr/lib/calamares/modules/create-tmp/ -rf
sudo rm /usr/lib/calamares/modules/remove-link/ -rf
sudo rm /usr/lib/calamares/modules/sources-final/ -rf
sudo rm /usr/lib/calamares/modules/sources-trusted/ -rf
sudo rm /usr/lib/calamares/modules/sources-trusted-unmount/ -rf