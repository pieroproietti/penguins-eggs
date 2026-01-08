# RISCV64
Questo progetto inizialmente aveva il nome di **a-bamboo-nest** essendo partito dalla ricerca su [bianbuOS](https://bianbu.spacemit.com/en/), poi sono passato ad Ubuntu ed è un tentativo di portare penguins-eggs sotto Ubuntu e bianbuOS per l'architettura RISCV64.

Sto lavorando su semplici macchine virtuali, utilizzando Proxmox VE su i7-6700 CPU @ 3.40GHz e 16GB di memoria RAM.

## Installare ubuntu-archive-keyring
```
sudo wget -qO - "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xF6ECB3762474EDA9D21B7022871920D1991BC93C" | sudo gpg --dearmor -o /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

## Installare i pacchetti necessari
```
sudo apt install qemu-user-static binfmt-support mmdebstrap -y
```

## Creazione della chroot
```
sudo rm -rf ~/ubuntu-riscv

cd ~
sudo mmdebstrap --arch=riscv64 --variant=important \
--keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg \
--components="main,universe" \
noble ~/ubuntu-riscv http://ports.ubuntu.com/ubuntu-ports
```

# Iniziamo in chroot

```
cd ~/ubuntu-riscv
g4mount-vfs-here
sudo QEMU_UNAME="6.12.57+deb13-riscv64" chroot . /bin/bash
```

# Installazione kernel, dialog e locales
```
apt install bash-completion dialog linux-image locales nano -y
locale-gen en_US.UTF-8
update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
```

# installazione penguins-eggs
Copiamo il pacchetto nella chroot in /tmp
```
apt install /tmp/penguins-eggs*
```


# Settiamo un hostname
```
echo "naked" > /etc/hostname
hostname naked
```

# Finalmente l'uovo!
```
eggs dad -d
eggs produce
```

# L'uovo si trova in /home/eggs
```
ls /home/eggs
```

# Testiamo la ISO
Installiamo qemu
```
sudo apt install qemu
```


# Avviamo la iso

## 1. Crea il link simbolico che il kernel si aspetta
```
ln -s /lib/riscv64-linux-gnu/ld-linux-riscv64-lp64d.so.1 /lib/ld-linux-riscv64.so.1
```

## avvio ISO
Per comodità ci posizioniamo sulla nostra chroot
```
export ISO=./home/eggs/.mnt/egg-of_ubuntu-noble-naked_riscv64_2026-01-05_1216.iso
sudo qemu-system-riscv64 \
    -machine virt \
    -cpu rv64 \
    -m 2G \
    -smp 2 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./efi-vars.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=naked-riscv.img,format=qcow2,id=hd0,if=none \
    -device virtio-blk-device,drive=cd0 \
    -drive file=$ISO,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
    -device virtio-net-device,netdev=net0 \
    -netdev user,id=net0 \
    -nographic

```

