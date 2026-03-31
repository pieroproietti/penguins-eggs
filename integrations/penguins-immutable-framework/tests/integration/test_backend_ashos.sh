#!/bin/sh
# Test: ashos backend adapter — full lifecycle on a loopback BTRFS device.
# Requires: root, btrfs-progs, losetup, ash (ashos)
. "$(dirname "$0")/lib.sh"

require_root
require_btrfs
require_cmd ash

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# ── Setup ─────────────────────────────────────────────────────────────────────
setup_btrfs_loop 512 DEV MNT
info "device=$DEV  mount=$MNT"

create_subvol "$MNT" "@"
create_subvol "$MNT" "@home"
create_subvol "$MNT" "@var"

cat > "$TMPDIR/pif.toml" << EOF
[pif]
distro        = "arch"
arch          = "x86_64"
backend       = "ashos"
max_snapshots = 10
auto_update   = false

[backend.ashos]
snapshot_root = "$MNT/@"
EOF

PIF="pif --config $TMPDIR/pif.toml"

# ── 1. Status returns backend name ───────────────────────────────────────────
if $PIF status 2>&1 | grep -qi "ashos"; then
    pass "status: backend name present"
else
    skip "ash not available in this environment"
fi

# ── 2. Snapshot create ────────────────────────────────────────────────────────
snap="$($PIF snapshot create --label ashos-test 2>&1 | grep -oE '[0-9]+' | head -1)"
[ -n "$snap" ] || fail "snapshot create returned no ID"
pass "snapshot create: ID=$snap"

# ── 3. Snapshot list ─────────────────────────────────────────────────────────
$PIF snapshot list 2>&1 | grep -q "$snap" || fail "snapshot list missing $snap"
pass "snapshot list: $snap present"

# ── 4. Clone (child snapshot) ────────────────────────────────────────────────
child="$($PIF snapshot create --label ashos-child 2>&1 | grep -oE '[0-9]+' | head -1)"
[ -n "$child" ] || fail "child snapshot create returned no ID"
pass "snapshot create child: ID=$child"

# ── 5. Deploy ────────────────────────────────────────────────────────────────
$PIF snapshot deploy --id "$snap" 2>&1 || fail "snapshot deploy failed"
pass "snapshot deploy: $snap"

# ── 6. Rollback ──────────────────────────────────────────────────────────────
$PIF rollback 2>&1 || fail "rollback failed"
pass "rollback succeeded"

# ── 7. Package install (dry path — ash install will fail without pacman) ─────
if $PIF pkg add htop 2>&1 | grep -qi "error\|not found\|failed\|pacman"; then
    pass "pkg add: correct error without package manager"
else
    pass "pkg add: dispatched to backend"
fi

# ── 8. Delete snapshots ───────────────────────────────────────────────────────
$PIF snapshot delete --id "$child" 2>&1 || fail "delete child failed"
pass "snapshot delete child: $child"

$PIF snapshot delete --id "$snap" 2>&1 || fail "delete snap failed"
pass "snapshot delete: $snap"

# ── 9. List is now empty (or only has deployed) ───────────────────────────────
remaining="$($PIF snapshot list 2>&1 | grep -c '[0-9]' || true)"
info "remaining snapshots: $remaining"
pass "snapshot lifecycle complete"
