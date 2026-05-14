# COA Universal Strategy

La **Universal Strategy** è il framework filosofico e tecnico che guida lo sviluppo di `oa-tools`.
Il principio cardine è semplice: un sistema Linux rimasterizzato (un "uovo") deve essere in grado di schiudersi su qualsiasi hardware e in qualsiasi ambiente, indipendentemente dalla distribuzione "madre" su cui è stato generato.

Questa strategia trasforma il remastering da una semplice copia carbone a una creazione di sistemi **agnostici, resilienti e pronti all'uso**.

---

## 1. I Pilastri della Resilienza

### 1.1 Il Boot Ibrido e Monolitico (L'Uovo "Ermafrodita")
La compatibilità del bootloader è la sfida numero uno. Per garantire la massima interoperabilità senza le complicazioni burocratiche delle firme digitali, adottiamo una politica di **Pragmatismo Universale**:
* **Equipaggiamento Totale:** Ogni uovo contiene i binari per Legacy BIOS (`grub-pc-bin`) e UEFI (`grub-efi-amd64-bin`, `efibootmgr`).
* **Scelta Monolitica:** Utilizziamo il `grub-monolithic-efi` di derivazione Debian. Questo ci permette di avere un unico binario pre-compilato con tutti i moduli necessari, garantendo stabilità e velocità di caricamento.
* **Oltre il Secure Boot:** Rinunciamo consapevolmente alla catena di firma del Secure Boot per favorire la libertà di personalizzazione del kernel e dei moduli (fondamentale per sistemi con ZFS o driver custom). La compatibilità è garantita su ogni macchina previa disattivazione del Secure Boot nel firmware.
* **Indipendenza dal Generatore:** Se covi un'immagine su un moderno laptop UEFI, l'uovo risultante sarà comunque in grado di avviarsi su un vecchio PC BIOS del 2010. Il sistema porta con sé i "geni" per ogni firmware possibile.

### 1.2 Autologin e Accesso Universale
Invece di combattere con le configurazioni PAM specifiche di ogni distro, utilizziamo un bypass strutturato (es. LightDM o script di sessione) che garantisce l'accesso automatico alla sessione Live, assicurando che l'utente arrivi sempre al desktop senza attriti.

### 1.3 Il "Secret Agent" (Indipendenza dal Desktop)
Il sistema non deve temere il Desktop Environment (DE). Tramite script di background automatizzati, il sistema riconosce l'ambiente (XFCE, GNOME, KDE, ecc.) e autorizza dinamicamente i lanciatori `.desktop` (come l'installer). Questo elimina gli avvisi di sicurezza del file manager e garantisce una UX fluida ovunque.

### 1.4 Design Responsivo (UI "Premium")
L'interfaccia di installazione si adatta dinamicamente. Grazie a contenitori matematici nel QML di Calamares, immagini e testi scalano perfettamente, evitando bordi vuoti o testi tagliati su monitor con risoluzioni diverse.

---

## 2. L'Architettura dei Template: La "Trinità" dell'Automazione

La strategia universale è resa possibile da un sistema di templating a tre livelli che separa la **Logica** dal **Dialetto**.

### A. `base.yaml.tmpl` (Il DNA Dichiarativo)
È la fonte della verità. Qui definiamo le caratteristiche astratte del sistema:
* **Mappatura delle Dipendenze:** Risolviamo le asimmetrie dei nomi (es. `qml-module-qtquick2` su Debian vs `qt5-declarative` su Arch).
* **Branding Globale:** Definiamo il nome della ISO (`VOL_ID`), i colori del tema e le URL di supporto in un unico punto centralizzato.

### B. `common.bash.tmpl` (Il Motore Agnostico)
È lo script condiviso da tutte le distribuzioni. Rappresenta la logica pura del remastering (chroot, pulizia, compressione SquashFS).
* **Astrazione Totale:** Non contiene clausole `if/else` specifiche per la distro. Quando incontra un punto critico, invoca semplicemente un "hook" (es. `{{ template "initramfs_cmd" . }}`).
* **Pulizia del Codice:** Il motore Go orchestra le operazioni senza sapere quale distribuzione stia effettivamente impacchettando.

### C. Moduli Distro (es. `arch.bash.tmpl`, `fedora.bash.tmpl`)
Sono gli "adattatori di impedenza". Traducono i comandi universali di `common` nei dialetti locali:
* **Gestione Initramfs:** Gestisce le differenze tra `mkinitcpio` (Arch), `dracut` (Fedora) o `initramfs-tools` (Debian).
* **Personalizzazioni Strutturali:** Si occupa delle "stranezze" locali, come la creazione della gerarchia directory specifica per il boot di Arch (`arch/x86_64/airootfs.sfs`) partendo dal filesystem standard generato dal motore.

---

## 3. Scalabilità e Futuro

Grazie a questa architettura, `oa-tools` non è legato al presente. La Universal Strategy permette di:
* **Supportare Nuove Distro:** Aggiungere il supporto per una nuova distribuzione richiede solo la creazione di un nuovo modulo `.bash.tmpl`, senza toccare il codice core in Go.
* **Esplorazione Hardware:** La separazione tra logica e implementazione apre la strada a architetture diverse (come il porting su **RISC-V**), dove cambiano i binari ma la strategia di schiusa dell'uovo rimane la stessa.

**In sintesi:** La *Universal Strategy* trasforma la frammentazione del mondo Linux in un vantaggio competitivo, creando uno standard di remastering che è, per definizione, universale.