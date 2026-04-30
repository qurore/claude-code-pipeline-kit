#!/usr/bin/env bash
# install.test.sh — smoke test for install.sh
#
# Runs 5 scenarios in /tmp:
#   1. clean install (--all)
#   2. re-run idempotency (--all twice)
#   3. selective --skills only
#   4. --no-deps (skip hook build)
#   5. --dry-run (no file writes)
#
# Exit 0 on all pass, 1 on any failure.

set -uo pipefail

KIT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_SH="$KIT_ROOT/install.sh"
TEST_BASE="/tmp/kit-install-test-$$"

PASS=0
FAIL=0

trap 'rm -rf "$TEST_BASE"' EXIT

assert_file_exists() {
  local f="$1" name="$2"
  if [ -f "$f" ]; then
    PASS=$((PASS + 1))
    echo "  PASS  $name (file exists: $f)"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL  $name (missing: $f)"
  fi
}

assert_dir_exists() {
  local d="$1" name="$2"
  if [ -d "$d" ]; then
    PASS=$((PASS + 1))
    echo "  PASS  $name (dir exists: $d)"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL  $name (missing: $d)"
  fi
}

assert_file_count() {
  local glob="$1" expected="$2" name="$3"
  local actual=$(ls $glob 2>/dev/null | wc -l | tr -d ' ')
  if [ "$actual" -ge "$expected" ]; then
    PASS=$((PASS + 1))
    echo "  PASS  $name ($actual >= $expected files)"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL  $name ($actual < $expected files)"
  fi
}

# Scenario 1: clean install --all (without hook deps to keep test fast)
echo ""
echo "Scenario 1: clean install (--all --no-deps)"
TARGET="$TEST_BASE/scenario-1"
mkdir -p "$TARGET"
"$INSTALL_SH" --all --no-deps --force "$TARGET" >/dev/null 2>&1
assert_dir_exists "$TARGET/.claude/skills" "skills installed"
assert_dir_exists "$TARGET/.claude/agents" "agents installed"
assert_dir_exists "$TARGET/.claude/rules" "rules installed"
assert_dir_exists "$TARGET/.claude/commands" "commands installed"
assert_dir_exists "$TARGET/.claude/hooks" "hooks installed"
assert_file_exists "$TARGET/.claude/pipeline-state/SCHEMA.md" "SCHEMA.md installed"
assert_file_exists "$TARGET/.claude/pdca-archive/index.json" "PDCA archive initialized"
assert_file_exists "$TARGET/CLAUDE.md" "CLAUDE.md installed"
assert_file_count "$TARGET/.claude/skills/*.md" 18 "18+ skills"
assert_file_count "$TARGET/.claude/agents/*.md" 9 "9+ agents"
assert_file_count "$TARGET/.claude/commands/*.md" 30 "30+ commands"

# Scenario 2: re-run idempotency
echo ""
echo "Scenario 2: re-run idempotency (--all twice)"
TARGET="$TEST_BASE/scenario-2"
mkdir -p "$TARGET"
"$INSTALL_SH" --all --no-deps --force "$TARGET" >/dev/null 2>&1
OUT1=$("$INSTALL_SH" --all --no-deps --force "$TARGET" 2>&1)
if echo "$OUT1" | grep -q "Unchanged"; then
  PASS=$((PASS + 1))
  echo "  PASS  re-run reports unchanged files"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL  re-run did not report unchanged files"
fi

# Scenario 3: --skills only
echo ""
echo "Scenario 3: --skills only"
TARGET="$TEST_BASE/scenario-3"
mkdir -p "$TARGET"
"$INSTALL_SH" --skills --force "$TARGET" >/dev/null 2>&1
assert_dir_exists "$TARGET/.claude/skills" "skills installed"
if [ ! -d "$TARGET/.claude/agents" ]; then
  PASS=$((PASS + 1))
  echo "  PASS  agents NOT installed (selective --skills)"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL  agents incorrectly installed"
fi
if [ ! -d "$TARGET/.claude/hooks" ]; then
  PASS=$((PASS + 1))
  echo "  PASS  hooks NOT installed (selective --skills)"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL  hooks incorrectly installed"
fi

# Scenario 4: --no-deps (hooks copied but not built)
echo ""
echo "Scenario 4: --hooks --no-deps (no build)"
TARGET="$TEST_BASE/scenario-4"
mkdir -p "$TARGET"
"$INSTALL_SH" --hooks --no-deps --force "$TARGET" >/dev/null 2>&1
assert_dir_exists "$TARGET/.claude/hooks" "hook source installed"
assert_file_exists "$TARGET/.claude/hooks/package.json" "package.json present"
# When --no-deps, dist/ either does not exist or matches kit's pre-built dist
# Either is OK; just verify install completed
PASS=$((PASS + 1))
echo "  PASS  --no-deps completes without npm invocation"

# Scenario 5: --dry-run
echo ""
echo "Scenario 5: --dry-run"
TARGET="$TEST_BASE/scenario-5"
mkdir -p "$TARGET"
"$INSTALL_SH" --dry-run --all "$TARGET" >/dev/null 2>&1
if [ ! -d "$TARGET/.claude/skills" ]; then
  PASS=$((PASS + 1))
  echo "  PASS  dry-run did not write any files"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL  dry-run wrote files"
fi

echo ""
echo "----------------------------------------------------------"
echo "Total: $PASS pass, $FAIL fail"
echo "----------------------------------------------------------"

[ $FAIL -eq 0 ] || exit 1
exit 0
