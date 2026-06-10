# oa-tools — Contesto Sessione
> Da incollare all'inizio di una nuova conversazione con un AI assistant.

## Chi sono
Piero Proietti (`pieroproietti`), autore di **penguins-eggs** (500+ ⭐, tool di remastering Linux in TypeScript) e del suo successore **oa-tools**.

- Blog / contatti: penguins-eggs.net
- Repo: https://github.com/pieroproietti/oa-tools

---

## Cos'è oa-tools
Riscrittura architetturale di penguins-eggs. Monorepo con due componenti:

| Componente | Linguaggio | Ruolo |
|---|---|---|
| `oa` | C | Motore low-level: OverlayFS, SquashFS, ISO, syscall kernel |
| `coa` | Go + Cobra | Orchestratore: CLI, detect distro, esecuzione piano YAML |

Genera ISO **live bootable ibride (UEFI + BIOS)** per: Alpine, Arch, Debian, Fedora, Manjaro, openSUSE e derivate.

---

## Architettura chiave

### Orchestrazione
- `coa/brain.d/base.yaml.tmpl` — piano di remastering principale (Go `text/template`)
- `coa/brain.d/modules/<distro>.tmpl` — snippet distro-specifici inclusi via `{{ include }}`
- Hook principali: `distro_initramfs_cmd`, `distro_hook_squashfs`, `distro_hook_install_logic`

### Detect distro (`coa/pkg/distro/detect.go`)
- Legge `/etc/os-release`
- `candidates := [ID] + fields(ID_LIKE)` — scorre in ordine, prima match vince
- Manjaro intercettato su `ID` prima che `ID_LIKE=arch` possa matchare
- Fallback: `FamilyID = "generic"`
- **Nota**: `Arch` field usa `runtime.GOARCH` — da sistemare con `uname -m` prima del porting multi-arch

### CI/CD ("The Furnace")
- Build pacchetti nativi (.deb, PKGBUILD, ecc.) → GitHub Actions standard
- Remastering end-to-end → self-hosted runner su **Proxmox** (VM con snapshot "vergini")
- 4 famiglie testate: Alpine (apk), Arch (pacman), Debian (apt), Fedora (dnf)

### Stile codice Go — regole ferree
- Logging: sempre `utils.LogNormal/Success/Warning/Error/Fatal` — mai `fmt.Printf` raw
- Exec: sempre `utils.Exec / ExecQuiet / ExecCapture` — mai `exec.Command` raw (eccetto stream complessi)
- Passare `RuntimeContext` strutturato invece di array di stringhe

---

## Stato attuale
- ✅ Remastering funzionante su tutte e 6 le distro
- ✅ Installer grafico: Calamares (anche Alpine lo supporta)
- ✅ Installer TUI: krill (già presente, vedere note sotto)
- ❌ Clone con dati utente (`clone`)
- ❌ Clone cifrato (`cryptedclone`)

---

## Punti aperti emersi in sessione

### 1. krill — Installer TUI
- In eggs era scritto in TypeScript, va riscritto in Go
- Candidato: **Bubbletea** (charmbracelet) per il wizard multi-step
- Target prioritario: **sysadmin server** (headless, senza Calamares)
- La logica di installazione è già nel blocco `install:` del YAML — krill può essere un frontend TUI che raccoglie parametri e poi esegue lo stesso piano

### 2. Arch detection multi-architettura
```go
func detectArch() string {
    out, err := exec.Command("uname", "-m").Output()
    if err != nil {
        return runtime.GOARCH // fallback
    }
    arch := strings.TrimSpace(string(out))
    switch arch {
    case "x86_64":  return "amd64"
    case "aarch64": return "arm64"
    case "riscv64": return "riscv64"
    default:        return arch
    }
}
```
Da integrare in `NewDistro()` prima del porting arm64/riscv64.

### 3. work_dir hardcoded nei template
`/home/eggs` appare letteralmente negli shell command di `base.yaml.tmpl`.
Se l'utente cambia `settings.remaster.work_dir`, i comandi shell non lo rispettano.
Soluzione: passarlo come variabile di template anche negli shell command:
```yaml
command: "/etc/oa-tools.d/scripts/copy-kernel-initrd.sh {{ .settings.remaster.work_dir }}"
```

### 4. generate-efi.img
Lo step con `dd` + `mkfs.vfat` + `mmd` + `mcopy` inline è fragile.
Candidato a diventare modulo dedicato `efi_image` per gestione errori strutturata.

### 5. Cleanup/rollback on error
Il passo `cleanup` è commentato nel YAML. In caso di errore a metà pipeline i mount rimangono appesi. Valutare meccanismo di rollback automatico in `coa`.

---

## Hardware di test
| Arch | Hardware | Note |
|---|---|---|
| amd64 | Proxmox principale | VM per CI, runner self-hosted |
| arm64 | Raspberry Pi 5 con Proxmox | VM ARM64, già operativo |
| riscv64 | SpaceMit MuseBook M1 | Bianbu OS (derivata Ubuntu), già rimasterizzata con eggs |

---

## Visibilità / community
- Problema: oa-tools ha poche star nonostante la qualità — penguins-eggs cattura ancora tutto il traffico
- Piano: aspettare parità funzionale Debian/Ubuntu, poi post tecnico su blog + HackerNews ("I rewrote my remastering tool in C+Go, here's why")
- Il README di penguins-eggs già menziona oa-tools come successore — rafforzare il link

---

## Riferimenti utili
- `AGENTS.md` nel repo: contesto completo per AI, stile codice, CLI hierarchy, guardrail
- `coa/brain.d/base.yaml.tmpl`: piano orchestrazione principale
- `coa/brain.d/modules/`: template distro-specifici
- `coa/pkg/distro/detect.go`: logica detect famiglia distro
