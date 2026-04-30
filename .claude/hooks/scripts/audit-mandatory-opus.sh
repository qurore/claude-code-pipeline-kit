#!/usr/bin/env bash
# Audit all .claude/commands/*.md for Task tool invocations missing model: "opus".
# Per CLAUDE.md "Mandatory Opus Model for All Subagents".
# Run before deploying Hook 3 to ensure no in-flight skill files would be blocked.
#
# Exit codes:
#   0 = clean (0 violations)
#   1 = violations found (printed with surrounding context for manual fix)
#   2 = script error (e.g., directory not found)
#
# BR2 4.1 fix: print surrounding 5 lines of each violation so the user can fix without re-grepping.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMMANDS_DIR="${REPO_ROOT}/.claude/commands"

if [ ! -d "$COMMANDS_DIR" ]; then
  echo "audit-mandatory-opus: $COMMANDS_DIR not found" >&2
  exit 2
fi

VIOLATIONS=0
for f in "${COMMANDS_DIR}"/*.md; do
  [ -e "$f" ] || continue
  while IFS= read -r line_info; do
    [ -z "$line_info" ] && continue
    line_no=$(echo "$line_info" | cut -d: -f1)
    start=$((line_no - 3))
    [ $start -lt 1 ] && start=1
    end=$((line_no + 5))
    surround=$(sed -n "${start},${end}p" "$f")
    if ! echo "$surround" | grep -q 'model.*opus'; then
      printf '\n=== AUDIT: %s:%s ===\n' "$f" "$line_no"
      echo "  Missing: model: \"opus\""
      echo "  Context (lines $start-$end):"
      echo "$surround" | sed 's/^/  | /'
      echo "  Fix: insert 'model: \"opus\",' near line $line_no in the Task tool call."
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done < <(grep -nE 'subagent_type:\s*"[^"]+"' "$f" || true)
done

echo ""
if [ $VIOLATIONS -eq 0 ]; then
  echo "Audit passed: 0 Mandatory Opus violations across .claude/commands/*.md"
  exit 0
else
  echo "Audit found $VIOLATIONS violation(s). Fix and re-run."
  exit 1
fi
