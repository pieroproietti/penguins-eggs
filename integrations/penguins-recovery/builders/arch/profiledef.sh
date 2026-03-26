#!/usr/bin/env bash
# shellcheck disable=SC2034

iso_name="platter-engineer"
iso_label="ARCH_$(date --date="@${SOURCE_DATE_EPOCH:-$(date +%s)}" +%Y%m)"
iso_publisher="Rouven H."
iso_application="Platter Engineer"
iso_version="$(date --date="@${SOURCE_DATE_EPOCH:-$(date +%s)}" +%Y.%m.%d)"
install_dir="arch"
buildmodes=('iso')
bootmodes=('bios.syslinux.mbr' 'bios.syslinux.eltorito'
           'uefi-ia32.grub.esp' 'uefi-x64.grub.esp'
           'uefi-ia32.grub.eltorito' 'uefi-x64.grub.eltorito')
arch="x86_64"
pacman_conf="pacman.conf"
airootfs_image_type="squashfs"
airootfs_image_tool_options=('-comp' 'xz' '-Xbcj' 'x86' '-b' '1M' '-Xdict-size' '1M')
file_permissions=(
  ["/etc/shadow"]="0:0:400"
  ["/root"]="0:0:750"
  ["/root/.automated_script.sh"]="0:0:755"
  ["/root/.gnupg"]="0:0:700"
  ["/root/.wallpaper/bg.png"]="0:0:775"
  ["/root/.config"]="0:0:775"
  ["/root/.config/autostart"]="0:0:775"
  ["/root/.config/autostart/easy-language-config.desktop"]="0:0:775"
  ["/usr/local/bin/choose-mirror"]="0:0:755"
  ["/usr/local/bin/Installation_guide"]="0:0:755"
  ["/usr/local/bin/livecd-sound"]="0:0:755"
  ["/usr/local/bin/easy-language-config"]="0:0:755"
  ["/etc/localtime"]="0:0:644"
  ["/etc/systemd/system/x11-autologin.service"]="0:0:644"
  ["/etc/systemd/system/multi-user.target.wants/NetworkManager.service"]="0:0:644"
  ["/etc/systemd/system/dbus-org.freedesktop.nm-dispatcher.service"]="0:0:644"
  ["/etc/systemd/system/network-online.target.wants/NetworkManager-wait-online.service"]="0:0:644"
  ["/etc/environment"]="0:0:644"
  ["/etc/X11/xorg.conf.d/30-touchpad.conf"]="0:0:644"
  ["/root/.xinitrc"]="0:0:755"
  ["/root/.zprofile"]="0:0:755"
  ["/root/Desktop/epiphany.desktop"]="0:0:755"
  ["/root/Desktop/gnome-disk-utility.desktop"]="0:0:755"
  ["/root/Desktop/gparted.desktop"]="0:0:755"
  ["/root/Desktop/kdiskmark.desktop"]="0:0:755"
  ["/root/Desktop/gsmartcontrol.desktop"]="0:0:755"
)
