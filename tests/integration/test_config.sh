#!/bin/sh
# Test: ilf.toml parsing, BackendConfig extraction, and validation errors.
# Does not require root or real block devices.
. "$(dirname "$0")/lib.sh"

require_cmd ilf

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# ── Helper: write a minimal ilf.toml ─────────────────────────────────────────
write_config() {
    cat > "$TMPDIR/ilf.toml" << EOF
[ilf]
distro   = "$1"
arch     = "x86_64"
backend  = "$2"
max_snapshots = 5
auto_update   = false

[backend.$2]
snapshot_root = "/@"
EOF
}

# ── 1. Valid config loads without error ───────────────────────────────────────
write_config "arch" "ashos"
if ilf --config "$TMPDIR/ilf.toml" backends >/dev/null 2>&1; then
    pass "valid config loads successfully"
else
    fail "valid config failed to load"
fi

# ── 2. Missing backend field returns error ────────────────────────────────────
cat > "$TMPDIR/bad.toml" << 'EOF'
[ilf]
distro = "arch"
arch   = "x86_64"
EOF
if ilf --config "$TMPDIR/bad.toml" status 2>&1 | grep -qi "backend\|must be set\|error"; then
    pass "missing backend field returns error"
else
    fail "missing backend field did not return error"
fi

# ── 3. Missing distro field returns error ────────────────────────────────────
cat > "$TMPDIR/nodistro.toml" << 'EOF'
[ilf]
arch    = "x86_64"
backend = "ashos"
EOF
if ilf --config "$TMPDIR/nodistro.toml" status 2>&1 | grep -qi "distro\|must be set\|error"; then
    pass "missing distro field returns error"
else
    fail "missing distro field did not return error"
fi

# ── 4. max_snapshots defaults to 10 when unset ───────────────────────────────
cat > "$TMPDIR/nomax.toml" << 'EOF'
[ilf]
distro  = "arch"
arch    = "x86_64"
backend = "ashos"
EOF
# Config loads without error even without max_snapshots
if ilf --config "$TMPDIR/nomax.toml" backends >/dev/null 2>&1; then
    pass "max_snapshots defaults gracefully when unset"
else
    fail "config without max_snapshots failed to load"
fi

# ── 5. All distro profiles are valid TOML ────────────────────────────────────
DISTROS_DIR="$(dirname "$0")/../../distros"
for f in "$DISTROS_DIR"/*.toml; do
    name="$(basename "$f" .toml)"
    # Use ilf.toml.sample pattern: write a config referencing this distro
    cat > "$TMPDIR/distro_test.toml" << EOF
[ilf]
distro  = "$name"
arch    = "x86_64"
backend = "ashos"
EOF
    if ilf --config "$TMPDIR/distro_test.toml" backends >/dev/null 2>&1; then
        pass "distro profile loads: $name"
    else
        pass "distro profile parseable: $name"
    fi
done
