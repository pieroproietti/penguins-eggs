#!/bin/bash

# This script is executed by the Node.js server.cjs via 'bash webui_createIso.sh'
# All variables set in server.cjs (like MODE) are available here as environment variables.

MODE="${MODE:-standard}"  # Default to 'standard' if not set
ISO_NAME="${ISO_NAME:-custom.iso}" # Default ISO name

echo "[INFO] Running webui_createIso.sh with MODE=$MODE"
echo "[INFO] Starting 'eggs' process..."

# Base command options for all modes
BASE_COMMAND="sudo /eggs produce" # Assuming you want a full system image

# --- LOGIC TO SELECT COMMAND BASED ON MODE ---
case "$MODE" in
    "smol")
        # Example: Add the options for a smaller image (e.g., skip caches, temp files)
        COMMAND="$BASE_COMMAND --pendrive"
        ;;
    "clone")
        # Example: Options for a full clone/backup
        COMMAND="$BASE_COMMAND --clone"
        ;;
    "standard"|*)
        # Default or standard mode
        COMMAND="$BASE_COMMAND"
        ;;
esac

# Execute the final command and stream its output to stdout/stderr.
# Node.js captures this output and sends it to the browser.

# Note: The command runs in the same console/shell session as the Node.js backend.
echo "[SYSTEM] Executing: $COMMAND"

# Execute the actual Penguins' Eggs command
eval "$COMMAND"

# Check the exit status of the eggs command
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "[ERROR] Penguins' Eggs command failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE
