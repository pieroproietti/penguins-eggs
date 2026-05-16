#!/usr/bin/env bash
set -euo pipefail

sudo apt update -y
sudo apt install squashfs-tools xorriso live-boot live-boot-initramfs-tools dosfstools mtools rsync git sudo -y

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" >/dev/null 2>&1 && pwd)"
cd "$REPO_ROOT"

PYTHON="python3"

if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "ERROR: $PYTHON not found" >&2
  exit 1
fi

# Install Python dependencies and the local py_oa_tools package in editable mode.
"$PYTHON" -m pip install --upgrade pip
"$PYTHON" -m pip install -r py_oa_tools/requirements.txt
"$PYTHON" -m pip install -e py_oa_tools

# Smoke-test the Python replacement CLI.
"$PYTHON" -m py_oa_tools.coa --help
"$PYTHON" -m py_oa_tools.oa --help
"$PYTHON" -m py_oa_tools.coa version
"$PYTHON" -m py_oa_tools.coa detect

echo "[3001-py] Python CLI smoke tests passed"

# Execute a remaster using a temporary workspace to validate command flow.
WORK_PATH="/tmp/py_oa_tools_test"
sudo rm -rf "$WORK_PATH"
sudo mkdir -p "$WORK_PATH"

# Ensure root has the same package/dependency visibility for the sudoed remaster run.
sudo env PYTHONPATH="$REPO_ROOT/py_oa_tools" PATH="$PATH" "$PYTHON" -m pip install -r py_oa_tools/requirements.txt
sudo env PYTHONPATH="$REPO_ROOT/py_oa_tools" PATH="$PATH" "$PYTHON" -m pip install -e py_oa_tools

sudo env PYTHONPATH="$REPO_ROOT/py_oa_tools" PATH="$PATH" "$PYTHON" -m py_oa_tools.coa remaster --mode standard --path "$WORK_PATH" --stop-after coa-initrd

echo "[3001-py] Remaster command executed successfully"
