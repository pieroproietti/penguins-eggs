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

# Ferma il container
echo "Stopping container $CONTAINER_NAME (ID: $LATEST_CONTAINER)..."
podman stop $LATEST_CONTAINER

# Verifica se il container è stato fermato con successo
if [ $? -eq 0 ]; then
    echo "Container $CONTAINER_NAME (ID: $LATEST_CONTAINER) è stato fermato con successo."
else
    echo "Errore: Impossibile fermare il container $CONTAINER_NAME (ID: $LATEST_CONTAINER)."
    exit 1
fi
