vorrei abilitare eggs come server mcp, creando un comando eggs mcp.
Qualcosa sulla falsariga di systemctl, quindi eable, disable, start, stop, status.

1. Fase 1: eggs mcp enable / disable (Setup & Provisioning)
Questo comando è un'operazione una tantum (o di gestione) eseguita dall'amministratore o dall'utente. Non resta in ascolto, ma prepara il terreno:

Siti di scrittura: Cerca i percorsi standard dei client MCP (es. ~/.config/antigravity/mcp.json, ~/.config/Claude/claude_desktop_config.json, ecc.).

Azione: Legge il file JSON esistente (se c'è), inietta (o rimuove, in caso di disable) il nodo "penguins-eggs", e riscrive il file mantenendo intatte le configurazioni degli altri server.

Permessi: Configura la regola in /etc/sudoers.d/penguins-eggs-mcp per permettere l'invocazione dei comandi eggs priva di password da parte dell'agente.

2. Fase 2: eggs mcp start (Il Daemon Listener in stdio)
Una volta abilitato, quando l'agente AI (es. Antigravity CLI) si avvia, legge il file mcp.json, trova la voce "penguins-eggs" e lancia il processo in background.

A questo punto il processo entra nel suo ciclo operativo principale:

[ Agente AI / Client MCP ]
       │
       │ 1. Avvia il processo `/usr/bin/eggs`
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Esecuzione di `eggs mcp`                        │
│                                                             │
│ 2. Inizializzazione:                                        │
│    • Dichiara le Capabilities (JSON-RPC)                    │
│    • Risponde al handshake `initialize`                     │
│    • Espone la lista dei Tool e delle Resources (schema)    │
│                                                             │
│ 3. Loop infinito di ascolto (STDIN / STDOUT):               │
│    ┌──────────────────────────────────────────────────┐     │
│    │  LOOP {                                          │     │
│    │    • Legge linea da os.Stdin                     │     │
│    │    • Decodifica JSON-RPC (req.Method)             │     │
│    │    • Esegue il comando `eggs` (es. via exec)     │     │
│    │    • Rilascia la risposta JSON-RPC su os.Stdout   │     │
│    │  }                                               │     │
│    └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
Come gestisce il ciclo "Ascolto → Chiamata → Rilascio"
Nel loop di ascolto Go, la gestione è pulita e non bloccante per l'I/O:

In ascolto (Idle): Il processo rimane in attesa bloccato su bufio.Reader.ReadBytes('\n') consumando 0% di CPU e pochissima RAM.

Ricezione ed Esecuzione: Quando l'AI invia un messaggio su STDIN (es. un tools/call per eggs_produce):

L'MCP Server valida i parametri JSON.

Lancia il comando sottostante sudo /usr/bin/eggs produce ... catturandone lo stdout e lo stderr.

Rilascio della risposta: Appena eggs termina la sua esecuzione (o mentre manda log in streaming), il server impacchetta l'output nel formato JSON-RPC e lo "rilascia" stampandolo su os.Stdout.

Ritorno in ascolto: Il server si rimette immediatamente in attesa sul ciclo for per la chiamata successiva.

Un unico binario o due?
Puoi gestire tutto all'interno dello stesso binario Go di eggs:

eggs mcp enable → Esegue la routine di configurazione dei file JSON e dei sudoers.

eggs mcp disable → Rimuove le configurazioni.

eggs mcp start  → Avvia la modalità server stdio/JSON-RPC in ascolto per l'AI.

È un'architettura elegante, totalmente autocontenuta e priva di dipendenze esterne.