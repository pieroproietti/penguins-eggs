# bamboo-nest
Questo progetto prende il nome da [bianbuOS](https://bianbu.spacemit.com/en/). ed è un tentativo che in veramente poco tempo, sta cercando di portare penguins-eggs sotto Ubuntu e bianbuOS per riscv.


# Ubuntu
Sto lavorando attualmente su una VM in proxmox VE, tra l'altro su un ormai vecchio i7 con 16GB di RAM.

```
sudo wget -qO - "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xF6ECB3762474EDA9D21B7022871920D1991BC93C" | sudo gpg --dearmor -o /usr/share/keyrings/ubuntu-archive-keyring.gpg

sudo rm -rf ~/ubuntu-riscv
sudo mmdebstrap --arch=riscv64 --variant=minbase \
--keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg \
--components="main,universe" \
noble ~/ubuntu-riscv [http://ports.ubuntu.com/ubuntu-ports/](http://ports.ubuntu.com/ubuntu-ports/)
```

Iniziamo:

```
cd ubuntu-riscv
sudo chroot .
apt install -y nodejs npm git nano sudo
```

Installazione pnpm, I can't live without it!
```
npm i pnpm -g
```

# Installazione dei pacchetti prerequisiti per penguins-eggs

```
apt install -y coreutils cryptsetup cryptsetup-bin cryptsetup-initramfs \
curl dosfstools dpkg-dev git gpg jq lvm2 nodejs parted \
rsync squashfs-tools sshfs xorriso live-boot live-boot-doc \
live-boot-initramfs-tools live-config-systemd live-tools
```
```
# quello che c'è
- grub-efi-riscv64-bin
# u-boot-menu 
# opensbi

# quello che manca...
- shim-signed
```

# Un workaround per uname -r
```
cat <<EOF > /usr/local/bin/uname
#!/bin/sh
if [ "\$1" = "-r" ]; then
    # Qui metti l'esatta versione del kernel RISC-V che hai installato
    ls /boot/vmlinuz-* | head -n 1 | sed 's/.*vmlinuz-//'
else
    /bin/uname "\$@"
fi
EOF
```
