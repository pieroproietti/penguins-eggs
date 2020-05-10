7158 void systemback::on_livenew_clicked()
Qua inizia la costruzione della live

Analizza /etc/lsb-release
DISTRIB_ID=


errore iniziale
/boot/grub/x86_64-efi/ieee1275_fd.mod
/boot/grub/x86_64-efi/vbe.mod
/boot/grub/x86_64-efi/vga.mod


grub.cfg




void systemback::on_livenew_clicked()


systemback -riga 7364

Toglie da /etc/rc0.d, /etc/rc1.d, /etc/rc2.d, /etc/rc3.d, /etc/rc4.d, /etc/rc5.d, /etc/rc6.d, /etc/rcS.d
tutti i file che contengono cryptdisks
esempio K01cryptdisks, K01cryptdisks-early


Questo è il file di grub live sulla iso di systemback:

if loadfont /boot/grub/font.pf2
then
  set gfxmode=auto
  insmod efi_gop
  insmod efi_uga
  insmod gfxterm
  terminal_output gfxterm
fi

set theme=/boot/grub/theme.cfg

menuentry "Boot Live system" {
  set gfxpayload=keep
  linux /live/vmlinuz boot=live quiet splash
  initrd /live/initrd.gz
}

menuentry "Boot system installer" {
  set gfxpayload=keep
  linux /live/vmlinuz boot=live finstall quiet splash
  initrd /live/initrd.gz
}

menuentry "Boot Live in safe graphics mode" {
  set gfxpayload=keep
  linux /live/vmlinuz boot=live xforcevesa nomodeset quiet splash
  initrd /live/initrd.gz
}

menuentry "Boot Live in debug mode" {
  set gfxpayload=keep
  linux /live/vmlinuz boot=live
  initrd /live/initrd.gz
}


Inoltre, theme.cfg

title-color: "white"
title-text: "Systemback Live (sb-lm4)"
title-font: "Sans Regular 16"
desktop-color: "black"
desktop-image: "/boot/grub/splash.png"
message-color: "white"
message-bg-color: "black"
terminal-font: "Sans Regular 12"

+ boot_menu {
  top = 150
  left = 15%
  width = 75%
  height = 130
  item_font = "Sans Regular 12"
  item_color = "grey"
  selected_item_color = "white"
  item_height = 20
  item_padding = 15
  item_spacing = 5
}

+ vbox {
  top = 100%
  left = 2%
  + label {text = "Press 'E' key to edit" font = "Sans 10" color = "white" align = "left"}
}