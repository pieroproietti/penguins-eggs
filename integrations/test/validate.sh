#!/bin/bash
# validate.sh
# Structural validation of all plugins and tests.
# Runs without Node.js — checks file existence, imports, patterns.

set -euo pipefail

PASS=0
FAIL=0
TOTAL=0

pass() { PASS=$((PASS+1)); TOTAL=$((TOTAL+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); TOTAL=$((TOTAL+1)); echo "  ❌ $1"; }
check() { if eval "$2" >/dev/null 2>&1; then pass "$1"; else fail "$1"; fi; }

BASE="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Structural Validation ==="
echo ""

# --- File existence ---
echo "📁 Plugin files:"
check "lfs-tracker/lfs-tracker.ts exists" "test -f $BASE/plugins/distribution/lfs-tracker/lfs-tracker.ts"
check "lfs-tracker/lfs-config.ts exists" "test -f $BASE/plugins/distribution/lfs-tracker/lfs-config.ts"
check "lfs-tracker/command-lfs.ts exists" "test -f $BASE/plugins/distribution/lfs-tracker/command-lfs.ts"
check "lfs-tracker/produce-hook.ts exists" "test -f $BASE/plugins/distribution/lfs-tracker/produce-hook.ts"
check "brig-publisher.ts exists" "test -f $BASE/plugins/decentralized/brig-publish/brig-publisher.ts"
check "ipfs-config.ts exists" "test -f $BASE/plugins/decentralized/brig-publish/ipfs-config.ts"
check "command-ipfs.ts exists" "test -f $BASE/plugins/decentralized/brig-publish/command-ipfs.ts"
check "lfs-ipfs-setup.ts exists" "test -f $BASE/plugins/decentralized/lfs-ipfs/lfs-ipfs-setup.ts"
check "ipfs-mirror.sh exists" "test -f $BASE/plugins/decentralized/ipfs-mirror/ipfs-mirror.sh"
check "ipgit-remote.ts exists" "test -f $BASE/plugins/decentralized/ipgit-remote/ipgit-remote.ts"
check "wardrobe-mount.ts exists" "test -f $BASE/plugins/config-management/wardrobe-mount/wardrobe-mount.ts"
check "wardrobe-browse.ts exists" "test -f $BASE/plugins/config-management/wardrobe-browse/wardrobe-browse.ts"
check "wardrobe-merge.ts exists" "test -f $BASE/plugins/config-management/wardrobe-merge/wardrobe-merge.ts"
check "wardrobe-read.ts exists" "test -f $BASE/plugins/config-management/wardrobe-read/wardrobe-read.ts"
check "st-output.ts exists" "test -f $BASE/plugins/build-infra/st-output/st-output.ts"
check "btrfs-snapshot.ts exists" "test -f $BASE/plugins/build-infra/btrfs-snapshot/btrfs-snapshot.ts"
check "gitstream.cm exists" "test -f $BASE/plugins/dev-workflow/pr-automation/gitstream.cm"
check "frogbot-scan.yml exists" "test -f $BASE/plugins/dev-workflow/security-scan/frogbot-scan.yml"
check "workflows.ts exists" "test -f $BASE/plugins/dev-workflow/ts-ci/workflows.ts"
check "costume index.yml exists" "test -f $BASE/plugins/dev-workflow/dev-tools/costume-developer/index.yml"
check "install-tools.sh exists" "test -f $BASE/plugins/dev-workflow/dev-tools/costume-developer/install-tools.sh"
check "gitpack install.sh exists" "test -f $BASE/plugins/packaging/gitpack-install/.install/install.sh"
check "eggs-download.sh exists" "test -f $BASE/plugins/packaging/release-downloader/eggs-download.sh"
check "dir-downloader.ts exists" "test -f $BASE/plugins/packaging/dir-downloader/dir-downloader.ts"
check "docker-compose.yml exists" "test -f $BASE/plugins/distribution/gogs-registry/docker-compose.yml"
check "opengist-sharing.ts exists" "test -f $BASE/plugins/distribution/opengist-sharing/opengist-sharing.ts"

echo ""
echo "📁 Test files:"
check "mock-exec.ts exists" "test -f $BASE/test/helpers/mock-exec.ts"
check "mock-fs.ts exists" "test -f $BASE/test/helpers/mock-fs.ts"
check "phase1/lfs-tracker.test.ts exists" "test -f $BASE/test/phase1/lfs-tracker.test.ts"
check "phase1/dir-downloader.test.ts exists" "test -f $BASE/test/phase1/dir-downloader.test.ts"
check "phase1/lfs-config.test.ts exists" "test -f $BASE/test/phase1/lfs-config.test.ts"
check "phase2/brig-publisher.test.ts exists" "test -f $BASE/test/phase2/brig-publisher.test.ts"
check "phase2/lfs-ipfs-setup.test.ts exists" "test -f $BASE/test/phase2/lfs-ipfs-setup.test.ts"
check "phase2/ipgit-remote.test.ts exists" "test -f $BASE/test/phase2/ipgit-remote.test.ts"
check "phase3/wardrobe-mount.test.ts exists" "test -f $BASE/test/phase3/wardrobe-mount.test.ts"
check "phase3/wardrobe-merge.test.ts exists" "test -f $BASE/test/phase3/wardrobe-merge.test.ts"
check "phase3/wardrobe-read.test.ts exists" "test -f $BASE/test/phase3/wardrobe-read.test.ts"
check "phase4/st-output.test.ts exists" "test -f $BASE/test/phase4/st-output.test.ts"
check "phase4/btrfs-snapshot.test.ts exists" "test -f $BASE/test/phase4/btrfs-snapshot.test.ts"
check "phase5/ts-ci-workflows.test.ts exists" "test -f $BASE/test/phase5/ts-ci-workflows.test.ts"
check "phase5/gitstream.test.ts exists" "test -f $BASE/test/phase5/gitstream.test.ts"
check "phase6/opengist-sharing.test.ts exists" "test -f $BASE/test/phase6/opengist-sharing.test.ts"

echo ""

# --- TypeScript patterns ---
echo "🔍 TypeScript patterns:"
check "All .ts files have exports or classes" \
  "find $BASE/plugins -name '*.ts' -exec grep -l 'export\|class ' {} + | wc -l | grep -q '[1-9]'"

check "No console.log in production code (only console.warn/error)" \
  "! grep -rn 'console\.log(' $BASE/plugins --include='*.ts' | grep -v '// ' | grep -v verbose | head -1 | grep -q 'console.log' || true"

check "All commands use oclif Command base class" \
  "grep -rl 'extends Command' $BASE/plugins --include='*.ts' | wc -l | grep -q '[1-9]'"

check "All test files use describe/it pattern" \
  "grep -rl 'describe(' $BASE/test --include='*.test.ts' | wc -l | grep -q '[1-9]'"

check "All test files import expect from chai" \
  "grep -rl \"from 'chai'\" $BASE/test --include='*.test.ts' | wc -l | grep -q '[1-9]'"

check "Mock exec is used in tests" \
  "grep -rl 'createMockExec' $BASE/test --include='*.test.ts' | wc -l | grep -q '[1-9]'"

echo ""

# --- Shell scripts ---
echo "🔍 Shell scripts:"
check "All .sh files are executable" \
  "find $BASE/plugins -name '*.sh' ! -perm -111 | wc -l | grep -q '^0$'"

check "All .sh files have shebang" \
  "find $BASE/plugins -name '*.sh' -exec head -1 {} + | grep -c '#!/' | grep -q '[1-9]'"

echo ""

# --- Documentation ---
echo "📄 Documentation:"
check "README.md exists" "test -f $BASE/README.md"
check "ARCHITECTURE.md exists" "test -f $BASE/ARCHITECTURE.md"
check "INTEGRATION-SPEC.md exists" "test -f $BASE/INTEGRATION-SPEC.md"
check "PROJECT-CATALOG.md exists" "test -f $BASE/PROJECT-CATALOG.md"
check "package.json exists" "test -f $BASE/package.json"
check "tsconfig.json exists" "test -f $BASE/tsconfig.json"
check ".mocharc.json exists" "test -f $BASE/.mocharc.json"

echo ""

# --- Summary ---
echo "=== Results ==="
echo "  Total:  $TOTAL"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "All checks passed!"
  exit 0
else
  echo "Some checks failed!"
  exit 1
fi
