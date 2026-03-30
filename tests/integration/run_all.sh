#!/bin/sh
# Run all ILF integration tests.
# Requires root, a BTRFS-capable kernel, and loopback device support.
# Individual suites skip gracefully when their prerequisites are absent.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PASS=0
FAIL=0
SKIP=0

run_suite() {
    name="$1"
    script="$SCRIPT_DIR/$2"
    printf "==> %s\n" "$name"
    if ! [ -f "$script" ]; then
        printf "    SKIP (script not found: %s)\n" "$2"
        SKIP=$((SKIP + 1))
        return
    fi
    set +e
    sh "$script"
    rc=$?
    set -e
    case $rc in
        0)  PASS=$((PASS + 1)) ;;
        77) SKIP=$((SKIP + 1)); printf "    SKIP\n" ;;
        *)  FAIL=$((FAIL + 1)) ;;
    esac
}

run_suite "HAL registration"       "test_hal.sh"
run_suite "Config loading"         "test_config.sh"
run_suite "Snapshot lifecycle"     "test_snapshot.sh"
run_suite "Mutable toggle"         "test_mutable.sh"
run_suite "Backend: ashos"         "test_backend_ashos.sh"
run_suite "Backend: frzr"          "test_backend_frzr.sh"
run_suite "Backend: akshara"       "test_backend_akshara.sh"
run_suite "Backend: btrfs-dwarfs"  "test_backend_btrfs_dwarfs.sh"

printf "\nResults: %d passed, %d failed, %d skipped\n" "$PASS" "$FAIL" "$SKIP"
[ "$FAIL" -eq 0 ]
