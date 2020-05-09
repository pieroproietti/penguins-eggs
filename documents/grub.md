
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





if loadfont 
    /boot/grub/font.pf2\nthen
    set gfxmode=auto
    insmod efi_gop
    insmod efi_uga
    insmod gfxterm
    terminal_output gfxterm
fi
set theme=/boot/grub/theme.cfg


set gfxpayload=keep
    linux /" % lvtype % "/vmlinuz " % rpart % "boot=" % lvtype % " quiet splash" % prmtrs % "\n  initrd /" % lvtype % "/initrd.gz\n}\n\nmenuentry \"" % tr("Boot system installer") % "\" {\n  set gfxpayload=keep\n  linux /" % lvtype % "/vmlinuz " % rpart % "boot=" % lvtype % " finstall quiet splash" % prmtrs % "\n  initrd /" % lvtype % "/initrd.gz\n}\n\nmenuentry \"" % tr("Boot Live in safe graphics mode") % "\" {\n  set gfxpayload=keep\n  linux /" % lvtype % "/vmlinuz " % rpart % "boot=" % lvtype % " xforcevesa nomodeset quiet splash" % prmtrs % "\n  initrd /" % lvtype % "/initrd.gz\n}\n\n" % grxorg % "menuentry \"" % tr("Boot Live in debug mode") % "\" {\n  set gfxpayload=keep\n  linux /" % lvtype % "/vmlinuz " % rpart % "boot=" % lvtype % prmtrs % "\n  initrd /" % lvtype % "/initrd.gz\n}\n") &&
