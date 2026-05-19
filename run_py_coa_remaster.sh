#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PYTHON="${PYTHON:-python3}"
REQ_FILE="$ROOT/legacy/py_oa_tools/requirements.txt"
PACKAGE_DIR="$ROOT/legacy/py_oa_tools"

usage() {
  cat <<EOF
Usage: $(basename "$0")

Install Python dependencies for py_oa_tools and run the Python-based coa remaster using default settings.

Default behavior:
  - mode: standard
  - work path: /home/eggs

Environment:
  PYTHON     Python interpreter to use (default: python3)
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "ERROR: Python interpreter '$PYTHON' not found." >&2
  exit 1
fi

if [[ ! -f "$REQ_FILE" ]]; then
  echo "ERROR: requirements file not found: $REQ_FILE" >&2
  exit 1
fi

MODE="standard"
WORK_PATH="/home/eggs"
STOP_AFTER=""

echo "[py_coa_remaster] Using Python: $PYTHON"
echo "[py_coa_remaster] Installing dependencies from $REQ_FILE"

if [[ $EUID -eq 0 ]]; then
  "$PYTHON" -m pip install --upgrade pip
  "$PYTHON" -m pip install -r "$REQ_FILE"
else
  "$PYTHON" -m pip install --user --upgrade pip
  "$PYTHON" -m pip install --user -r "$REQ_FILE"
fi

export PYTHONPATH="$PACKAGE_DIR:${PYTHONPATH:-}"

CMD=("$PYTHON" -m py_oa_tools.coa remaster --mode "$MODE" --path "$WORK_PATH")
if [[ -n "$STOP_AFTER" ]]; then
  CMD+=(--stop-after "$STOP_AFTER")
fi

if [[ $EUID -ne 0 ]]; then
  echo "[py_coa_remaster] Executing remaster with sudo"
  sudo env PYTHONPATH="$PYTHONPATH" PATH="$PATH" "${CMD[@]}"
else
  echo "[py_coa_remaster] Executing remaster as root"
  "${CMD[@]}"
fi
