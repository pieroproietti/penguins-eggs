#!/usr/bin/env bash
set -euo pipefail

sudo apt update -y
sudo apt install squashfs-tools xorriso live-boot live-boot-initramfs-tools dosfstools mtools rsync git sudo -y

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" >/dev/null 2>&1 && pwd)"
cd "$REPO_ROOT"

chmod +x ./legacy/py_oa_tools/build_python_bundle.sh
./legacy/py_oa_tools/build_python_bundle.sh

sudo rm -f /usr/bin/coa /usr/bin/oa
sudo install -m 0755 ./py_oa_tools/dist_py/coa /usr/bin/coa
sudo install -m 0755 ./py_oa_tools/dist_py/oa /usr/bin/oa

# Smoke-test the standalone binaries.
/usr/bin/coa --help
/usr/bin/oa --help
/usr/bin/coa version
/usr/bin/coa detect

echo "[3001-py] Python CLI smoke tests passed"

# Execute a remaster using a temporary workspace to validate command flow.
WORK_PATH="/tmp/py_oa_tools_test"
sudo rm -rf "$WORK_PATH"
sudo mkdir -p "$WORK_PATH"

sudo env PATH="$PATH" /usr/bin/coa remaster --mode standard --path "$WORK_PATH" # --stop-after coa-initrd

echo "[3001-py] Remaster command executed successfully"
