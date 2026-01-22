---
title: Eggs users' guide
authors: pieroproietti
sidebar_position: 2
lang: it
enableComments: true
---
import Translactions from '@site/src/components/Translactions';

<Translactions />

In case of problems with translation links, You can consult a detailed [README](https://github.com/pieroproietti/penguins-eggs#readme) in English on the repository.

Manuale aggiornato a `eggs v26.1.21` ultimo aggiornamento 22 gennaio 2026

## Introduzione

![Un sistema riproduttivo per pinguini](/images/manjaro-uefi-booting.png)

`penguins' eggs` è uno strumento moderno per la rimasterizzazione di sistemi Linux, pensato come successore di Remastersys e Systemback. Il software nasce dall'idea della "riproduzione" applicata ai sistemi operativi: ogni sistema può "deporre le sue uova" per dare vita a nuovi sistemi identici o personalizzati.

**Caratteristiche principali:**
- Supporto per oltre 15 distribuzioni Linux (Almalinux, Arch, Debian, Devuan, Fedora, Manjaro, openSUSE, Rocky, Ubuntu, [SUPPORTED-DISTROS](https://github.com/pieroproietti/fresh-eggs/blob/main/SUPPORTED-DISTROS.md).
- Installazione semplificata con `fresh-eggs`
- Creazione di ISO live avviabili ed installabile, con o senza i vostri dati.
- Installer CLI (krill) e GUI (calamares)
- Backup criptati e installazioni di rete (PXE)
- Sistema wardrobe per configurazioni predefinite

## Installazione

### Metodo universale raccomandato

Funziona per **tutte le distribuzioni supportate**, tutto quello di cui avete bisogno è di avere git installato:

```bash
git clone https://github.com/pieroproietti/fresh-eggs
cd fresh-eggs
sudo ./fresh-eggs.sh
```

Lo script `fresh-eggs` installerà il pacchetto originale per la vostra distribuzione, soddisfando automaticamente le dipendenze. 

### Configurazione iniziale

Dopo l'installazione, configurate eggs:

```bash
sudo eggs dad --default
```

Questo comando configura automaticamente eggs e propone di creare subito una ISO del vostro sistema.

## Primi passi

### 1. Produrre la prima ISO

```bash
sudo eggs produce --verbose
```

Questo comando crea una ISO live del vostro sistema (senza i dati personali).

### 2. Installare calamares (opzionale)

Per avere un installer grafico:

```bash
sudo eggs calamares --install
```

### 3. Testare la ISO

Le ISO create si trovano in `/home/eggs/` e hanno utente `live` con password `evolution`.

### 4. Interfacce utente

- **`eggs mom`**: Interfaccia grafica per esplorare i comandi
- **`man eggs`**: Manuale completo sempre disponibile
- **Autocomplete**: Usate TAB per completare comandi e opzioni

## Comandi essenziali

### Produzione ISO

```bash
sudo eggs produce                    # Compressione veloce
sudo eggs produce --max              # Massima compressione
sudo eggs produce --pendrive         # Compressione ottimizzata per chiavette USB
sudo eggs produce --standard         # Compressione standard (massima compatibilità)
```

### Produzione ISO con dati utente

```bash
sudo eggs produce --clone            # Include i dati utente
sudo eggs produce --cryptedclone     # Dati utente criptati
```

### Gestione sistema

```bash
sudo eggs dad --default             # Configurazione automatica
sudo eggs kill                      # Elimina ISO e pulisce
sudo eggs tools clean               # Pulizia cache e log
eggs status                         # Stato configurazione
```

### Installazione del sistema

```bash
sudo eggs krill                     # Installer CLI (krill)
sudo eggs krill --unattended        # Installazione CLI automatica
```

### Personalizzazione

```bash
eggs wardrobe get                   # Scarica il wardrobe
eggs wardrobe list                  # Lista costumi disponibili
sudo eggs wardrobe wear colibri     # Applica costume desktop
```

## Casi d'uso comuni

### Creare una respin personalizzata

1. **Preparate il sistema base**: Installate applicazioni, configurate temi, personalizzate
2. **Pulite il sistema**: `sudo eggs tools clean`
3. **Producete la ISO**: `sudo eggs produce --pendrive`
4. **Per distribuzione finale**: `sudo eggs produce --pendrive --release`

### Creare un clone live del sistema 

**Clone in chiaro:**
```bash
sudo eggs produce --clone
```

**Clone criptato:**
Su Debian trixie o Devuan excalibur, utilizzate --fullcrypt:
```bash
sudo eggs produce --fullcrypt 
```
Tutto il vostro filesystem risiede in un volume LUKS denominato root.img all'interno della ISO live.


per le altre distribuzioni utilizzate --homecrypt
```bash
sudo eggs produce --homecrypt 
```
Tutta la directory `/home/` e gli account degli utenti sono cryptati all'interno di un volume LUKS denominato home.img all'interno della ISO live.

## Wardrobe - Configurazioni predefinite

Il sistema wardrobe permette di applicare configurazioni desktop predefinite:

```bash
eggs wardrobe get                   # Scarica il wardrobe
eggs wardrobe list                  # Mostra costumi disponibili
sudo eggs wardrobe wear colibri     # Desktop leggero
sudo eggs wardrobe wear duck        # Desktop completo
sudo eggs wardrobe wear wagtail/waydroid  # Configurazioni speciali
```

## Approfondimenti

### Distribuzioni supportate

#### Distribuzioni principali
- **AlmaLinux** (el9 rpm)
- **Alpine** (apk)
- **Arch Linux** (AUR/Chaotic-AUR) 
- **Debian** buster, bullseye, bookworm, trixie (.deb)
- **Devuan** beowulf, chimaera, daedalus (.deb)
- **Fedora** (fedora rpm)
- **Manjaro** (repository ufficiale)
- **OpenMamba** (openmamba rpm)
- **OpenSuSE** (opensuse rpm)
- **Rocky Linux** (el9 rpm)
- **Ubuntu** focal, jammy, noble (.deb)

#### Derivate supportate
Deepin, EndeavourOS, KDE neon, Linux Mint, LMDE, Pop!_OS, Zorin OS e [molte altre](https://github.com/pieroproietti/fresh-eggs/blob/main/SUPPORTED-DISTROS.md). E' possibile editare i file [derivatives.yaml](https://github.com/pieroproietti/penguins-eggs/blob/master/conf/derivatives.yaml) per le derivate Arch/Debian/Devuan/Ubuntu e [derivatives_fedora.yml](https://github.com/pieroproietti/penguins-eggs/blob/master/conf/derivatives_fedora.yaml) per quelle di derivazione fedora/el9.

#### Architetture
I pacchetti .deb sono disponibili per le seguenti architetture:
- **amd64** (x86_64)
- **i386** (x86)
- **arm64** (aarch64)
- **riscv64** (riscv64)


### Installazione per distribuzione
Per tutte le distribuzioni, una volta installato il pacchetto penguins-eggs, potete aggiungere la repository `https://penguins-eggs.net/repos` per tenerlo aggiornato:
```
sudo eggs tools repo --add
```

#### Alpine (apk)
Scaricare i pacchetti da [penguins-eggs.net](https://penguins-eggs.net/basket/index.php?p=) o dalla pagina [sourceforge](https://sourceforge.net/projects/penguins-eggs/) ed installarli con il comando:
```bash
doas apk add ./penguins-eggs-*.apk
```

#### Debian/Devuan/Ubuntu (.deb)
**Installazione manuale:**
Scaricare il pacchetto da [penguins-eggs.net](https://penguins-eggs.net/basket/index.php?p=) o dalla pagina [sourceforge](https://sourceforge.net/projects/penguins-eggs/) ed instalarlo con il comando:
```bash
sudo apt install ./penguins-eggs-26.1.21-1_amd64.deb
```

#### Arch Linux
Scaricare il pacchetto da [penguins-eggs.net](https://penguins-eggs.net/basket/index.php?p=) o dalla pagina [sourceforge](https://sourceforge.net/projects/penguins-eggs/) ed instalarlo con il comando:
```
sudo pacman -U ./penguins-eggs-26.1.21-1-any.pkg.tar.zst
```

### Fedora, Rocky, Almalinux
Scaricare il pacchetto da [penguins-eggs.net](https://penguins-eggs.net/basket/index.php?p=) o dalla pagina [sourceforge](https://sourceforge.net/projects/penguins-eggs/) ed instalarlo con il comando:
```
sudo dnf install ./penguins-eggs-26.1.21-1.fc42.x86_64.rpm
```
Per Rocky ed Almalinux:
```
sudo dnf install ./penguins-eggs-26.1.21-1.el9.x86_64.rpm
```

#### Manjaro
Penguins-eggs è presente nel repository community, può comunque essere scaricato da [penguins-eggs.net](https://penguins-eggs.net/basket/index.php?p=) o dalla pagina [sourceforge](https://sourceforge.net/projects/penguins-eggs/) ed instalarlo con il comando:
```
sudo pacman -U ./penguins-eggs-26.1.21-1-any.pkg.tar.zst
```

Per installare la versione dalla repository community, basta:
```bash
sudo pamac upgrade
sudo pamac install penguins-eggs
```

#### OpenSUSE
Scaricare il pacchetto da [penguins-eggs.net](https://penguins-eggs.net/basket/index.php?p=) o dalla pagina [sourceforge](https://sourceforge.net/projects/penguins-eggs/) ed instalarlo con il comando:
```
sudo zypper install ./penguins-eggs-26.1.21-1.opensuse.x86_64.rpm
```

### Utilizzo da codice sorgente

Per sviluppatori o per maggiore sicurezza:

#### Installazione dipendenze

**Debian/Ubuntu:**
```bash
sudo apt install nodejs npm build-essential
sudo npm i pnpm -g
```

**Arch Linux:**
```bash
sudo pacman -S nodejs pnpm
```

#### Compilazione

```bash
git clone https://github.com/pieroproietti/penguins-eggs
cd penguins-eggs
pnpm install
```

#### Utilizzo

```bash
sudo ./eggs produce --verbose
```

### Configurazione avanzata

#### File di configurazione

In `/etc/penguins-eggs.d` trovate:

**`eggs.yaml` - Configurazioni principali:**
```yaml
compression: fast
force_installer: false
make_efi: true
make_isohybrid: true
root_passwd: evolution
snapshot_basename: father
snapshot_dir: /home/eggs/
theme: eggs
user_opt: live
user_opt_passwd: evolution
```

**`krill.yaml` - Installazione unattended:**
```yaml
language: 'en_US.UTF-8'
region: 'America'
zone: 'New_York'
keyboardLayout: 'us'
installationDevice: ''
name: 'artisan'
password: 'evolution'
rootPassword: 'evolution'
autologin: true
```

#### Configurazione personalizzata

```bash
sudo eggs dad --file custom.yaml
```

Esempio `custom.yaml`:
```yaml
root_passwd: secret
snapshot_basename: columbus
snapshot_prefix: ''
user_opt_passwd: secret
user_opt: user
```

### Comandi dettagliati

#### `eggs produce` - Opzioni avanzate

```bash
produce a live image from your system without your data

FLAGS
  -C, --cryptedclone         crypted clone
  -N, --noicon               no icon eggs on desktop
  -P, --prefix=<value>       prefix
  -S, --standard             standard compression: xz -b 1M
  -c, --clone                clone
  -k, --kernel=<value>       kernel version
  -m, --max                  max compression: xz -Xbcj ...
  -n, --nointeractive        no user interaction
  -p, --pendrive             optimized for pendrive: zstd -b 1M -Xcompression-level 15
  -s, --script               script mode
  -u, --unsecure             /root contents are included on live
  -v, --verbose              verbose
  -y, --yolk                 force yolk renew
      --addons=<value>...    addons: adapt, pve, rsupport
      --basename=<value>     basename
      --excludes=<value>...  use: static, homes, home
      --links=<value>...     desktop links
      --release              remove penguins-eggs after installation
      --theme=<value>        theme for livecd, calamares branding
```

**Algoritmi di compressione:**
- **Default**: `zstd-level-1` - compressione veloce (per test)
- **--pendrive**: `zstd -b 1M -Xcompression-level 15` - ottimizzato per USB
- **--standard**: `xz -b 1M` - buona compressione
- **--max**: `xz -Xbcj` - massima compressione

#### L'installer krill

krill è l'installer TUI di eggs, progettato per:
- Installazione su sistemi CLI/server
- Sistemi con `<2GB` RAM
- Installazione unattended

**Passi dell'installazione:**
1. **welcome** - Selezione lingua
2. **location** - Fuso orario
3. **keyboard** - Layout tastiera
4. **partition** - Selezione disco
5. **users** - Configurazione utenti
6. **network** - Configurazione rete
7. **summary** - Riepilogo
8. **installation** - Installazione
9. **finish** - Completamento

#### Altri comandi

- `eggs adapt`: Adatta risoluzione per VM
- `eggs export`: Esporta ISO su host remoti
- `eggs tools`: Strumenti di manutenzione
   - `eggs tools clean`: Pulisce cache e log
   - `eggs tools repo`: Gestisce repository eggs
   - `eggs tools skel`: Ricrea `/etc/skel`
   - `eggs tools yolk`: Crea repository locale (Debian)

### Creazione distribuzioni personalizzate

#### Processo completo

1. **Sistema base**
   - Installate la distribuzione desiderata
   - Aggiornate: `sudo apt update && sudo apt upgrade`
   - Personalizzate applicazioni e configurazioni

2. **Installazione eggs**
   ```bash
   git clone https://github.com/pieroproietti/fresh-eggs
   cd fresh-eggs
   sudo ./fresh-eggs.sh
   ```

3. **Configurazione**
   ```bash
   sudo eggs dad --default
   sudo eggs calamares --install  # Opzionale
   ```

4. **Personalizzazione avanzata**
   - Temi e wallpaper
   - Applicazioni predefinite
   - Configurazioni sistema
   - Script di post-installazione

5. **Produzione finale**
   ```bash
   sudo eggs tools clean
   sudo eggs produce --standard --release
   ```

#### Consigli per la distribuzione

- **Dimensioni**: Mantenete le ISO sotto 4-5 GB
- **Test**: Testate regolarmente su VM
- **Documentazione**: Create guide per gli utenti
- **Repository**: Considerate una repository per aggiornamenti

### Wardrobe avanzato

#### Struttura wardrobe

```
wardrobe/
├── costumes/          # Configurazioni complete
│   ├── colibri/       # Desktop GNOME
│   ├── duck/          # Desktop leggero
│   └── wagtail/       # Configurazioni speciali
└── accessories/       # Componenti aggiuntivi
    ├── firmwares/     # Driver proprietari
    └── multimedia/    # Codec multimediali
```

#### Creare un wardrobe personalizzato

1. **Fork del repository wardrobe**
2. **Aggiungete le vostre configurazioni**
3. **Testate**: `eggs wardrobe get your-repo`
4. **Condividete** con la community

### Novità versione 26.1.x

#### Miglioramenti principali

**Refactoring con AI**: Importante refactoring del codice con l'aiuto di Claude.ai e antigravity.google per maggiore efficienza.

**Supporto RPM migliorato**: Immagini ISO avviabili su UEFI per AlmaLinux, Fedora, OpenSuSE, Rocky Linux.

**Krill potenziato**:
- Installazioni LUKS criptate
- Gestione LVM2
- Supporto systemd-boot
- Chroot pre-riboot
- Rimozione automatica pacchetti

**Nuove funzionalità produce**:
- Flag `--pendrive` ottimizzato
- Flag `--kernel` per versione specifica
- Migliore gestione temi calamares

#### Correzioni importanti

- **Link simbolici**: Risolto bug critico con `/bin`, `/sbin`, `/lib`
- **Compatibilità**: Miglioramenti tra distribuzioni diverse
- **Ubuntu Noble**: Supporto completo per 24.04 LTS

### Progetti che usano eggs

#### Distribuzioni principali

**Waydroid Linux**: Prima distribuzione con eggs per sistema live, esegue Android su Linux.

**Quirinux GNU/Linux**: Specializzata per animazione e film, collaborazione con Charlie Martinez.

**EducAndOS+**: Prima con tema personalizzato eggs, molto usata nelle scuole spagnole.

**NovaOS**: Basata su Linux Mint, creata da Nicklas (in mio Signore delle stelle!)

**PredatorOS**: Debian-based per penetration testing.

**SysLinuxOS**: Per System Integrator, creata da Franco Conidi.

### Dipendenze e requisiti

#### Debian/Devuan/Ubuntu

**Pacchetti essenziali:**
```yaml
common:
  - coreutils, cryptsetup, curl
  - dosfstools, dpkg-dev, git
  - isolinux, jq, live-boot
  - live-config-systemd
  - nodejs (>= 22)
  - parted, rsync
  - squashfs-tools, xorriso

amd64:
  - grub-efi-amd64-bin
  - syslinux
```

#### Altre distribuzioni

- **Arch**: Vedi [PKGBUILD AUR](https://aur.archlinux.org/packages/penguins-eggs)
- **Manjaro**: [PKGBUILD GitLab](https://gitlab.manjaro.org/packages/community/penguins-eggs/-/blob/master/PKGBUILD)
- **RPM**: Script in [REQUIREMENTS](https://github.com/pieroproietti/fresh-eggs/tree/main/tarballs/requirements)

### Supporto e community

#### Canali ufficiali

- **GitHub Issues**: [penguins-eggs issues](https://github.com/pieroproietti/penguins-eggs/issues)
- **Blog**: [penguins-eggs.net](https://penguins-eggs.net)
- **Facebook**: [penguin's eggs group](https://www.facebook.com/groups/128861437762355)
- **Email**: pieroproietti@gmail.com

#### Come contribuire

**Sviluppo**:
- Fork GitHub e miglioramenti codice
- Test su nuove distribuzioni
- Creazione temi personalizzati

**Documentazione**:
- Traduzioni in altre lingue
- Guide e tutorial
- Miglioramenti documentazione

**Community**:
- Supporto utenti nei forum
- Creazione costumi wardrobe
- Condivisione configurazioni

#### Riconoscimenti

Ringraziamenti speciali a:
- **Hosein Seilany** (Predator-OS author) - Documentazione e README.md
- **Charlie Martinez** (Quirinux author) - Eggs icons
- **Franco Conidi** (SysLinuxOS author) - Feedback
- **Glenn Chugg** - (LastOSLinux author) - Testing
- **Jorge Luis Endres** - (eggsmaker author)
- **Silvan Calarco** - (OpenMamba author) 
- Tutta la community per feedback e motivazione

### Download e risorse

#### Immagini ISO ufficiali

Le ISO dell'autore sono disponibili su:
- [penguins-eggs.net](https://penguins-eggs.net)
- [SourceForge](https://sourceforge.net/projects/penguins-eggs/)

**Credenziali default**:
- **User live**: `live`
- **Password**: `evolution` (valida per `live` e `root`)

#### Immagini naked

Installazioni minimali senza GUI, ideali come base:

```bash
eggs wardrobe get
sudo eggs wardrobe wear colibri    # Aggiunge desktop
```

## Conclusioni

penguins-eggs rappresenta una soluzione moderna e completa per la rimasterizzazione Linux. Con supporto esteso sia per distribuzioni che per architetture, strumenti avanzati come backup criptati ed il sistema wardrobe. eggs non è solo un di rimasterizzazione ma un ecosistema completo per la gestione di sistemi Linux personalizzati usabile anche in contesti CD/CI (continuous integration, e continuous delivery.

La filosofia della "riproduzione" applicata ai sistemi operativi permette a ogni sistema di "deporre le sue uova" per dare vita a nuovi sistemi, mantenendo le caratteristiche del genitore ma adattandosi a nuovi ambienti.

**e... Buona "cova" a tutti!**

---

**Per favore** collaborate al progetto, condividetelo e consigliatelo: è importante raggiungere una certa diffusione perché il progetto rimanga valido e aggiornato.

**Grazie!**

*Piero Proietti*

---

*Copyright (c) 2017, 2026 Piero Proietti, dual licensed under the MIT or GPL Version 2 licenses.*