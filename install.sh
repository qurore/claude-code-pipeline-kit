#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  Claude Code Kaizen — Installer
#  Installs governance skills into your project's .claude/ dir
# ============================================================

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$SCRIPT_DIR/.claude/commands"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
  echo ""
  echo -e "${CYAN}${BOLD}  ┌─────────────────────────────────────────┐${NC}"
  echo -e "${CYAN}${BOLD}  │     Claude Code Kaizen v${VERSION}            │${NC}"
  echo -e "${CYAN}${BOLD}  │     改善 — Continuous Improvement        │${NC}"
  echo -e "${CYAN}${BOLD}  └─────────────────────────────────────────┘${NC}"
  echo ""
}

print_help() {
  print_banner
  echo "Usage: ./install.sh [OPTIONS] [TARGET_DIR]"
  echo ""
  echo "Arguments:"
  echo "  TARGET_DIR          Project directory to install skills into (default: current dir)"
  echo ""
  echo "Options:"
  echo "  --all               Install all skills (default)"
  echo "  --pipelines         Install only pipeline skills (SE, EIW, DRW, PDCA)"
  echo "  --se                Install only SE Pipeline skills"
  echo "  --eiw               Install only EIW skills"
  echo "  --drw               Install only DRW (defect-fix) skill"
  echo "  --pdca              Install only PDCA skills"
  echo "  --qa                Install only QA skills (site-patrol, chat-patrol)"
  echo "  --ui                Install only UI skills (ui-forge, ui-audit)"
  echo "  --claude-md         Also copy CLAUDE.md governance rules"
  echo "  --pdca-archive      Also initialize .claude/pdca-archive/"
  echo "  --dry-run           Show what would be installed without copying"
  echo "  --force             Overwrite existing files without prompting"
  echo "  --list              List all available skills and exit"
  echo "  -h, --help          Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./install.sh /path/to/my-project          # Install all skills"
  echo "  ./install.sh --se --eiw /path/to/project   # Install SE + EIW only"
  echo "  ./install.sh --claude-md .                  # Install all + CLAUDE.md in current dir"
  echo "  ./install.sh --dry-run /path/to/project     # Preview installation"
  echo ""
}

list_skills() {
  print_banner
  echo -e "${BOLD}Available Skills:${NC}"
  echo ""
  echo -e "  ${CYAN}SE Pipeline (11 files)${NC} — Full 9-phase software engineering lifecycle"
  echo "    se-pipeline, se-1-prompt-analysis, se-2-prompt-requirements,"
  echo "    se-3-planning, se-4-requirements, se-5-design, se-6-implementation,"
  echo "    se-7-testing, se-8-evaluation, se-9-approval, se-step-a-discussion"
  echo ""
  echo -e "  ${CYAN}EIW (9 files)${NC} — Enterprise Implementation Workflow"
  echo "    eiw-review, eiw-stage0 through eiw-stage7"
  echo ""
  echo -e "  ${CYAN}DRW (1 file)${NC} — Defect Resolution Workflow"
  echo "    defect-fix"
  echo ""
  echo -e "  ${CYAN}PDCA (5 files)${NC} — Self-Improvement Cycle"
  echo "    pdca-cycle, pdca-1-incident, pdca-2-attribution,"
  echo "    pdca-3-synthesis, pdca-4-upgrade"
  echo ""
  echo -e "  ${CYAN}QA (2 files)${NC} — Quality Assurance Patrol"
  echo "    site-patrol, chat-patrol"
  echo ""
  echo -e "  ${CYAN}UI (2 files)${NC} — UI Design Quality"
  echo "    ui-forge, ui-audit"
  echo ""
  echo -e "  ${BOLD}Total: 30 skill files${NC}"
  echo ""
}

# Parse arguments
TARGET_DIR=""
INSTALL_SE=false
INSTALL_EIW=false
INSTALL_DRW=false
INSTALL_PDCA=false
INSTALL_QA=false
INSTALL_UI=false
INSTALL_ALL=true
INSTALL_CLAUDE_MD=false
INSTALL_PDCA_ARCHIVE=false
DRY_RUN=false
FORCE=false
SPECIFIC_SET=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      INSTALL_ALL=true
      shift
      ;;
    --pipelines)
      INSTALL_SE=true; INSTALL_EIW=true; INSTALL_DRW=true; INSTALL_PDCA=true
      INSTALL_ALL=false; SPECIFIC_SET=true
      shift
      ;;
    --se)
      INSTALL_SE=true; INSTALL_ALL=false; SPECIFIC_SET=true
      shift
      ;;
    --eiw)
      INSTALL_EIW=true; INSTALL_ALL=false; SPECIFIC_SET=true
      shift
      ;;
    --drw)
      INSTALL_DRW=true; INSTALL_ALL=false; SPECIFIC_SET=true
      shift
      ;;
    --pdca)
      INSTALL_PDCA=true; INSTALL_ALL=false; SPECIFIC_SET=true
      shift
      ;;
    --qa)
      INSTALL_QA=true; INSTALL_ALL=false; SPECIFIC_SET=true
      shift
      ;;
    --ui)
      INSTALL_UI=true; INSTALL_ALL=false; SPECIFIC_SET=true
      shift
      ;;
    --claude-md)
      INSTALL_CLAUDE_MD=true
      shift
      ;;
    --pdca-archive)
      INSTALL_PDCA_ARCHIVE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --list)
      list_skills
      exit 0
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Run './install.sh --help' for usage."
      exit 1
      ;;
    *)
      TARGET_DIR="$1"
      shift
      ;;
  esac
done

# Default target dir
if [[ -z "$TARGET_DIR" ]]; then
  TARGET_DIR="$(pwd)"
fi

# Resolve to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
  echo -e "${RED}Error: Directory '$TARGET_DIR' does not exist.${NC}"
  exit 1
}

# If --all, enable everything
if [[ "$INSTALL_ALL" == true ]]; then
  INSTALL_SE=true
  INSTALL_EIW=true
  INSTALL_DRW=true
  INSTALL_PDCA=true
  INSTALL_QA=true
  INSTALL_UI=true
fi

print_banner
echo -e "Target: ${BOLD}$TARGET_DIR${NC}"
echo ""

# Build file list
FILES=()

if [[ "$INSTALL_SE" == true ]]; then
  FILES+=(
    "se-pipeline.md"
    "se-1-prompt-analysis.md"
    "se-2-prompt-requirements.md"
    "se-3-planning.md"
    "se-4-requirements.md"
    "se-5-design.md"
    "se-6-implementation.md"
    "se-7-testing.md"
    "se-8-evaluation.md"
    "se-9-approval.md"
    "se-step-a-discussion.md"
  )
fi

if [[ "$INSTALL_EIW" == true ]]; then
  FILES+=(
    "eiw-review.md"
    "eiw-stage0.md"
    "eiw-stage1.md"
    "eiw-stage2.md"
    "eiw-stage3.md"
    "eiw-stage4.md"
    "eiw-stage5.md"
    "eiw-stage6.md"
    "eiw-stage7.md"
  )
fi

if [[ "$INSTALL_DRW" == true ]]; then
  FILES+=("defect-fix.md")
fi

if [[ "$INSTALL_PDCA" == true ]]; then
  FILES+=(
    "pdca-cycle.md"
    "pdca-1-incident.md"
    "pdca-2-attribution.md"
    "pdca-3-synthesis.md"
    "pdca-4-upgrade.md"
  )
fi

if [[ "$INSTALL_QA" == true ]]; then
  FILES+=(
    "site-patrol.md"
    "chat-patrol.md"
  )
fi

if [[ "$INSTALL_UI" == true ]]; then
  FILES+=(
    "ui-forge.md"
    "ui-audit.md"
  )
fi

# Install
DEST_DIR="$TARGET_DIR/.claude/commands"
INSTALLED=0
SKIPPED=0

if [[ "$DRY_RUN" == true ]]; then
  echo -e "${YELLOW}DRY RUN — no files will be copied${NC}"
  echo ""
fi

# Create destination directory
if [[ "$DRY_RUN" != true ]]; then
  mkdir -p "$DEST_DIR"
fi

for file in "${FILES[@]}"; do
  src="$SKILLS_DIR/$file"
  dest="$DEST_DIR/$file"

  if [[ ! -f "$src" ]]; then
    echo -e "  ${RED}MISSING${NC}  $file (source not found)"
    continue
  fi

  if [[ -f "$dest" && "$FORCE" != true && "$DRY_RUN" != true ]]; then
    echo -e "  ${YELLOW}EXISTS${NC}   $file (use --force to overwrite)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${CYAN}WOULD${NC}    $file"
  else
    cp "$src" "$dest"
    echo -e "  ${GREEN}INSTALL${NC}  $file"
  fi
  INSTALLED=$((INSTALLED + 1))
done

# Install CLAUDE.md
if [[ "$INSTALL_CLAUDE_MD" == true ]]; then
  src="$SCRIPT_DIR/CLAUDE.md"
  dest="$TARGET_DIR/CLAUDE.md"

  if [[ -f "$dest" && "$FORCE" != true && "$DRY_RUN" != true ]]; then
    echo ""
    echo -e "  ${YELLOW}CLAUDE.md already exists in target.${NC}"
    echo -e "  Consider merging manually: ${BOLD}$src${NC}"
    echo -e "  Or use --force to overwrite."
  elif [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${CYAN}WOULD${NC}    CLAUDE.md (governance rules)"
  else
    cp "$src" "$dest"
    echo -e "  ${GREEN}INSTALL${NC}  CLAUDE.md (governance rules)"
  fi
fi

# Initialize PDCA archive
if [[ "$INSTALL_PDCA_ARCHIVE" == true || "$INSTALL_PDCA" == true ]]; then
  archive_dir="$TARGET_DIR/.claude/pdca-archive/cycles"
  index_file="$TARGET_DIR/.claude/pdca-archive/index.json"

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${CYAN}WOULD${NC}    .claude/pdca-archive/ (initialized)"
  elif [[ ! -d "$archive_dir" ]]; then
    mkdir -p "$archive_dir"
    if [[ ! -f "$index_file" ]]; then
      echo '{"version":1,"totalCycles":0,"cycles":[]}' > "$index_file"
    fi
    echo -e "  ${GREEN}INIT${NC}     .claude/pdca-archive/"
  fi
fi

echo ""
echo "────────────────────────────────────────────"
if [[ "$DRY_RUN" == true ]]; then
  echo -e "  ${BOLD}Would install: ${INSTALLED} files${NC}"
else
  echo -e "  ${GREEN}${BOLD}Installed: ${INSTALLED} files${NC}"
  if [[ $SKIPPED -gt 0 ]]; then
    echo -e "  ${YELLOW}Skipped:   ${SKIPPED} files (already exist)${NC}"
  fi
fi
echo "────────────────────────────────────────────"
echo ""

if [[ "$DRY_RUN" != true && "$INSTALLED" -gt 0 ]]; then
  echo -e "${BOLD}Next steps:${NC}"
  echo ""
  echo "  1. Configure your build/test commands in CLAUDE.md:"
  echo "     Replace \$BUILD_CMD, \$TEST_CMD, \$LINT_CMD, \$TYPE_CHECK_CMD"
  echo "     with your project's actual commands."
  echo ""
  echo "  2. Start using the skills in Claude Code:"
  echo "     /se-pipeline [feature]    — Full lifecycle pipeline"
  echo "     /eiw-review [feature]     — Implementation workflow"
  echo "     /defect-fix [bug]         — Defect resolution"
  echo "     /pdca-cycle               — Self-improvement cycle"
  echo ""
  echo "  3. See all available skills:"
  echo "     ./install.sh --list"
  echo ""
fi
