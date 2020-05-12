# systemback

Sto cercando di analizzare systemback per cogliere qualche suggerimento.

Il pundo del codice di systemback dove si crea la live è la riga
7158 void systemback::on_livenew_clicked()

systemback -riga 7364

Toglie da /etc/rc0.d, /etc/rc1.d, /etc/rc2.d, /etc/rc3.d, /etc/rc4.d, /etc/rc5.d, /etc/rc6.d, /etc/rcS.d
tutti i file che contengono cryptdisks
esempio K01cryptdisks, K01cryptdisks-early

Al momento ho solo "preso" l'eliminazione dei file cryptdisks nell'avvio 


Ho notato che se non trova /etc/lsb-release ricade su Ubuntu
cosa che succede anche con la Debian live

DISTRIB_ID=

# grub
Corretto errore iniziate: vga, vbe ieee
caricando i soli moduli necessari

## grub.cfg
if loadfont /boot/grub/font.pf2
then
  set gfxmode=auto
  insmod efi_gop
  insmod efi_uga
  insmod gfxterm
  terminal_output gfxterm
fi
set theme=/boot/grub/theme.cfg

---



## theme.cfg

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