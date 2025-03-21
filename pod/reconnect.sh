#!/bin/bash

# Ottieni l'ID del container più recente (sia in esecuzione che fermo)
LATEST_CONTAINER=$(podman ps -a --sort created --format "{{.ID}}" | head -n 1)

# Verifica se è stato trovato un container
if [ -z "$LATEST_CONTAINER" ]; then
    echo "Errore: Nessun container trovato"
    exit 1
fi

# Ottieni il nome del container per una migliore visualizzazione
CONTAINER_NAME=$(podman ps -a --filter id=$LATEST_CONTAINER --format "{{.Names}}")
echo "Container più recente trovato: $CONTAINER_NAME (ID: $LATEST_CONTAINER)"

# Verifica se il container è in esecuzione
if podman ps --format "{{.ID}}" | grep -q "$LATEST_CONTAINER"; then
    echo "Il container è già in esecuzione. Mi connetto..."
    # Usa exec per connettersi, così se usciremo il container resterà attivo
    podman exec -it "$LATEST_CONTAINER" bash
else
    echo "Il container è fermo. Lo avvio e mi connetto..."
    # Avvia il container
    podman start "$LATEST_CONTAINER"
    
    # Verifica se l'avvio è andato a buon fine
    if [ $? -eq 0 ]; then
        echo "Container avviato con successo. Mi connetto..."
        # Usa exec per connettersi, così se usciremo il container resterà attivo
        podman exec -it "$LATEST_CONTAINER" bash
    else
        echo "Errore: Impossibile avviare il container '$LATEST_CONTAINER'"
        exit 1
    fi
fi