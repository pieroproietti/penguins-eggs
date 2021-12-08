# operazioni di recovery

mkdir /run/initramfs/live
mount /dev/sr0 /run/initramfs/live
mount /run/initramfs/live/live /mnt

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
