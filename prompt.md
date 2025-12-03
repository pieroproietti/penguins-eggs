"Ciao Gemini, lavoriamo su penguins-eggs (un sistema di remastering Linux scritto in TypeScript/Bash). Ecco il contesto architetturale che devi conoscere:

Metafora Familiare:

Dad (eggs dad): Configurazione e script (gestisce /etc, richiede sudo). Usa daddy.ts.

Mom (eggs mom): Assistente/Documentazione (TUI amichevole, no sudo). Usa mom.sh e easybashgui.

Produce (eggs produce): Il regista. Usa ovary.ts e produce.ts per coordinare la creazione della ISO.

Architettura delle Classi:

Ovary (ovary.ts): È il "God Object" che detiene lo stato. La logica è modulare e delegata ai file in src/classes/ovary.d/ (es. fertilization, makeSquashfs).

Incubator (incubator.ts): Non crea la ISO, ma configura l'installer (Calamares/Krill) specifico per la distro (tramite factory pattern: Noble, Alpine, Arch, ecc.), assicurando che l'uovo sia installabile.

Flusso: Dad prepara -> Produce chiama Incubator (configura installer) -> Produce chiama Ovary (crea filesystem e ISO).

Ora che hai questo contesto, ecco il codice su cui voglio lavorare oggi..."