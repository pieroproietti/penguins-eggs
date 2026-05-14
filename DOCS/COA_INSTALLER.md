# COA INSTALLER: Architecture & Design

Questo documento definisce l'architettura, gli obiettivi e la struttura del package unificato `sysinstall` all'interno di `oa-tools`. 

## 1. La Visione: Un Motore, Due Volti
L'obiettivo di `sysinstall` è rendere il processo di installazione completamente agnostico rispetto all'interfaccia utente, aderendo alla nostra **Universal Strategy**. Invece di gestire due flussi separati per l'installazione grafica e quella da terminale, il sistema utilizza un singolo "cervello" che orchestra l'operazione, decidendo dinamicamente quale "volto" mostrare all'utente in base all'ambiente di esecuzione.

* **GUI (Graphical User Interface):** Demandata a **Calamares**.
* **TUI (Text User Interface):** Demandata a **Krill** (la modalità console nativa di `oa-tools`).

## 2. La "Single Source of Truth" (Fonte della Verità)
Per evitare disallineamenti, sia Calamares che Krill devono leggere esattamente gli stessi file di configurazione. 
Abbandoniamo la frammentazione delle directory standard e centralizziamo tutto in:
`/etc/oa-tools/installer.d/`

Questa directory conterrà i file `.conf` (con sintassi YAML compatibile):
* `settings.conf`: Il file master che definisce la sequenza dei moduli (`show`, `exec`).
* `branding.desc`: Le definizioni di loghi, nomi (es. `VOL_ID`), e URL di supporto.
* `modules/*.conf`: Le configurazioni specifiche per il partizionamento, la creazione utenti, il network, ecc.

**Regola d'oro:** Se un utente o un template modifica `settings.conf`, la modifica si riflette istantaneamente su entrambi gli installer.

## 3. Il Flusso di Esecuzione (The Dispatcher)
Quando l'utente o il sistema lancia il comando di installazione (es. `eggs sysinstall` o `coa install`), il package `sysinstall` agisce da selettore intelligente (Dispatcher).

1.  **Check Ambiente:** Verifica la presenza di un display server attivo (X11 o Wayland).
2.  **Check Binario:** Verifica se l'eseguibile `calamares` è presente nel `$PATH`.
3.  **Routing:**
    * **Se GUI == true && Calamares == presente:** Lancia `calamares -d -c /etc/oa-tools/installer.d/settings.conf`.
    * **Se GUI == false || Calamares == assente (Fallback):** Esegue la routine interna chiamando l'interfaccia testuale **Krill**, passando lo stesso percorso di configurazione.

## 4. Architettura del Package Go (`sysinstall`)
Il codice sorgente all'interno di `oa-tools` sarà strutturato con un design a plugin per separare la logica di lettura da quella di visualizzazione.

```go
sysinstall/
├── engine/        # Parser dei file .conf e .yaml. Costruisce l'InstallationPlan.
├── adapters/
│   ├── calamares/ # Wrapper per lanciare il processo C++ e passargli i symlink/config.
│   └── krill/     # Implementazione TUI nativa in Go (interfacce per terminale).
└── modules/       # La logica esecutiva vera e propria per Krill (es. run_partition, run_users).
```

### 4.1 Il ruolo di Krill come "Calamares-Core-Runner"
Krill non è un installer indipendente, ma un interprete testuale di Calamares.
* Legge `settings.conf`.
* Ignora i moduli puramente estetici (es. `welcome` slide animate).
* Mappa i moduli logici di Calamares sulle proprie funzioni Go (es. quando incontra `- partition` in fase `exec`, Krill lancia la sua logica di interazione con `parted`/`sfdisk`).

## 5. Roadmap di Sviluppo
Le fasi per implementare questa architettura sono:

1.  **Fase 1: Unificazione Repository:** Ridenominare gli attuali package isolati in `sysinstall`.
2.  **Fase 2: Il Parser Base (`engine`):** Scrivere in Go le `struct` necessarie per parsare `settings.conf` e `branding.desc`.
3.  **Fase 3: Lo switch logico (`dispatcher`):** Scrivere la logica che decide se avviare Calamares o Krill.
4.  **Fase 4: Krill UI:** Implementare la lettura della sequenza (`InstallationPlan`) e la creazione delle schermate TUI corrispondenti.
5.  **Fase 5: Krill Execution:** Collegare i moduli TUI ai comandi di sistema per l'installazione fisica.


# La situazione da cui partiamo

Abbiamo un package denominato calamares che viene usato in due modi... prepare_oa_bootloader.go
