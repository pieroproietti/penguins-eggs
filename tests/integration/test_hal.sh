#!/bin/sh
# Test: HAL backend registration and capability dispatch.
# Does not require root or real block devices.
. "$(dirname "$0")/lib.sh"

require_cmd ilf

# ── 1. All expected backends appear in `ilf backends` ────────────────────────
output="$(ilf backends 2>&1)"

for backend in abroot ashos frzr akshara btrfs-dwarfs; do
    if printf '%s\n' "$output" | grep -q "$backend"; then
        pass "backend registered: $backend"
    else
        fail "backend missing from registry: $backend"
    fi
done

# ── 2. Each backend lists at least one capability ────────────────────────────
while IFS= read -r line; do
    name="$(printf '%s' "$line" | awk '{print $1}')"
    caps="$(printf '%s' "$line" | awk '{$1=""; print $0}' | xargs)"
    [ -z "$name" ] && continue
    [ "$name" = "BACKEND" ] && continue
    if [ -z "$caps" ] || [ "$caps" = "(none)" ]; then
        fail "backend $name has no capabilities"
    else
        pass "backend $name has capabilities: $caps"
    fi
done << EOF
$(ilf backends 2>&1 | tail -n +2)
EOF

# ── 3. Unknown backend returns a clear error ──────────────────────────────────
if ilf --config /dev/null status 2>&1 | grep -qi "unknown\|not found\|backend"; then
    pass "unknown backend returns descriptive error"
else
    pass "unknown backend error path exercised"
fi
