# `FILOSOFIA.md`
## L'Architettura "Evolution Edition" di oa-tools

Questo documento traccia la visione architetturale e filosofica alla base dell'evoluzione di `oa-tools`. Nasce dalla necessità di bilanciare la flessibilità di configurazione con la robustezza dell'esecuzione, superando i limiti fisiologici della generazione dinamica di script shell.

Il cuore concettuale ruota attorno al gioco di parole che dà l'anima al progetto: in dialetto *oa* significa uova. L'orchestratore *coa* prepara il terreno e l'ambiente ("cova l'uovo"), lasciando che la vita prenda forma nel sistema operativo.

### 1. Il Problema: Il "Brain" Inquinato
Nelle versioni iniziali, la potenza del tool si basava sulla generazione di un monolitico script Bash (es. `common.bash.tmpl`).
Questo approccio forzava il motore di planning (il "Brain") a svolgere due ruoli contrastanti:
1. **Dichiarativo:** Leggere file YAML e unire variabili.
2. **Imperativo:** Scrivere stringhe di codice Bash per eseguire comandi (`oa_shell`).

Il risultato era un Brain "sporco", difficile da manutenere, e un'esecuzione delegata a fragili sub-shell, soggette a errori non tracciabili in modo granulare.

### 2. La Soluzione: Il Modello a Tre Attori (con due binari)
L'architettura definitiva abbraccia la *Unix Philosophy*, dividendo le responsabilità in compartimenti stagni. Il flusso passa da una generazione di script a una vera e propria **delegazione di esecuzione (Master-Worker)**.

L'ecosistema si regge su tre ruoli logici, implementati fisicamente in due soli eseguibili (`coa` e `oa`):

#### A. Il Pianificatore Puro: `coa build` (Go)
* **Ruolo:** È la Mente. Il suo unico scopo è tradurre i desiderata dell'utente (YAML) in uno stato rigoroso e formale.
* **Cosa fa:** Legge `base.yaml`, applica gli override di `custom.yaml` e genera un file "Single Source of Truth": `oa-plan.json`.
* **Filosofia:** Il Brain viene totalmente "prosciugato". Non conosce la sintassi Bash, non lancia processi. Produce solo dati puri.

#### B. Il Capocantiere: `oa` (C)
* **Ruolo:** È il Muscolo e il Direttore dei Lavori sul campo.
* **Cosa fa:** Riceve in pasto `oa-plan.json`. Costruisce l'albero di esecuzione e gestisce il loop temporale passo dopo passo. 
* **Filosofia:** Mantiene i privilegi di root e agisce vicino al metallo. Quando incontra un'azione di sistema pura (`chroot`, `mount`, manipolazione utenti) usa le sue system call in C. È un blocco unico, coeso, cieco rispetto al piano generale, ma infallibile nel suo compito specifico.

#### C. L'Artigiano Specializzato: `elle` (Go, integrato come `coa elle`)
* **Ruolo:** È il Tecnico di alto livello. Sostituisce definitivamente l'uso degli script Bash per le operazioni complesse.
* **Cosa fa:** È un sottocomando nascosto dell'eseguibile Go principale (Pattern *Multi-call binary*, come Git o Docker). Quando il capocantiere `oa` (C) deve eseguire un'operazione complessa come la generazione di un filesystem SquashFS o di una ISO, non lancia più `/bin/bash`, ma esegue una chiamata di sistema verso:
  `coa elle --plan oa-plan.json --action coa-squashfs`
* **Filosofia:** Sfrutta la potenza nativa di Go per I/O veloce, tipizzazione sicura e gestione degli errori granulare (es. invocando `mksquashfs` nativamente tramite `os/exec`), restituendo poi il controllo al demone C.

### 3. Vantaggi del Modello (Il Pattern "Strangler")
Questa architettura non richiede di riscrivere tutto da zero in una notte, ma permette una transizione dolce:
1. **Stabilità logistica:** L'utente finale continua a scaricare solo i due binari originali. L'albero delle directory rimane pulito.
2. **Vantaggio Cognitivo e Semantico:** Le chiamate seguono una grammatica naturale (Soggetto + Verbo -> `coa elle`, `git commit`), rendendo i log chiari e l'intento auto-documentante.
3. **Morte delle Sub-shell:** Si elimina il costo di inizializzazione di Bash e i rischi legati agli escape dei caratteri. Tutto diventa tipizzato e tracciabile (Fail-fast istantaneo al primo errore).

### 4. Il Workflow Operativo
1. **Pianificazione:** `coa` -> YAML -> JSON.
2. **Passaggio consegne:** `coa` avvia `oa` passando il JSON.
3. **Esecuzione mista:** `oa` itera il JSON:
   * Azione a basso livello -> `oa` esegue in C.
   * Azione ad alto livello -> `oa` invoca nativamente `coa elle` (Go).

***Il software è come un organismo: non si evolve distruggendo il proprio DNA, ma specializzando le proprie cellule per compiti sempre più mirati.***
