#!/usr/bin/env bash
# Wrapper for Claude Code hooks.
# Usage:
#   hook-runner.sh <hook-name> [--help]
#   hook-runner.sh --list
#   hook-runner.sh --help
set -euo pipefail

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "${1:-}" in
  ""|--help|-h)
    cat <<'EOF'
hook-runner.sh — Claude Code hook dispatcher

Usage:
  hook-runner.sh <hook-name> [--help]    Run a specific hook
  hook-runner.sh --list                  List all available hooks
  hook-runner.sh --help                  Show this help

Environment:
  EDITOR_BYPASS=1            Bypass output gate (Hook 2)
  OPUS_GUARD_DISABLED=1      Bypass Mandatory Opus (Hook 3)

Docs: .claude/hooks/README.md
EOF
    exit 0
    ;;
  --list)
    for f in "${HOOKS_DIR}"/*.ts "${HOOKS_DIR}"/*.mjs; do
      [ -e "$f" ] || continue
      base=$(basename "$f")
      base="${base%.ts}"
      base="${base%.mjs}"
      desc=$(grep -m1 "^// DESCRIPTION:" "$f" 2>/dev/null | sed 's|^// DESCRIPTION: ||' || echo "")
      printf '%-30s %s\n' "$base" "$desc"
    done
    exit 0
    ;;
esac

HOOK_NAME="$1"
shift

# Find compiled hook
HOOK_TS="${HOOKS_DIR}/${HOOK_NAME}.ts"
HOOK_MJS="${HOOKS_DIR}/${HOOK_NAME}.mjs"
HOOK_JS="${HOOKS_DIR}/dist/${HOOK_NAME}.js"

# BR2 1.1 fix: only emit banner under HOOK_DEBUG=1; structured signal already names hook.
if [ -f "$HOOK_MJS" ]; then
  if [ "${HOOK_DEBUG:-}" = "1" ]; then
    HOOK_DESC=$(grep -m1 "^// DESCRIPTION:" "$HOOK_MJS" 2>/dev/null | sed 's|^// DESCRIPTION: ||' || echo "$HOOK_NAME")
    echo "[${HOOK_NAME}] ${HOOK_DESC}" >&2
  fi
  exec node "$HOOK_MJS" "$@"
elif [ -f "$HOOK_JS" ]; then
  if [ "${HOOK_DEBUG:-}" = "1" ]; then
    HOOK_DESC=$(grep -m1 "^// DESCRIPTION:" "$HOOK_TS" 2>/dev/null | sed 's|^// DESCRIPTION: ||' || echo "$HOOK_NAME")
    echo "[${HOOK_NAME}] ${HOOK_DESC}" >&2
  fi
  exec node "$HOOK_JS" "$@"
else
  echo "[hook-runner] error: hook not found: ${HOOK_NAME}" >&2
  echo "[hook-runner] tried: ${HOOK_MJS}, ${HOOK_JS}" >&2
  echo "[hook-runner] run: hook-runner.sh --list" >&2
  exit 1
fi
