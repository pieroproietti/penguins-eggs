# RISCV64
Questo progetto inizialmente aveva il nome di **a-bamboo-nest** essendo partito dalla ricerca su [bianbuOS](https://bianbu.spacemit.com/en/), poi sono passato ad Ubuntu ed è un tentativo di portare penguins-eggs sotto Ubuntu e bianbuOS per l'architettura RISCV64.

Sto lavorando attualmente su una VM in proxmox VE, tra l'altro su un ormai vecchio i7 con 16GB di RAM.

## Installare ubuntu-archive-keyring
```
sudo wget -qO - "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xF6ECB3762474EDA9D21B7022871920D1991BC93C" | sudo gpg --dearmor -o /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

## Installare i pacchetti necessari
```
apt install qemu-user-static binfmt-support mmdebstrap -y
```

## Creazione della chroot
```
sudo rm -rf ~/ubuntu-riscv

sudo mmdebstrap --arch=riscv64 --variant=minbase \
--keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg \
--components="main,universe" \
noble ~/ubuntu-riscv http://ports.ubuntu.com/ubuntu-ports
```

# Iniziamo in chroot

```
cd ubuntu-riscv
sudo chroot .
```

# Installazione kernel, dialog e locales
```
apt install bash-completion dialog linux-image locales -y
locale-gen en_US.UTF-8
update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
```

# installazione penguins-eggs
Copiamo il pacchetto nella chroot in /tmp
```
apt install /tmp/penguins-eggs*
```

# workaround per uname
dobbiamo creare un workaround per uname, visto che da chroot otterremmo

```
tee /usr/local/bin/uname << 'EOF'
#!/bin/sh
if [ "$1" = "-r" ]; then
    # Estrae la versione del kernel RISC-V dai file in /boot
    ls /boot/vmlinuz-* | head -n 1 | sed 's/.*vmlinuz-//'
else
    # Per tutti gli altri casi usa l'uname originale
    /bin/uname "$@"
fi
EOF

# Rendi lo script eseguibile
chmod +x /usr/local/bin/uname

```

# Settiamo un hostname
```
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
