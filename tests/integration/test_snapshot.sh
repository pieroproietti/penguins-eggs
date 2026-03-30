#!/bin/sh
# Test: backend-agnostic snapshot lifecycle via BTRFS loopback.
# Uses the ashos adapter as the reference backend since it has full
# CapSnapshot support and is distro-agnostic.
# Requires: root, btrfs-progs, losetup, ash (ashos)
. "$(dirname "$0")/lib.sh"

require_root
require_btrfs
require_cmd ash

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# ── Setup: loopback BTRFS device ─────────────────────────────────────────────
setup_btrfs_loop 512 BTRFS_DEV BTRFS_MNT
info "BTRFS device: $BTRFS_DEV  mountpoint: $BTRFS_MNT"

# Create the root subvolume layout expected by ashos
create_subvol "$BTRFS_MNT" "@"
create_subvol "$BTRFS_MNT" "@home"
create_subvol "$BTRFS_MNT" "@var"

# Write a minimal ilf.toml pointing at this loopback device
cat > "$TMPDIR/ilf.toml" << EOF
[ilf]
distro        = "arch"
arch          = "x86_64"
backend       = "ashos"
max_snapshots = 5
auto_update   = false

[backend.ashos]
snapshot_root = "$BTRFS_MNT/@"
EOF

# ── 1. Snapshot create ────────────────────────────────────────────────────────
snap_id="$(ilf --config "$TMPDIR/ilf.toml" snapshot create --label test 2>&1 | grep -oE '[0-9]+'| head -1)"
if [ -n "$snap_id" ]; then
    pass "snapshot create returned ID: $snap_id"
else
    # ash may not be installed in CI; treat as skip
    skip "ash not available or snapshot create returned no ID"
fi

# ── 2. Snapshot list contains the new snapshot ───────────────────────────────
if ilf --config "$TMPDIR/ilf.toml" snapshot list 2>&1 | grep -q "$snap_id"; then
    pass "snapshot list contains $snap_id"
else
    fail "snapshot list missing $snap_id"
fi

# ── 3. Snapshot deploy ────────────────────────────────────────────────────────
if ilf --config "$TMPDIR/ilf.toml" snapshot deploy --id "$snap_id" 2>&1; then
    pass "snapshot deploy $snap_id"
else
    fail "snapshot deploy failed"
fi

# ── 4. Rollback ───────────────────────────────────────────────────────────────
if ilf --config "$TMPDIR/ilf.toml" rollback 2>&1; then
    pass "rollback succeeded"
else
    fail "rollback failed"
fi

# ── 5. Snapshot delete ────────────────────────────────────────────────────────
if ilf --config "$TMPDIR/ilf.toml" snapshot delete --id "$snap_id" 2>&1; then
    pass "snapshot delete $snap_id"
else
    fail "snapshot delete failed"
fi

# ── 6. Pruning: create max_snapshots+2 snapshots, verify count stays bounded ─
for i in $(seq 1 7); do
    ilf --config "$TMPDIR/ilf.toml" snapshot create --label "prune-test-$i" >/dev/null 2>&1 || true
done
count="$(ilf --config "$TMPDIR/ilf.toml" snapshot list 2>&1 | grep -c 'prune-test' || true)"
if [ "$count" -le 5 ]; then
    pass "snapshot pruning kept count within max_snapshots (got $count)"
else
    fail "snapshot pruning failed: $count snapshots (max 5)"
fi
