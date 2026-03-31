#!/bin/bash
# ipfs-mirror.sh
# Mirror the penguins-eggs git repo to IPFS.
# Based on whyrusleeping/git-ipfs-rehost.
#
# Usage:
#   ./ipfs-mirror.sh                                    # mirror penguins-eggs
#   ./ipfs-mirror.sh https://github.com/user/repo.git   # mirror any repo
#
# Requires: git, ipfs daemon running

set -euo pipefail

REPO_URL="${1:-https://github.com/pieroproietti/penguins-eggs.git}"
REPO_NAME=$(basename "$REPO_URL" .git)
WORK_DIR="/tmp/ipfs-mirror-${REPO_NAME}"
MANIFEST_FILE="${WORK_DIR}/ipfs-manifest.json"

# Check prerequisites
check_prereqs() {
  if ! command -v ipfs >/dev/null 2>&1; then
    echo "Error: ipfs not found. Install from https://docs.ipfs.tech/install/" >&2
    exit 1
  fi

  if ! ipfs id >/dev/null 2>&1; then
    echo "Error: IPFS daemon not running. Start with: ipfs daemon" >&2
    exit 1
  fi

  if ! command -v git >/dev/null 2>&1; then
    echo "Error: git not found" >&2
    exit 1
  fi
}

# Clone or update the repo
clone_repo() {
  if [ -d "${WORK_DIR}/.git" ]; then
    echo "Updating existing clone..."
    git -C "$WORK_DIR" fetch --all --prune
    git -C "$WORK_DIR" pull --ff-only 2>/dev/null || true
  else
    echo "Cloning ${REPO_URL}..."
    rm -rf "$WORK_DIR"
    git clone --mirror "$REPO_URL" "${WORK_DIR}/.git"
    git -C "$WORK_DIR" config --bool core.bare false
    git -C "$WORK_DIR" checkout 2>/dev/null || true
  fi
}

# Add repo to IPFS
add_to_ipfs() {
  echo "Adding to IPFS..."

  # Add the entire repo directory
  local cid
  cid=$(ipfs add -r -Q --pin=true "$WORK_DIR")

  echo ""
  echo "=== IPFS Mirror Complete ==="
  echo "Repository: ${REPO_URL}"
  echo "CID:        ${cid}"
  echo "Gateway:    https://ipfs.io/ipfs/${cid}"
  echo "Local:      http://localhost:8080/ipfs/${cid}"
  echo ""

  # Save manifest
  cat > "$MANIFEST_FILE" <<EOF
{
  "repo": "${REPO_URL}",
  "cid": "${cid}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gateway": "https://ipfs.io/ipfs/${cid}"
}
EOF

  echo "Manifest saved: ${MANIFEST_FILE}"
}

# Add just the .git directory (for git clone over IPFS)
add_git_objects() {
  echo "Adding git objects to IPFS..."

  local git_cid
  git_cid=$(ipfs add -r -Q --pin=true "${WORK_DIR}/.git")

  echo ""
  echo "=== Git Objects on IPFS ==="
  echo "Git CID: ${git_cid}"
  echo ""
  echo "To clone via IPFS (with git-remote-ipfs):"
  echo "  git clone ipfs://${git_cid} ${REPO_NAME}"
}

main() {
  check_prereqs
  clone_repo
  add_to_ipfs
  add_git_objects
}

main
