# Guida al Laboratorio di Test Locale con Vagrant e KVM/libvirt
**Focus Attuale: Guest Arch Linux su Host Debian**

Questo documento descrive come configurare, utilizzare e gestire l'ambiente di virtualizzazione locale basato su **Vagrant** e **KVM/libvirt** per il testing end-to-end e il packaging di `oa-tools`.

L'uso di Vagrant con libvirt consente di testare la rimasterizzazione reale su kernel nativi, sfruttando l'accelerazione hardware e isolando i mount complessi dal sistema host.

---

## 1. Configurazione dell'Host (Debian)

Per garantire la massima stabilità ed evitare conflitti, utilizziamo il repository ufficiale HashiCorp e il motore nativo KVM al posto di VirtualBox.

### 1.1 Installazione di Vagrant e KVM
```bash
# 1. Scarica e installa la chiave GPG di HashiCorp
wget -q [https://apt.releases.hashicorp.com/gpg](https://apt.releases.hashicorp.com/gpg) -O /tmp/hashicorp.gpg
sudo gpg --dearmor --yes -o /usr/share/keyrings/hashicorp-archive-keyring.gpg /tmp/hashicorp.gpg
rm /tmp/hashicorp.gpg

# 2. Aggiungi il repository ufficiale
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] [https://apt.releases.hashicorp.com](https://apt.releases.hashicorp.com) $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list > /dev/null

# 3. Installa le dipendenze di virtualizzazione e Vagrant
sudo apt update
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils ruby-dev libvirt-dev vagrant

# 4. Installa il plugin per far dialogare Vagrant con libvirt
vagrant plugin install vagrant-libvirt
```

### 1.2 Permessi e Moduli di Rete (Fondamentale)
Per evitare errori di Polkit e problemi con le interfacce di rete di libvirt (`/dev/net/tun` mancante):

```bash
# Aggiungi il tuo utente ai gruppi di virtualizzazione
sudo usermod -aG libvirt $USER
sudo usermod -aG libvirt-qemu $USER
sudo usermod -aG kvm $USER

# Carica il modulo di rete TUN e rendilo permanente per i riavvii
echo "tun" | sudo tee /etc/modules-load.d/tun.conf
sudo modprobe tun

# Applica subito i permessi di gruppo alla shell corrente
su - $USER
```

### 1.3 Accelerazione Hardware (Nested Virtualization)
Se l'host Debian è a sua volta una macchina virtuale (es. su Proxmox), è obbligatorio impostare il tipo di processore della VM host su **"Host"** per passare le estensioni di virtualizzazione (VT-x / AMD-V) e permettere a KVM di funzionare.

---

## 2. Configurazione per Arch Linux (Guest)

Le immagini base di Arch (`generic/arch`) soffrono spesso di problemi legati al rapido invecchiamento delle chiavi PGP dei manutentori. Nel `Vagrantfile`, la riga di provisioning per Arch deve essere strutturata per aggiornare prima il portachiavi, o `pacman` rifiuterà di installare `base-devel` e `go`:

```ruby
# Snippet per Vagrantfile
'arch' => { 
  :box => 'generic/arch', 
  :pkg => 'pacman-key --init && pacman-key --populate archlinux && pacman -Sy archlinux-keyring --noconfirm && pacman -Su --noconfirm && pacman -S --noconfirm base-devel go git xorriso squashfs-tools' 
}
```

---

## 3. Flusso di Lavoro (Workflow di Test)

Il `Vagrantfile` è dinamico e accetta la variabile d'ambiente `DISTRO`. I comandi vanno lanciati **sempre dalla root del monorepo**.

### Avvio e Accesso
```bash
# Lancia l'ambiente specificando libvirt
DISTRO=arch vagrant up --provider=libvirt

# Entra nella VM
vagrant ssh
```

### Risoluzione Problema DNS su Arch (Errore `proxy.golang.org`)
A volte l'immagine di Arch configura male `systemd-resolved` per l'IPv6 locale, impedendo a Go di scaricare moduli come `charmbracelet/bubbles` (errore `connection refused`).
Appena entrato nella VM, se la rete non risolve, forza i DNS di Google:
```bash
sudo rm -f /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf
```

### Compilazione e Test Nativo
Il tuo codice locale è mappato automaticamente in `/home/vagrant/oa-tools`.
```bash
cd /home/vagrant/oa-tools
./m  # O il tuo comando di build per coa/oa

# Esegui il volo di rimasterizzazione completo su Kernel reale
sudo ./coa remaster --mode standard
```

---

## 4. Gestione del Ciclo di Vita della VM

Quando hai terminato i test, esci dalla VM con `exit` e gestisci lo stato dall'host Debian:

* **Spegnimento Classico (`vagrant halt`):** Spegne la VM in modo pulito. Mantiene intatto lo stato del disco, i pacchetti installati e la cache. Al riavvio (`vagrant up`) impiegherà pochissimi secondi.
* **Tabula Rasa (`vagrant destroy -f`):** Cancella completamente il disco virtuale associato. Il codice sorgente sull'host non viene toccato. Usalo per garantire che il test successivo parta da un ambiente Arch vergine e privo di vecchi mount.
* **Congelamento (`vagrant suspend`):** Salva lo stato della RAM su disco e mette la VM in pausa. Riprendi con `vagrant resume`.


