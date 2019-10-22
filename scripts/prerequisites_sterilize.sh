# prerequisites_sterilize.sh
apt-get --yes --purge remove  \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls
apt-get --yes --purge remove  \
        squashfs-tools \
        xorriso \
        syslinux \
        isolinux \
        live-boot \
        open-infrastructure-system-config
apt-get --yes autoremove        
apt-get clean
apt-get autoclean
