#!/bin/bash
# integration/eggs-ai/recovery-advisor.sh
#
# AI-assisted recovery advisor for penguins-recovery environments.
#
# Calls the eggs-ai HTTP API (http://127.0.0.1:3737) if it is reachable,
# then presents the AI's diagnosis or answer in the terminal.
#
# Designed to be invoked from the recovery launcher or directly from a
# recovery shell. Works without Node.js — only requires curl or wget.
#
# Usage:
#   recovery-advisor.sh doctor [complaint]
#   recovery-advisor.sh ask <question>
#   recovery-advisor.sh status
#
# Examples:
#   recovery-advisor.sh doctor "system won't boot after update"
#   recovery-advisor.sh ask "how do I reset my GRUB bootloader?"
#   recovery-advisor.sh status

set -euo pipefail

EGGS_AI_URL="${EGGS_AI_URL:-http://127.0.0.1:3737}"
SESSION_ID="recovery-$$"

# ── helpers ──────────────────────────────────────────────────────────────────

die() { echo "[recovery-advisor] ERROR: $*" >&2; exit 1; }

# Prefer curl; fall back to wget.
_post() {
    local path="$1" body="$2"
    if command -v curl &>/dev/null; then
        curl -sf -X POST \
            -H "Content-Type: application/json" \
            -H "X-Session-Id: ${SESSION_ID}" \
            --max-time 120 \
            -d "$body" \
            "${EGGS_AI_URL}${path}"
    elif command -v wget &>/dev/null; then
        wget -qO- \
            --header="Content-Type: application/json" \
            --header="X-Session-Id: ${SESSION_ID}" \
            --timeout=120 \
            --post-data="$body" \
            "${EGGS_AI_URL}${path}"
    else
        die "Neither curl nor wget found. Cannot reach eggs-ai."
    fi
}

_get() {
    local path="$1"
    if command -v curl &>/dev/null; then
        curl -sf --max-time 10 "${EGGS_AI_URL}${path}"
    elif command -v wget &>/dev/null; then
        wget -qO- --timeout=10 "${EGGS_AI_URL}${path}"
    else
        die "Neither curl nor wget found."
    fi
}

# Check eggs-ai is reachable before making substantive calls.
check_health() {
    local health
    health=$(_get /api/health 2>/dev/null) || return 1
    echo "$health" | grep -q '"ok"'
}

# Extract the "result" field from a JSON response.
extract_result() {
    # Use python3 if available for reliable JSON parsing; fall back to grep/sed.
    if command -v python3 &>/dev/null; then
        python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',''))"
    else
        grep -o '"result":"[^"]*"' | sed 's/"result":"//;s/"$//'
    fi
}

# ── commands ─────────────────────────────────────────────────────────────────

cmd_doctor() {
    local complaint="${1:-}"
    local body
    if [[ -n "$complaint" ]]; then
        body="{\"complaint\": $(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$complaint" 2>/dev/null || echo "\"${complaint}\"")}"
    else
        body="{}"
    fi

    echo "[recovery-advisor] Running AI diagnostics..."
    echo ""
    _post /api/doctor "$body" | extract_result
    echo ""
}

cmd_ask() {
    local question="${1:-}"
    [[ -z "$question" ]] && die "Usage: recovery-advisor.sh ask <question>"

    local body
    body="{\"question\": $(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$question" 2>/dev/null || echo "\"${question}\"")}"

    echo "[recovery-advisor] Asking eggs-ai..."
    echo ""
    _post /api/ask "$body" | extract_result
    echo ""
}

cmd_status() {
    echo "[recovery-advisor] eggs-ai status:"
    _get /api/status | python3 -m json.tool 2>/dev/null || _get /api/status
    echo ""
}

# ── main ─────────────────────────────────────────────────────────────────────

COMMAND="${1:-doctor}"
shift || true

if ! check_health; then
    echo "[recovery-advisor] eggs-ai is not running at ${EGGS_AI_URL}."
    echo "  Start it with: eggs-ai serve"
    echo "  Or set EGGS_AI_URL to point to a running instance."
    exit 1
fi

case "$COMMAND" in
    doctor)  cmd_doctor "$@" ;;
    ask)     cmd_ask "$@" ;;
    status)  cmd_status ;;
    *)       die "Unknown command: ${COMMAND}. Use: doctor, ask, status" ;;
esac
