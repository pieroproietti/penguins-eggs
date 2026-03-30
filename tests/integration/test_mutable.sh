#!/bin/sh
# Test: all three immutability toggle methods (chattr, overlayfs, bind-remount).
# Requires: root, util-linux, btrfs-progs, e2fsprogs (chattr)
. "$(dirname "$0")/lib.sh"

require_root
require_cmd chattr mount umount

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"; ilf mutable exit 2>/dev/null || true' EXIT

# ── Method 1: bind-remount ────────────────────────────────────────────────────
# Create a small ext4 image, mount it read-only, toggle to rw and back.
img="$TMPDIR/bind.img"
mnt="$TMPDIR/bind-mnt"
mkdir -p "$mnt"
dd if=/dev/zero of="$img" bs=1M count=16 2>/dev/null
mkfs.ext4 -q "$img"
dev="$(losetup --find --show "$img")"
mount -o ro "$dev" "$mnt"

assert_readonly "bind: initially read-only" "$mnt"

mount -o remount,rw "$mnt"
assert_writable "bind: writable after remount,rw" "$mnt"

mount -o remount,ro "$mnt"
assert_readonly "bind: read-only after remount,ro" "$mnt"

umount "$mnt"
losetup -d "$dev"
rm -f "$img"

# ── Method 2: overlayfs ───────────────────────────────────────────────────────
require_cmd mount  # overlayfs is a kernel module; check it's available
modprobe overlay 2>/dev/null || true

lower="$TMPDIR/overlay-lower"
upper="$TMPDIR/overlay-upper"
work="$TMPDIR/overlay-work"
merged="$TMPDIR/overlay-merged"
mkdir -p "$lower" "$upper" "$work" "$merged"

# Put a sentinel file in the lower layer
echo "original" > "$lower/sentinel.txt"

mount -t overlay overlay \
    -o "lowerdir=$lower,upperdir=$upper,workdir=$work" \
    "$merged"

# Reads should see the lower layer
assert_file_exists "overlay: lower layer visible" "$merged/sentinel.txt"

# Writes should land in upper (copy-up)
echo "modified" > "$merged/sentinel.txt"
if grep -q "modified" "$upper/sentinel.txt" 2>/dev/null; then
    pass "overlay: write copy-up landed in upper layer"
else
    fail "overlay: write did not copy-up to upper layer"
fi

# Lower layer is unchanged
if grep -q "original" "$lower/sentinel.txt"; then
    pass "overlay: lower layer unchanged after write"
else
    fail "overlay: lower layer was modified"
fi

umount "$merged"

# ── Method 3: chattr +i / -i ─────────────────────────────────────────────────
# chattr only works on real filesystems (not tmpfs); use a loopback ext4.
img2="$TMPDIR/chattr.img"
mnt2="$TMPDIR/chattr-mnt"
mkdir -p "$mnt2"
dd if=/dev/zero of="$img2" bs=1M count=16 2>/dev/null
mkfs.ext4 -q "$img2"
dev2="$(losetup --find --show "$img2")"
mount "$dev2" "$mnt2"

testfile="$mnt2/immutable.txt"
echo "data" > "$testfile"

# Apply immutable flag
chattr +i "$testfile"
if rm -f "$testfile" 2>/dev/null; then
    fail "chattr: file was deletable with +i flag set"
else
    pass "chattr: file protected by +i flag"
fi

# Remove immutable flag
chattr -i "$testfile"
if rm -f "$testfile" 2>/dev/null; then
    pass "chattr: file deletable after -i flag removed"
else
    fail "chattr: file still protected after -i flag removed"
fi

umount "$mnt2"
losetup -d "$dev2"
rm -f "$img2"

# ── Method 4: lock file lifecycle (no real mount needed) ─────────────────────
# Verify ilf mutable exit returns an error when no session is active.
if ilf mutable exit 2>&1 | grep -qi "no active session\|not found\|error"; then
    pass "mutable exit: correct error when no session active"
else
    fail "mutable exit: did not report error for missing session"
fi
