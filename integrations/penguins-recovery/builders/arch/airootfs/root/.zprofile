# Start graphical interface
if [[ ! $DISPLAY && $XDG_VTNR -eq 1 ]]; then
    # Start NetworkManger
    systemctl start NetworkManager.service

    # set custom background
    cp ~/.wallpaper/bg.png /usr/share/backgrounds/xfce/xfce-shapes.svg

    # Set Theme to Adwaita-dark
    xfconf-query -c xsettings -p /Net/ThemeName -s "Adwaita-dark"

    # Start GUI
    startxfce4
fi