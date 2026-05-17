#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$SCRIPT_DIR"

PYINSTALLER=${PYINSTALLER:-pyinstaller}
PYTHON=${PYTHON:-python3}
DIST_PY=dist_py
WORK_PATH=build/pyinstaller
ADD_DATA="$SCRIPT_DIR/brain.d:py_oa_tools/brain.d"

if ! command -v "$PYINSTALLER" >/dev/null 2>&1; then
  echo "ERROR: PyInstaller not found. Install it with: python3 -m pip install pyinstaller" >&2
  exit 1
fi

rm -rf "$DIST_PY" "$WORK_PATH"
mkdir -p "$DIST_PY"

echo "Building coa standalone binary..."
"$PYINSTALLER" --onefile --distpath "$DIST_PY" --workpath "$WORK_PATH" --specpath "$WORK_PATH" --name coa --add-data "$ADD_DATA" coa.py

echo "Building oa standalone binary..."
"$PYINSTALLER" --onefile --distpath "$DIST_PY" --workpath "$WORK_PATH" --specpath "$WORK_PATH" --name oa --add-data "$ADD_DATA" oa.py

echo "Standalone binaries are available in $DIST_PY/coa and $DIST_PY/oa"
