#!/bin/sh
# Shared helpers for ILF integration tests.
# Source this file at the top of every test script:
#   . "$(dirname "$0")/lib.sh"
#
# Requirements: root, util-linux (losetup), btrfs-progs, mkfs.btrfs

set -e

# ── Colour output ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { printf "${GREEN}PASS${NC} %s\n" "$1"; }
fail() { printf "${RED}FAIL${NC} %s\n" "$1"; exit 1; }
skip() { printf "${YELLOW}SKIP${NC} %s\n" "$1"; exit 0; }
info() { printf "     %s\n" "$1"; }

# ── Prerequisite checks ───────────────────────────────────────────────────────

require_root() {
    [ "$(id -u)" -eq 0 ] || skip "requires root"
}

require_cmd() {
    for cmd in "$@"; do
        command -v "$cmd" >/dev/null 2>&1 || skip "requires $cmd"
    done
}

require_btrfs() {
    require_cmd losetup mkfs.btrfs btrfs
    modprobe btrfs 2>/dev/null || true
}

# ── Loopback BTRFS device helpers ─────────────────────────────────────────────

# setup_btrfs_loop <size_mb> <varname_device> <varname_mountpoint>
# Creates a loopback-backed BTRFS filesystem, mounts it, and stores the
# device path and mountpoint in the named variables.
setup_btrfs_loop() {
    _size="${1:-256}"
    _dev_var="$2"
    _mnt_var="$3"

    _img="$(mktemp /tmp/ilf-test-XXXXXX.img)"
    dd if=/dev/zero of="$_img" bs=1M count="$_size" 2>/dev/null
    _dev="$(losetup --find --show "$_img")"
    mkfs.btrfs -q "$_dev"

    _mnt="$(mktemp -d /tmp/ilf-mnt-XXXXXX)"
    mount "$_dev" "$_mnt"

    # Export via eval so callers can use named variables.
    eval "${_dev_var}='${_dev}'"
    eval "${_mnt_var}='${_mnt}'"

    # Register for cleanup.
    _ILF_LOOPS="${_ILF_LOOPS} ${_dev}:${_mnt}:${_img}"
}

# teardown_all — unmount and detach all loopback devices created by this test.
teardown_all() {
    for entry in $_ILF_LOOPS; do
        _d="${entry%%:*}"; _rest="${entry#*:}"
        _m="${_rest%%:*}"; _i="${_rest#*:}"
        umount -l "$_m" 2>/dev/null || true
        losetup -d "$_d" 2>/dev/null || true
        rm -f "$_i"
        rmdir "$_m" 2>/dev/null || true
    done
    _ILF_LOOPS=""
}

# Register teardown_all to run on EXIT so tests always clean up.
_ILF_LOOPS=""
trap teardown_all EXIT INT TERM

# ── BTRFS subvolume helpers ───────────────────────────────────────────────────

# create_subvol <mountpoint> <name>
create_subvol() {
    btrfs subvolume create "$1/$2" >/dev/null
}

# snapshot_subvol <src> <dst>
snapshot_subvol() {
    btrfs subvolume snapshot -r "$1" "$2" >/dev/null
}

# list_subvols <mountpoint>
list_subvols() {
    btrfs subvolume list "$1"
}

# ── Assertion helpers ─────────────────────────────────────────────────────────

assert_eq() {
    _label="$1"; _got="$2"; _want="$3"
    if [ "$_got" = "$_want" ]; then
        pass "$_label"
    else
        fail "$_label: got '$_got', want '$_want'"
    fi
}

assert_file_exists() {
    [ -e "$2" ] && pass "$1" || fail "$1: file not found: $2"
}

assert_dir_exists() {
    [ -d "$2" ] && pass "$1" || fail "$1: directory not found: $2"
}

assert_writable() {
    if touch "$2/.ilf-write-test" 2>/dev/null; then
        rm -f "$2/.ilf-write-test"
        pass "$1"
    else
        fail "$1: path not writable: $2"
    fi
}

assert_readonly() {
    if touch "$2/.ilf-write-test" 2>/dev/null; then
        rm -f "$2/.ilf-write-test"
        fail "$1: path is writable (expected read-only): $2"
    else
        pass "$1"
    fi
}
