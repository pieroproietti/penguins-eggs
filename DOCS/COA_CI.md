# Architettura della CI in oa-tools (Smoketest vs CI Theater)

Questo documento racchiude la filosofia e le considerazioni tecniche che guidano l'integrazione continua (CI) all'interno del monorepo `oa-tools` (`oa` in C, `coa` in Go).

## Il Contesto: Software di Sistema vs Applicazioni Web

La stragrande maggioranza delle piattaforme di CI/CD (come GitHub Actions, GitLab CI, ecc.) è progettata per applicazioni web o software "user-space" generico. In quegli ambienti, i test orchestrano container Docker isolati e blindati privi di privilegi speciali.

`oa-tools` è un framework di **remastering e basso livello**. Per fare il suo dovere deve:
1. Manipolare i file system.
2. Eseguire bind mount complessi (`/proc`, `/sys`, `/dev`) dentro una `liveroot`.
3. Invocare operazioni di `chroot`.
4. Interagire direttamente con le primitive del Kernel Linux dell'host.

## Il Fallimento del "CI Theater"

Tentare di emulare l'intero piano di volo di un remastering (fino alla creazione dello SquashFS e dell'ISO finale con `xorriso`) dentro i container standard di GitHub Actions (sia su immagini `ubuntu-slim` che `ubuntu-latest`) si scontra con restrizioni di sicurezza invalicabili a livello di Kernel host dei runner. 

I tentativi di forzare la pipeline in questi ambienti blindati portano a:
* Fallimenti sistematici della shell interna del chroot (`oa_shell` exit code 1) dovuti a mount parziali o fittizi.
* Introduzione di una quantità impressionante di logica condizionale "finta" nello YAML dei piani (es. `{{ if .IsGitHubAction }}`) solo per far felice il validatore di GitHub.

Sperperare tempo nello scrivere codice artificiale per aggirare le restrizioni della CI non aggiunge alcun valore al progetto. **La qualità del software di sistema si testa su strada, non in provetta.**

## La Strategia: Lo Smoketest Radicale

Per ovviare a questo problema, la CI di `oa-tools` su GitHub Actions è stata ridotta all'osso, implementando un puro **Smoketest** (test del fumo). 

L'obiettivo della CI su GitHub non è validare il boot di una ISO, ma garantire la **salute strutturale e sintattica del codice**.

Il workflow su `ubuntu-latest` esegue tutto:
1. **Compilazione del C (`oa`):** Verifica che la catena di GCC compili il core senza errori di sintassi o linkaggio.
2. **Compilazione del Go (`coa`):** Verifica che il compilatore Go chiuda il cerchio, risolva le dipendenze e gestisca correttamente i tipi.
3. **Rimasterizzazione complet:** Ma nel plan abbiamo aggiunto:
```
	if isGitHubAction {
		excludes = append(excludes,
			"home/runner/work",
			"usr",
			"var",
			"opt",
		)
	}
```

E, pur rimanendo uno Smoketest è verde, completa tutto fino alla creazione della ISO - NON FUNZIONANTE - in meno di due minuti, dimostrando che il codice è strutturalmente sano e privo di regressioni macroscopiche.

## Il Vero Banco di Prova: Vagrant e Virtualizzazione Reale

La vera validazione end-to-end dell'infrastruttura di remastering è delegata ad ambienti di virtualizzazione completi e sotto il totale controllo dello sviluppatore:

* **VM di Sviluppo Locali (Debian/Ubuntu):** Dove il kernel è reale e i privilegi di root sono effettivi.
* **Vagrant:** Il target ideale per l'automazione dei test di build completi. All'interno di una box Vagrant, il sistema operativo gira su un hypervisor (VirtualBox/QEMU) con un kernel nativo, permettendo a `oa_mount_logic` e `oa_shell` in chroot di operare esattamente come su una macchina fisica.

In questi ambienti, il framework attiva sensori biologici (es. il rilevamento della presenza di path specifici o utenti) per calibrare il comportamento del piano di volo (es. prediligere compressioni SquashFS veloci in modalità sviluppo).

---
*Da un divano di Roma, mentre Sinner asfaltava Ruud.*