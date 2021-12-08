# operazioni di recovery

```mkdir /run/initramfs/live```
```mount /dev/sr0 /run/initramfs/live```
```mount /run/initramfs/live/live /mnt```

dracut va in conflitto con initramfs-tools di Debian
e con i componenti live-boot e live-initramfs-tools

A questo punto li ho rimossi, e vediamo che succede.

Probabilmente abbiamo un sistema che si avvia ma
rimane in emergency shell perchè non riesce a trovare
filesystem.squashfs e montarlo in /syslinux la root 
di dracut.

Dovrebbe bastare mappare filestem.squashfs nel mapper
e quindi creare un link simbolico ad esso.

```ln -s /dev/mapper/filesystem.squashfs /dev/root```

Esiste, sempre in Debian ma non nelle altre, il pacchetto:
dracut-live che dovrebbe adattare dracut alla creazione 
di un initramfs.img capace di avviare una iso.


# altro
Vedere se /etc/dracut.conf.d/ deve contenre menu.cfg

```
MENU TITLE Penguin's eggs - Perri's Brewery edition - Main

DEFAULT {{{customName}}} (kernel {{{kerne}}})
LABEL {{{fullname}}} (kernel: {{{kernel}}})
  SAY "Booting {{{fullName}}} GNU/Linux Live (kernel: {{{kernel}}})..."
  linux {{{vmlinuz}}}
  APPEND initrd={{{initrdImg}}} 
```
