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

# Documentazione: Ambiente di Build RISC-V (riscv64)
Questa sezione descrive la configurazione di un ambiente di sviluppo e build per l'architettura RISC-V utilizzando una workstation Debian x86_64 (Trixie) con Proxmox VE, sfruttando l'emulazione tramite QEMU.

1. Prerequisiti sull'Host (Debian Trixie)
Per poter eseguire ed emulare binari RISC-V su hardware x86_64, è necessario installare il supporto per l'emulazione user-mode:

```
sudo apt update
sudo apt install qemu-user-static binfmt-support
2. Creazione dell'ambiente Chroot (Ubuntu Noble/RISC-V)
```

L'ambiente di build è stato isolato in una directory (chroot) per garantire la coerenza delle dipendenze senza interferire con il sistema host.

Preparazione della rootfs: Si scarica o si crea una base minimale (minbase) per RISC-V.

Iniezione dell'emulatore: È fondamentale copiare l'eseguibile statico di QEMU all'interno del chroot prima di accedervi.

#### Configurazione Chroot ####
```bash
# Copia l'emulatore nel nido
sudo cp /usr/bin/qemu-riscv64-static ~/ubuntu-riscv/usr/bin/

# Accesso all'ambiente
sudo chroot ~/ubuntu-riscv /usr/bin/qemu-riscv64-static /bin/bash
```
3. Configurazione del Toolchain di Sviluppo
All'interno dell'ambiente chroot, sono stati installati i componenti necessari per compilare ed eseguire penguins-eggs:

Runtime: Node.js e npm (fondamentali per TypeScript).

Compilatori: build-essential per gestire eventuali moduli nativi C++ che richiedono la compilazione su architettura target.

Version Control: Git per la gestione dei sorgenti.

4. Verifica dell'Architettura
All'interno dell'ambiente, la corretta configurazione è confermata dal comando:

```
uname -m
# Output atteso: riscv64
```


5. Procedura di Build di penguins-eggs
Essendo scritto in TypeScript, il processo segue il workflow standard, ma viene eseguito nel contesto emulato per garantire che le dipendenze binarie (es. pacchetti di compressione o addon nativi di Node) siano linkate correttamente per RISC-V:

Plaintext

#### Build Workflow ####
```bash
# Clone del repository
git clone [https://github.com/pieroproietti/penguins-eggs](https://github.com/pieroproietti/penguins-eggs)

# Installazione dipendenze e creazione pacchetto/i
cd penguins-eggs
pnpm install
pnpm deb --all
```
Note Tecniche per la Documentazione
* Performance: L'emulazione tramite qemu-user-static è eccellente per la compatibilità ma richiede risorse CPU significative durante la compilazione.
* Portabilità: Grazie alla natura di TypeScript, il core di eggs rimane agnostico, mentre questo ambiente garantisce che il packaging finale (deb/rpm) sia correttamente strutturato per l'ecosistema RISC-V.
