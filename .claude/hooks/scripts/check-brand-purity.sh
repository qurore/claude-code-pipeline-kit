#!/usr/bin/env bash
# check-brand-purity.sh — verify the kit is free of proprietary brand references
#
# Exits 0 if clean, 1 if any forbidden token is found outside <!-- BRAND-ALLOW --> blocks.
# Run from kit repo root: bash .claude/hooks/scripts/check-brand-purity.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

# Forbidden patterns (case-insensitive). Each is a regex.
PATTERNS=(
  "Stractal"
  "stractal"
  "Wiki-driven"
  "wiki-driven"
  "Functional-Domain Wiki"
  "Blueprint Bundle"
  "BlueprintBundle"
  "wiki_sections"
  "WikiSection"
  "Supabase"
  "supabase"
  "@stractal/"
  "Vertex AI"
  "GOOGLE_AI_MODEL"
  "model-factory"
  "gemini-3"
  "PRODUCTION_DATABASE_URL"
  "apps/web/"
  "qurore/stractal"
)

# Files to scan: only the kit-shipped tree
SCAN_PATHS=(
  "CLAUDE.md"
  "README.md"
  "install.sh"
  "package.json"
  ".gitignore"
  ".claude/skills"
  ".claude/agents"
  ".claude/rules"
  ".claude/commands"
  ".claude/hooks"
  ".claude/pipeline-state/SCHEMA.md"
  ".claude/pdca-archive/instincts.md"
  ".claude/settings.example.json"
  "docs"
)

# Skip these paths/extensions even when within scan paths
SKIP_PATHS_REGEX="(node_modules|coverage|dist/|package-lock\.json|\.gitkeep$|index\.json$)"

VIOLATIONS=0
TOTAL_HITS=0

echo "Brand-purity check: scanning kit tree for proprietary references..."
echo ""

for pattern in "${PATTERNS[@]}"; do
  hits=$(
    for path in "${SCAN_PATHS[@]}"; do
      [ -e "$path" ] || continue
      if [ -d "$path" ]; then
        grep -rln -E "$pattern" "$path" 2>/dev/null || true
      else
        grep -ln -E "$pattern" "$path" 2>/dev/null || true
      fi
    done | sort -u | grep -vE "$SKIP_PATHS_REGEX" || true
  )

  if [ -n "$hits" ]; then
    real_hits=""
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      raw=$(awk -v pat="$pattern" '
        /<!-- BRAND-ALLOW -->/ { in_allow=1; next }
        /<!-- \/BRAND-ALLOW -->/ { in_allow=0; next }
        !in_allow && tolower($0) ~ tolower(pat) { print FILENAME ":" NR ": " $0 }
      ' "$f" 2>/dev/null || true)
      if [ -n "$raw" ]; then
        real_hits+="$raw"$'\n'
      fi
    done <<< "$hits"

    if [ -n "${real_hits// /}" ]; then
      VIOLATIONS=$((VIOLATIONS + 1))
      count=$(echo -n "$real_hits" | grep -c . || true)
      TOTAL_HITS=$((TOTAL_HITS + count))
      echo "FAIL  pattern=\"$pattern\"  ($count hits)"
      echo "$real_hits" | head -3 | sed 's|^|      |'
      echo ""
    fi
  fi
done

echo "----------------------------------------------------------"
if [ $VIOLATIONS -eq 0 ]; then
  echo "  PASS  Brand-purity gate clean (0 patterns matched)"
  echo "----------------------------------------------------------"
  exit 0
else
  echo "  FAIL  Brand-purity gate: $VIOLATIONS pattern(s), $TOTAL_HITS total hits"
  echo "  Fix all hits, or wrap legitimate uses in <!-- BRAND-ALLOW --> ... <!-- /BRAND-ALLOW -->"
  echo "----------------------------------------------------------"
  exit 1
fi
