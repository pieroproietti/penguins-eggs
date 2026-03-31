#!/usr/bin/env bash
# tests/test-snapshot-cli.sh
#
# Tests for penguins-recovery snapshot CLI.
# Runs without root via:
#   PENGUINS_RECOVERY_SKIP_ROOT_CHECK=1
#   PENGUINS_RECOVERY_SNAPSHOT_DIR → per-test tmpdir
#   Stub btrfs/tar injected via PATH prefix (tests/stubs/)
#
# Usage: bash tests/test-snapshot-cli.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECOVERY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CLI="${RECOVERY_ROOT}/bin/penguins-recovery"
STUBS="${SCRIPT_DIR}/stubs"

PASS=0
FAIL=0

_pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
_fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

run_test() {
    local name="$1" fn="$2"
    echo "TEST: ${name}"
    if (set +e; "${fn}"); then _pass "${name}"; else _fail "${name}"; fi
}

# ── Shared environment ────────────────────────────────────────────────────────

# Prepend stubs dir so btrfs/tar are always stub versions.
# python3 is intentionally excluded from stubs so the CLI always exercises
# the pure-bash fallback path (python3 may not be present on all systems).
export PENGUINS_RECOVERY_SKIP_ROOT_CHECK=1
export PENGUINS_RECOVERY_RESTORE_SLEEP=0

# Per-test stub dir: contains tar/btrfs symlinks
TEST_STUB_DIR="$(mktemp -d)"
trap 'rm -rf "${TEST_STUB_DIR}"' EXIT

# Point tar at the create stub by default; swap to restore stub when needed
ln -sf "${STUBS}/tar-create" "${TEST_STUB_DIR}/tar"
ln -sf "${STUBS}/btrfs"      "${TEST_STUB_DIR}/btrfs"

# Shadow python3 with a stub that always exits 127 so the CLI uses bash fallbacks.
# This makes tests environment-independent (no python3 required).
cat > "${TEST_STUB_DIR}/python3" << 'PYSTUB'
#!/usr/bin/env bash
exit 127
PYSTUB
chmod +x "${TEST_STUB_DIR}/python3"

export PATH="${TEST_STUB_DIR}:${PATH}"

# ── Helpers ───────────────────────────────────────────────────────────────────

fresh_snap_dir() { mktemp -d; }

# Run CLI with a specific snapshot dir
cli() {
    local snap_dir="$1"; shift
    PENGUINS_RECOVERY_SNAPSHOT_DIR="${snap_dir}" "${CLI}" "$@"
}

# Create a snapshot and return the snap dir (caller must rm -rf it)
setup_snapshot() {
    local label="$1"
    local d; d="$(fresh_snap_dir)"
    cli "${d}" snapshot create "${label}" >/dev/null 2>&1
    echo "${d}"
}

# ── Tests: help ───────────────────────────────────────────────────────────────

test_help() {
    local out; out=$("${CLI}" help 2>&1)
    [[ "${out}" == *"snapshot create"*  ]] &&
    [[ "${out}" == *"snapshot list"*    ]] &&
    [[ "${out}" == *"snapshot delete"*  ]] &&
    [[ "${out}" == *"snapshot restore"* ]]
}

# ── Tests: list ───────────────────────────────────────────────────────────────

test_list_empty() {
    local d; d="$(fresh_snap_dir)"
    local out; out=$(cli "${d}" snapshot list 2>&1)
    rm -rf "${d}"
    [[ "${out}" == *"no snapshots"* ]]
}

test_list_with_entries() {
    local d; d="$(fresh_snap_dir)"
    # Write a pre-populated index (compact single-object-per-line format)
    printf '%s\n' \
        '{"label":"snap-alpha","timestamp":"2025-01-01T00:00:00Z","path":"/tmp/a.tar.gz","method":"tar"}' \
        '{"label":"snap-beta","timestamp":"2025-01-02T00:00:00Z","path":"/tmp/b.tar.gz","method":"tar"}' \
        > "${d}/index.json"
    local out; out=$(cli "${d}" snapshot list 2>&1)
    rm -rf "${d}"
    [[ "${out}" == *"snap-alpha"* ]] && [[ "${out}" == *"snap-beta"* ]]
}

# ── Tests: create ─────────────────────────────────────────────────────────────

test_create_writes_index() {
    local d; d="$(fresh_snap_dir)"
    cli "${d}" snapshot create "my-snap" >/dev/null 2>&1
    local found=0
    grep -q "my-snap" "${d}/index.json" 2>/dev/null && found=1
    rm -rf "${d}"
    [[ "${found}" -eq 1 ]]
}

test_create_produces_archive() {
    local d; d="$(fresh_snap_dir)"
    cli "${d}" snapshot create "archive-snap" >/dev/null 2>&1
    local count; count=$(find "${d}" -name "*.tar.gz" | wc -l)
    rm -rf "${d}"
    [[ "${count}" -ge 1 ]]
}

test_create_label_required() {
    local d; d="$(fresh_snap_dir)"
    local rc=0
    cli "${d}" snapshot create 2>/dev/null || rc=$?
    rm -rf "${d}"
    [[ "${rc}" -ne 0 ]]
}

# ── Tests: delete ─────────────────────────────────────────────────────────────

test_delete_removes_from_index() {
    local d; d="$(setup_snapshot "del-me")"
    grep -q "del-me" "${d}/index.json" || { rm -rf "${d}"; return 1; }
    cli "${d}" snapshot delete "del-me" >/dev/null 2>&1
    local still=0
    grep -q "del-me" "${d}/index.json" 2>/dev/null && still=1
    rm -rf "${d}"
    [[ "${still}" -eq 0 ]]
}

test_delete_nonexistent_fails() {
    local d; d="$(fresh_snap_dir)"
    local rc=0
    cli "${d}" snapshot delete "no-such-label" 2>/dev/null || rc=$?
    rm -rf "${d}"
    [[ "${rc}" -ne 0 ]]
}

# ── Tests: restore ────────────────────────────────────────────────────────────

test_restore_nonexistent_fails() {
    local d; d="$(fresh_snap_dir)"
    local rc=0
    cli "${d}" snapshot restore "no-such-label" 2>/dev/null || rc=$?
    rm -rf "${d}"
    [[ "${rc}" -ne 0 ]]
}

test_restore_calls_tar_xzf() {
    # Create a snapshot with the create stub (touches a .tar.gz file)
    local d; d="$(setup_snapshot "restore-me")"
    local archive; archive=$(find "${d}" -name "*.tar.gz" | head -1)
    [[ -f "${archive}" ]] || { rm -rf "${d}"; return 1; }

    # Switch tar symlink to the restore stub
    ln -sf "${STUBS}/tar-restore" "${TEST_STUB_DIR}/tar"

    local record="${d}/restore-called"
    RESTORE_RECORD="${record}" \
      cli "${d}" snapshot restore "restore-me" >/dev/null 2>&1 || true

    # Restore tar symlink for subsequent tests
    ln -sf "${STUBS}/tar-create" "${TEST_STUB_DIR}/tar"

    local found=0
    [[ -f "${record}" ]] && found=1
    rm -rf "${d}"
    [[ "${found}" -eq 1 ]]
}

# ── Tests: error cases ────────────────────────────────────────────────────────

test_unknown_snapshot_subcommand() {
    local rc=0; "${CLI}" snapshot bogus 2>/dev/null || rc=$?
    [[ "${rc}" -ne 0 ]]
}

test_unknown_top_level_command() {
    local rc=0; "${CLI}" bogus-command 2>/dev/null || rc=$?
    [[ "${rc}" -ne 0 ]]
}

test_adapt_no_input_fails() {
    local rc=0; "${CLI}" adapt 2>/dev/null || rc=$?
    [[ "${rc}" -ne 0 ]]
}

# ── Run ───────────────────────────────────────────────────────────────────────

echo ""
echo "penguins-recovery snapshot CLI tests"
echo "====================================="

run_test "help output contains all subcommands"     test_help
run_test "snapshot list on empty dir"               test_list_empty
run_test "snapshot list shows index entries"        test_list_with_entries
run_test "snapshot create writes index entry"       test_create_writes_index
run_test "snapshot create produces archive file"    test_create_produces_archive
run_test "snapshot create requires label"           test_create_label_required
run_test "snapshot delete removes from index"       test_delete_removes_from_index
run_test "snapshot delete nonexistent fails"        test_delete_nonexistent_fails
run_test "snapshot restore nonexistent fails"       test_restore_nonexistent_fails
run_test "snapshot restore calls tar -xzf"          test_restore_calls_tar_xzf
run_test "unknown snapshot subcommand exits 1"      test_unknown_snapshot_subcommand
run_test "unknown top-level command exits 1"        test_unknown_top_level_command
run_test "adapt with no --input exits 1"            test_adapt_no_input_fails

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"
[[ "${FAIL}" -eq 0 ]]
