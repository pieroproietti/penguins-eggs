#!/bin/sh
###
# Wrapper for running calamares on Debian live media
###

# Stale file left behind by live-build that messes with partitioning
sudo mv /etc/fstab /etc/fstab.orig.calamares

# Allow Calamares to scale the window for hidpi displays
# This is fixed in the Calamares 3.3.0 series
export QT_AUTO_SCREEN_SCALE_FACTOR=1

# Gnome... not work
# export QT_QPA_PLATFORM=wayland

# Access control to run calamares as root for xwayland
xhost +si:localuser:root
pkexec calamares
xhost -si:localuser:root

# Restore stale fstab, for what it's worth
sudo mv /etc/fstab.orig.calamares /etc/fstab
