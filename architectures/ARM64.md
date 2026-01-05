# ARM64

Il pacchetto arm64 esiste da tempo ed è stato testato su hardware reale.


# ARM64 (Aarch64)
Questo progetto è un adattamento del lavoro svolto per RISC-V, volto a portare **penguins-eggs** su architettura ARM64 (aarch64) utilizzando Ubuntu Noble Numbat come base.

Sto lavorando attualmente su una VM o su un sistema host x86_64 utilizzando l'emulazione tramite `qemu-user-static`.

## Installare ubuntu-archive-keyring
```bash
sudo wget -qO - "[https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xF6ECB3762474EDA9D21B7022871920D1991BC93C](https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xF6ECB3762474EDA9D21B7022871920D1991BC93C)" | sudo gpg --dearmor -o /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

## Installare i pacchetti necessari
```bash
sudo apt update
sudo apt install qemu-user-static binfmt-support mmdebstrap -y
```

## Creazione della chroot
```bash
sudo rm -rf ~/ubuntu-arm64

sudo mmdebstrap --arch=arm64 --variant=minbase \
--keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg \
--components="main,universe" \
noble ~/ubuntu-arm64 http://ports.ubuntu.com/ubuntu-ports
```

# Iniziamo in chroot

```bash
cd ~/ubuntu-arm64
g4mount-vfs-here
sudo chroot .
```

# Installazione kernel, dialog e locales
```bash
apt update
apt install bash-completion dialog linux-image-generic locales -y
locale-gen en_US.UTF-8
update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
```

# Workaround per uname
Poiché siamo in una chroot emulata, `uname -r` restituirebbe il kernel dell'host. Creiamo uno script per ingannare il sistema e fargli leggere la versione del kernel ARM64 installato:

```bash
tee /usr/local/bin/uname << 'EOF'
#!/bin/sh
if [ "$1" = "-r" ]; then
    # Estrae la versione del kernel ARM64 dai file in /boot
    ls /boot/vmlinuz-6.8.0-31-generic | head -n 1 | sed 's/.*vmlinuz-//'
else
    # Per tutti gli altri casi usa l'uname originale
    /bin/uname "$@"
fi
EOF

# Rendi lo script eseguibile
chmod +x /usr/local/bin/uname
```

# Installazione penguins-eggs
Dall'host copiamo il nostro pacchetto
```
artisan@colibri:~/ubuntu-arm64$ sudo cp ../penguins-eggs/releases/penguins-eggs-26.1.3-1-arm64.deb tmp/
```

Assicurati di aver copiato il pacchetto `.deb` di penguins-eggs all'interno della cartella `~/ubuntu-arm64/tmp/` prima di eseguire il comando:
```bash
apt install /tmp/penguins-eggs*.deb -y
```

# Settiamo un hostname
```bash
echo "naked" > /etc/hostname
hostname naked
```

# Finalmente l'uovo!
```bash
eggs dad -d
eggs produce
```

# L'uovo si trova in /home/eggs
```bash
ls /home/eggs
```

## Avvio da ISO
Per comodità ci posizioniamo sulla nostra chroot;

```
sudo qemu-system-aarch64 \
  -machine virt \
  -cpu cortex-a57 \
  -m 2G \
  -kernel home/eggs/.mnt/iso/live/vmlinuz-6.8.0-31-generic \
  -initrd home/eggs/.mnt/iso/live/initrd.img-6.8.0-31-generic \
  -append "boot=live components console=ttyAMA0" \
  -drive file=home/eggs/.mnt/iso/live/filesystem.squashfs,format=raw,if=virtio \
  -nographic
```

