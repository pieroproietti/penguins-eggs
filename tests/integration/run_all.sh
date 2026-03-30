#!/bin/sh
# Run all ILF integration tests.
# Requires root, a BTRFS-capable kernel, and loopback device support.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PASS=0
FAIL=0

run_suite() {
    name="$1"
    script="$SCRIPT_DIR/$2"
    echo "==> $name"
    if sh "$script"; then
        PASS=$((PASS + 1))
        echo "    PASS"
    else
        FAIL=$((FAIL + 1))
        echo "    FAIL"
    fi
}

run_suite "HAL registration"     "test_hal.sh"
run_suite "Config loading"       "test_config.sh"
run_suite "Snapshot lifecycle"   "test_snapshot.sh"
run_suite "Mutable toggle"       "test_mutable.sh"
run_suite "ashos adapter"        "test_backend_ashos.sh"
run_suite "frzr adapter"         "test_backend_frzr.sh"
run_suite "akshara adapter"      "test_backend_akshara.sh"
run_suite "btrfs-dwarfs adapter" "test_backend_btrfs_dwarfs.sh"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
