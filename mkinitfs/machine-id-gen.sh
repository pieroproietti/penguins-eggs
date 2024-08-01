#!/bin/bash
MACHINE_ID=$(uuidgen)
echo "$MACHINE_ID" | tee /etc/machine-id
