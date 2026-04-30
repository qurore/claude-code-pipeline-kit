#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  Claude Code Pipeline Kit — Installer (v2.0.0)
#  Installs governance skills, hooks, agents, rules into your
#  project's .claude/ directory.
# ============================================================

VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIT_CLAUDE_DIR="$SCRIPT_DIR/.claude"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
  echo ""
  echo -e "${CYAN}${BOLD}  Claude Code Pipeline Kit v${VERSION}${NC}"
  echo -e "${CYAN}  Structured engineering pipelines${NC}"
  echo ""
}

print_help() {
  print_banner
  cat <<HELPEOF
Usage: ./install.sh [OPTIONS] [TARGET_DIR]

Arguments:
  TARGET_DIR              Project directory (default: current dir)

Selective install (component-level):
  --skills                Install .claude/skills/ (18 procedural workflow guides)
  --agents                Install .claude/agents/ (9 persona reference cards)
  --rules                 Install .claude/rules/ (2 coding standards files)
  --hooks                 Install .claude/hooks/ (9 deterministic hooks)
  --commands              Install .claude/commands/ (40 pipeline + utility skills)
  --state                 Install .claude/pipeline-state/SCHEMA.md

Per-pipeline install (commands-only subsets):
  --se                    Install only SE Pipeline command files
  --eiw                   Install only EIW command files
  --drw                   Install only DRW (defect-fix) command file
  --pdca                  Install only PDCA command files

Options:
  --all                   Install everything (skills + agents + rules + hooks +
                          commands + state + CLAUDE.md + pdca-archive)
  --claude-md             Also copy CLAUDE.md governance template
  --pdca-archive          Also initialize .claude/pdca-archive/
  --no-deps               Skip hook npm install + build (component install only)
  --dry-run               Show what would be installed without copying
  --force                 Overwrite existing files without prompting
  --list                  List all available components and exit
  -h, --help              Show this help message

Examples:
  bash install.sh --all                  # Full install (recommended)
  bash install.sh --all --no-deps        # Install everything but skip hook build
  bash install.sh --hooks --rules        # Install only hooks + rules
  bash install.sh --se                   # Install only SE pipeline command files
  bash install.sh --dry-run --all        # Preview without writing files


Examples:
  ./install.sh /path/to/project           # Install all (default)
  ./install.sh --skills --agents .        # Install skills + agents only
  ./install.sh --hooks --no-deps .        # Copy hook source, skip build
  ./install.sh --se --commands .          # Install SE pipeline commands only
  ./install.sh --dry-run /tmp/test        # Preview installation
HELPEOF
}

list_components() {
  print_banner
  echo -e "${BOLD}Available components:${NC}"
  echo ""
  echo -e "  ${CYAN}.claude/skills/${NC}    18 procedural workflow guides"
  echo -e "  ${CYAN}.claude/agents/${NC}    9 persona reference cards"
  echo -e "  ${CYAN}.claude/rules/${NC}     2 coding standards files"
  echo -e "  ${CYAN}.claude/hooks/${NC}     9 deterministic hooks (TS, compiled)"
  echo -e "  ${CYAN}.claude/commands/${NC}  40 pipeline + utility skill files"
  echo -e "  ${CYAN}.claude/pipeline-state/SCHEMA.md${NC}  Run-state schema reference"
  echo ""
  echo -e "  ${BOLD}Pipelines (subsets of commands/):${NC}"
  echo -e "    ${CYAN}SE Pipeline${NC} (12 files): se-0..se-9, se-5-5/7-5 BR, se-pipeline, se-step-a"
  echo -e "    ${CYAN}EIW${NC} (10 files): eiw-stage0..eiw-stage7, eiw-bar-raiser, eiw-review"
  echo -e "    ${CYAN}DRW${NC} (2 files): defect-fix, drw-bar-raiser"
  echo -e "    ${CYAN}PDCA${NC} (5 files): pdca-cycle, pdca-1..pdca-4"
  echo -e "    ${CYAN}Bar Raiser shared${NC} (1 file): bar-raiser-protocol"
  echo -e "    ${CYAN}Utilities${NC} (10 files): plan, verify, quality-gate, refactor-clean, test-coverage, checkpoint, learn, abort-pipeline"
  echo ""
}

# ----- Argument parsing -----
TARGET_DIR=""
INSTALL_SKILLS=false
INSTALL_AGENTS=false
INSTALL_RULES=false
INSTALL_HOOKS=false
INSTALL_COMMANDS=false
INSTALL_STATE=false
INSTALL_SE=false
INSTALL_EIW=false
INSTALL_DRW=false
INSTALL_PDCA=false
INSTALL_ALL=true
INSTALL_CLAUDE_MD=false
INSTALL_PDCA_ARCHIVE=false
NO_DEPS=false
DRY_RUN=false
FORCE=false
SPECIFIC_SET=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --all) INSTALL_ALL=true; shift ;;
    --skills) INSTALL_SKILLS=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --agents) INSTALL_AGENTS=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --rules) INSTALL_RULES=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --hooks) INSTALL_HOOKS=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --commands) INSTALL_COMMANDS=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --state) INSTALL_STATE=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --se) INSTALL_SE=true; INSTALL_COMMANDS=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --eiw) INSTALL_EIW=true; INSTALL_COMMANDS=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --drw) INSTALL_DRW=true; INSTALL_COMMANDS=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --pdca) INSTALL_PDCA=true; INSTALL_COMMANDS=true; INSTALL_ALL=false; SPECIFIC_SET=true; shift ;;
    --qa)
      echo -e "${YELLOW}Note:${NC} --qa is deprecated; QA-only commands omitted from kit v2.0.0+"
      shift ;;
    --ui)
      echo -e "${YELLOW}Note:${NC} --ui is deprecated; UI-only commands omitted from kit v2.0.0+"
      shift ;;
    --pipelines)
      INSTALL_SE=true; INSTALL_EIW=true; INSTALL_DRW=true; INSTALL_PDCA=true
      INSTALL_COMMANDS=true; INSTALL_ALL=false; SPECIFIC_SET=true
      shift ;;
    --claude-md) INSTALL_CLAUDE_MD=true; shift ;;
    --pdca-archive) INSTALL_PDCA_ARCHIVE=true; shift ;;
    --no-deps) NO_DEPS=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --force) FORCE=true; shift ;;
    --list) list_components; exit 0 ;;
    -h|--help) print_help; exit 0 ;;
    -*) echo -e "${RED}Unknown option: $1${NC}"; echo "Run './install.sh --help' for usage."; exit 1 ;;
    *) TARGET_DIR="$1"; shift ;;
  esac
done

if [[ -z "$TARGET_DIR" ]]; then
  TARGET_DIR="$(pwd)"
fi
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
  echo -e "${RED}Error: Directory '$TARGET_DIR' does not exist.${NC}"; exit 1;
}

# If --all, enable everything
if [[ "$INSTALL_ALL" == true ]]; then
  INSTALL_SKILLS=true
  INSTALL_AGENTS=true
  INSTALL_RULES=true
  INSTALL_HOOKS=true
  INSTALL_COMMANDS=true
  INSTALL_STATE=true
  INSTALL_CLAUDE_MD=true
  INSTALL_PDCA_ARCHIVE=true
  # All sub-pipelines enabled when commands enabled (no filter)
fi

# When --commands was passed without sub-pipeline filters → install all command files
if [[ "$INSTALL_COMMANDS" == true && "$INSTALL_SE" != true && "$INSTALL_EIW" != true && "$INSTALL_DRW" != true && "$INSTALL_PDCA" != true ]]; then
  INSTALL_SE=true; INSTALL_EIW=true; INSTALL_DRW=true; INSTALL_PDCA=true
fi

print_banner
echo -e "Target: ${BOLD}$TARGET_DIR${NC}"
echo ""

# ----- Helper: idempotent file copy -----
INSTALLED=0; SKIPPED=0; UNCHANGED=0

copy_file_idempotent() {
  local src="$1" dest="$2" relative_label="$3"
  if [[ ! -f "$src" ]]; then
    echo -e "  ${RED}MISSING${NC}  $relative_label (source not found)"
    return
  fi
  if [[ "$DRY_RUN" == true ]]; then
    if [[ -f "$dest" ]] && cmp -s "$src" "$dest"; then
      echo -e "  ${CYAN}NOOP${NC}     $relative_label (identical)"
    else
      echo -e "  ${CYAN}WOULD${NC}    $relative_label"
    fi
    return
  fi
  if [[ -f "$dest" ]] && cmp -s "$src" "$dest"; then
    UNCHANGED=$((UNCHANGED + 1))
    return
  fi
  if [[ -f "$dest" && "$FORCE" != true ]]; then
    echo -e "  ${YELLOW}EXISTS${NC}   $relative_label (use --force to overwrite)"
    SKIPPED=$((SKIPPED + 1))
    return
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  echo -e "  ${GREEN}INSTALL${NC}  $relative_label"
  INSTALLED=$((INSTALLED + 1))
}

copy_dir_idempotent() {
  local src_dir="$1" dest_dir="$2" label="$3"
  [ -d "$src_dir" ] || { echo -e "  ${RED}MISSING${NC}  $label (source dir not found)"; return; }
  for f in "$src_dir"/*; do
    [ -e "$f" ] || continue
    if [ -d "$f" ]; then
      copy_dir_idempotent "$f" "$dest_dir/$(basename "$f")" "$label/$(basename "$f")"
    else
      copy_file_idempotent "$f" "$dest_dir/$(basename "$f")" "$label/$(basename "$f")"
    fi
  done
}

# ----- Skills -----
if [[ "$INSTALL_SKILLS" == true ]]; then
  echo -e "${BOLD}.claude/skills/${NC}"
  copy_dir_idempotent "$KIT_CLAUDE_DIR/skills" "$TARGET_DIR/.claude/skills" ".claude/skills"
  echo ""
fi

# ----- Agents -----
if [[ "$INSTALL_AGENTS" == true ]]; then
  echo -e "${BOLD}.claude/agents/${NC}"
  copy_dir_idempotent "$KIT_CLAUDE_DIR/agents" "$TARGET_DIR/.claude/agents" ".claude/agents"
  echo ""
fi

# ----- Rules -----
if [[ "$INSTALL_RULES" == true ]]; then
  echo -e "${BOLD}.claude/rules/${NC}"
  copy_dir_idempotent "$KIT_CLAUDE_DIR/rules" "$TARGET_DIR/.claude/rules" ".claude/rules"
  echo ""
fi

# ----- Commands -----
COMMAND_FILES=()
if [[ "$INSTALL_SE" == true ]]; then
  COMMAND_FILES+=(
    se-pipeline.md se-0-codebase-exploration.md se-1-prompt-analysis.md
    se-2-prompt-requirements.md se-3-planning.md se-4-requirements.md
    se-5-design.md se-5-5-bar-raiser.md se-6-implementation.md
    se-7-testing.md se-7-5-bar-raiser.md se-8-evaluation.md
    se-9-approval.md se-step-a-discussion.md
  )
fi
if [[ "$INSTALL_EIW" == true ]]; then
  COMMAND_FILES+=(
    eiw-review.md eiw-stage0.md eiw-stage1.md eiw-stage2.md
    eiw-stage3.md eiw-bar-raiser.md eiw-stage4.md eiw-stage5.md
    eiw-stage6.md eiw-stage7.md
  )
fi
if [[ "$INSTALL_DRW" == true ]]; then
  COMMAND_FILES+=(defect-fix.md drw-bar-raiser.md)
fi
if [[ "$INSTALL_PDCA" == true ]]; then
  COMMAND_FILES+=(pdca-cycle.md pdca-1-incident.md pdca-2-attribution.md pdca-3-synthesis.md pdca-4-upgrade.md)
fi
# Bar Raiser protocol always included with any pipeline
if [[ "$INSTALL_SE" == true || "$INSTALL_EIW" == true || "$INSTALL_DRW" == true ]]; then
  COMMAND_FILES+=(bar-raiser-protocol.md)
fi
# Utilities always included with --commands
if [[ "$INSTALL_COMMANDS" == true ]]; then
  COMMAND_FILES+=(plan.md verify.md quality-gate.md refactor-clean.md test-coverage.md checkpoint.md learn.md abort-pipeline.md)
fi

if [[ ${#COMMAND_FILES[@]} -gt 0 ]]; then
  echo -e "${BOLD}.claude/commands/${NC}"
  for f in "${COMMAND_FILES[@]}"; do
    copy_file_idempotent "$KIT_CLAUDE_DIR/commands/$f" "$TARGET_DIR/.claude/commands/$f" ".claude/commands/$f"
  done
  echo ""
fi

# ----- Hooks -----
if [[ "$INSTALL_HOOKS" == true ]]; then
  echo -e "${BOLD}.claude/hooks/${NC}"
  copy_dir_idempotent "$KIT_CLAUDE_DIR/hooks" "$TARGET_DIR/.claude/hooks" ".claude/hooks"
  if [[ "$DRY_RUN" != true && "$NO_DEPS" != true ]]; then
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
      NODE_VER="$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)"
      if [[ "${NODE_VER:-0}" -ge 20 ]]; then
        echo -e "  ${CYAN}BUILD${NC}    .claude/hooks (npm install + build)"
        (cd "$TARGET_DIR/.claude/hooks" && npm install --silent && npm run build --silent) \
          && echo -e "  ${GREEN}OK${NC}       hooks compiled to dist/" \
          || echo -e "  ${YELLOW}WARN${NC}     hook build failed — manual: cd .claude/hooks && npm install && npm run build"
      else
        echo -e "  ${YELLOW}SKIP${NC}     Node 20+ not found (current: $(node -v 2>/dev/null || echo missing)); skipping hook build"
      fi
    else
      echo -e "  ${YELLOW}SKIP${NC}     node/npm not found; skipping hook build (run: cd .claude/hooks && npm install && npm run build)"
    fi
  fi
  echo ""
fi

# ----- Pipeline-state -----
if [[ "$INSTALL_STATE" == true ]]; then
  echo -e "${BOLD}.claude/pipeline-state/${NC}"
  copy_file_idempotent "$KIT_CLAUDE_DIR/pipeline-state/SCHEMA.md" "$TARGET_DIR/.claude/pipeline-state/SCHEMA.md" ".claude/pipeline-state/SCHEMA.md"
  if [[ "$DRY_RUN" != true ]]; then
    [ -f "$TARGET_DIR/.claude/pipeline-state/.gitkeep" ] || touch "$TARGET_DIR/.claude/pipeline-state/.gitkeep"
  fi
  echo ""
fi

# ----- CLAUDE.md -----
if [[ "$INSTALL_CLAUDE_MD" == true ]]; then
  echo -e "${BOLD}CLAUDE.md${NC}"
  copy_file_idempotent "$SCRIPT_DIR/CLAUDE.md" "$TARGET_DIR/CLAUDE.md" "CLAUDE.md"
  echo ""
fi

# ----- PDCA archive -----
if [[ "$INSTALL_PDCA_ARCHIVE" == true || "$INSTALL_PDCA" == true ]]; then
  archive_dir="$TARGET_DIR/.claude/pdca-archive/cycles"
  index_file="$TARGET_DIR/.claude/pdca-archive/index.json"
  instincts_file="$TARGET_DIR/.claude/pdca-archive/instincts.md"
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${CYAN}WOULD${NC}    .claude/pdca-archive/ (initialized)"
  else
    mkdir -p "$archive_dir"
    [ -f "$index_file" ] || echo '{"version":1,"totalCycles":0,"cycles":[]}' > "$index_file"
    if [ ! -f "$instincts_file" ]; then
      copy_file_idempotent "$KIT_CLAUDE_DIR/pdca-archive/instincts.md" "$instincts_file" ".claude/pdca-archive/instincts.md"
    fi
    [ -f "$archive_dir/.gitkeep" ] || touch "$archive_dir/.gitkeep"
    echo -e "  ${GREEN}OK${NC}       .claude/pdca-archive/ ready"
  fi
  echo ""
fi

echo "----------------------------------------------------------"
if [[ "$DRY_RUN" == true ]]; then
  echo -e "  ${BOLD}Dry-run complete. No files were modified.${NC}"
else
  echo -e "  ${GREEN}${BOLD}Installed: ${INSTALLED} files${NC}"
  if [[ $UNCHANGED -gt 0 ]]; then
    echo -e "  ${CYAN}Unchanged: ${UNCHANGED} files (already current)${NC}"
  fi
  if [[ $SKIPPED -gt 0 ]]; then
    echo -e "  ${YELLOW}Skipped:   ${SKIPPED} files (already exist; --force to overwrite)${NC}"
  fi
fi
echo "----------------------------------------------------------"
echo ""

if [[ "$DRY_RUN" != true && "$INSTALLED" -gt 0 ]]; then
  echo -e "${BOLD}Next steps:${NC}"
  echo "  1. Review CLAUDE.md and replace \$BUILD_CMD/\$TEST_CMD/etc. with your project's commands"
  echo "  2. Copy .claude/settings.example.json to .claude/settings.json to enable hooks"
  echo "  3. Restart Claude Code to pick up the new hooks"
  echo "  4. Try: /se-pipeline [feature], /eiw-review [feature], /defect-fix [bug]"
  echo ""
fi
