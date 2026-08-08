# Report Test: Cross-compilazione Kernel 6.6.63 e verifica KVM su SpacemiT K1 (MuseBook)

## 1. Obiettivo
Abilitare la virtualizzazione hardware KVM sul laptop **MuseBook** (architettura `riscv64`, SoC SpacemiT K1) ricompilando il kernel Linux 6.6 con supporto `CONFIG_KVM`, NVMe e OverlayFS su `father`, per valutare l'uso di micro-VM locali.

---

## 2. Workflow e Cross-compilazione
* **Host di build:** `father` (`x86_64`, 8 thread).
* **Sorgenti:** Kernel SpacemiT Linux 6.6 (`/home/artisan/src/linux-6.6`).
* **Toolchain:** `gcc-riscv64-linux-gnu`, `g++-riscv64-linux-gnu`, dipendenze di build (`libssl-dev`, `bc`, `bison`, `flex`, ecc.).
* **Configurazione:**
  * Partenza da `k1_defconfig`.
  * Abilitate le flag `CONFIG_VIRTUALIZATION=y` e `CONFIG_KVM=m`.
  * Impostato `CONFIG_LOCALVERSION="-spacemit-kvm"`.
* **Output generati:** Pacchetto Debian `linux-image-6.6.63-spacemit-kvm+_6.6.63-g21f2edd50954-6_riscv64.deb`.

---

## 3. Processo di Avvio e Scoperta Architetturale U-Boot
* **Problema incontrato:** Sostituendo il kernel e modificando `env_k1-x.txt` sulla partizione `/boot` montata in `/dev/nvme0n1p5`, il sistema continuava a bootare il vecchio kernel stock (datato luglio 2025).
* **Causa radice:** Il bootloader U-Boot risiede nella eMMC interna (`/dev/mmcblk0`) e legge in priorità la partizione di boot della eMMC (`/dev/mmcblk0p5`), ignorando l'NVMe durante l'inizializzazione iniziale.
* **Soluzione:** 
  1. Montata manualmente la partizione `/dev/mmcblk0p5` in `/mnt/emmc-boot`.
  2. Sostituito il file del kernel `vmlinuz-6.6.63` e i relativi Device Tree (`dtb`) direttamente sulla eMMC.
  3. Copiati i moduli in `/lib/modules/6.6.63-spacemit-kvm+`.
* **Esito Boot:** Riavvio riuscito al primo colpo, kernel attivo: `Linux version 6.6.63-spacemit-kvm+`.

---

## 4. Risultato del Test KVM
* **Comando:** `sudo modprobe kvm`
* **Errore registrato:** `ERROR: could not insert 'kvm': No such device`
* **Analisi `dmesg`:** `kvm [1118]: hypervisor extension not available`
* **Verdetto finale:** L'hardware SpacemiT X60 / K1 **non implementa l'estensione Hypervisor (H-Extension)** a livello di silicio/firmware (OpenSBI). Di conseguenza, KVM non può essere inizializzato su questa macchina.

---

## 5. Conclusioni per lo Sviluppo
* **Pro:** Dimostrata la perfetta stabilità del workflow di cross-compilazione su `father` e la piena comprensione della mappa delle partizioni (eMMC vs NVMe) e di U-Boot sul MuseBook.
* **Contro:** Impossibile usare KVM hardware sul MuseBook.
* **Alternative operative:**
  1. Utilizzare isolamento tramite container (`LXC` o `systemd-nspawn`) per test e build di *penguins-eggs* sul MuseBook (prestazioni quasi native).
  2. Mantenere le VM pesanti via QEMU/KVM su `father` o ambienti x86_64/Proxmox.
  