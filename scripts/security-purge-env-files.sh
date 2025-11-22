#!/bin/bash

###############################################################################
# Git History Purge Script for .env Files
#
# PURPOSE: Remove .env files containing secrets from entire git history
# DANGER LEVEL: EXTREME - This rewrites history and requires force push
#
# PREREQUISITES:
# 1. All team members must commit and push their work
# 2. Coordinate timing with entire team
# 3. All team members must re-clone after this runs
# 4. Create backup of repository before running
#
# USAGE: ./scripts/security-purge-env-files.sh [method]
#   method: "bfg" or "filter-branch" (default: bfg)
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Configuration
METHOD="${1:-bfg}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${HOME}/upcoach-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  DANGER: GIT HISTORY REWRITE - READ CAREFULLY               ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo "  1. Rewrite entire git history"
echo "  2. Remove .env files from all commits"
echo "  3. Require force push to remote"
echo "  4. Break all existing clones"
echo ""
echo -e "${RED}ALL TEAM MEMBERS MUST RE-CLONE AFTER THIS RUNS!${NC}"
echo ""

# Safety check: Are we in the right directory?
if [ ! -d "${REPO_DIR}/.git" ]; then
    echo -e "${RED}ERROR: Not a git repository!${NC}"
    echo "Expected: ${REPO_DIR}"
    exit 1
fi

# Safety check: Is the working directory clean?
if [ -n "$(git -C "${REPO_DIR}" status --porcelain)" ]; then
    echo -e "${RED}ERROR: Working directory has uncommitted changes!${NC}"
    echo "Please commit or stash all changes before running this script."
    git -C "${REPO_DIR}" status --short
    exit 1
fi

# Confirmation prompt
echo ""
read -p "Have all team members committed and pushed their work? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}Aborted. Coordinate with team first.${NC}"
    exit 0
fi

echo ""
read -p "Have you created a backup of the repository? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}Creating backup at: ${BACKUP_DIR}${NC}"
    cp -r "${REPO_DIR}" "${BACKUP_DIR}"
    echo -e "${GREEN}Backup created successfully.${NC}"
fi

echo ""
read -p "Type 'PURGE HISTORY' to confirm you want to proceed: " -r
if [ "$REPLY" != "PURGE HISTORY" ]; then
    echo -e "${YELLOW}Aborted. Confirmation text did not match.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Starting history purge...${NC}"
echo ""

cd "${REPO_DIR}"

###############################################################################
# Method 1: BFG Repo-Cleaner (Recommended - Faster)
###############################################################################
if [ "$METHOD" = "bfg" ]; then
    echo -e "${GREEN}Using BFG Repo-Cleaner method${NC}"
    echo ""

    # Check if BFG is installed
    if ! command -v bfg &> /dev/null; then
        echo -e "${RED}ERROR: BFG Repo-Cleaner is not installed!${NC}"
        echo ""
        echo "Install with:"
        echo "  macOS: brew install bfg"
        echo "  Linux: Download from https://rtyley.github.io/bfg-repo-cleaner/"
        echo ""
        exit 1
    fi

    # Create a fresh mirror clone
    echo "Creating mirror clone..."
    MIRROR_DIR="${REPO_DIR}-mirror"
    rm -rf "${MIRROR_DIR}"
    git clone --mirror "$(git remote get-url origin)" "${MIRROR_DIR}"

    cd "${MIRROR_DIR}"

    # Run BFG to delete the files
    echo ""
    echo "Removing .env files from history..."
    bfg --delete-files .env .
    bfg --delete-files .env.production .
    bfg --delete-files .env.production.secure .
    bfg --delete-files .env.staging .
    bfg --delete-files .env.secure .
    bfg --delete-files .env.local .

    # Clean up
    echo ""
    echo "Cleaning up repository..."
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive

    echo ""
    echo -e "${YELLOW}BFG processing complete!${NC}"
    echo ""
    echo "To push the cleaned history:"
    echo "  cd ${MIRROR_DIR}"
    echo "  git push --force"
    echo ""
    echo "Then delete the mirror and re-clone:"
    echo "  rm -rf ${MIRROR_DIR}"
    echo "  cd ${REPO_DIR}/.."
    echo "  rm -rf upcoach-project"
    echo "  git clone [repo-url] upcoach-project"

###############################################################################
# Method 2: git filter-branch (Slower but built-in)
###############################################################################
elif [ "$METHOD" = "filter-branch" ]; then
    echo -e "${GREEN}Using git filter-branch method${NC}"
    echo ""

    # Remove files from all commits
    echo "Rewriting history (this may take several minutes)..."
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch \
        .env \
        .env.production \
        .env.production.secure \
        .env.staging \
        .env.secure \
        .env.local \
        .env.development.local \
        .env.test.local \
        .env.production.local" \
        --prune-empty --tag-name-filter cat -- --all

    # Clean up refs
    echo ""
    echo "Cleaning up refs..."
    git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d

    # Expire reflog
    echo "Expiring reflog..."
    git reflog expire --expire=now --all

    # Garbage collect
    echo "Garbage collecting..."
    git gc --prune=now --aggressive

    echo ""
    echo -e "${GREEN}Filter-branch processing complete!${NC}"

else
    echo -e "${RED}ERROR: Invalid method '${METHOD}'${NC}"
    echo "Use: 'bfg' or 'filter-branch'"
    exit 1
fi

###############################################################################
# Final Instructions
###############################################################################

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  HISTORY REWRITE COMPLETE - NEXT STEPS                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}CRITICAL: You must now:${NC}"
echo ""
echo "1. FORCE PUSH to remote (COORDINATE WITH TEAM!):"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "2. NOTIFY ALL TEAM MEMBERS immediately"
echo ""
echo "3. ALL TEAM MEMBERS must:"
echo "   - Commit and push any local work (if not done)"
echo "   - Delete their local clone"
echo "   - Re-clone from remote:"
echo "     git clone https://github.com/virtuenet/UpCoach.git"
echo ""
echo "4. ROTATE ALL SECRETS (see SECURITY_ADVISORY_ENV_FILES.md)"
echo ""
echo "5. INSTALL git-secrets on all developer machines:"
echo "   brew install git-secrets"
echo "   cd upcoach-project"
echo "   git secrets --install"
echo "   git secrets --register-aws"
echo "   git secrets --add '\\.env$'"
echo "   git secrets --add '\\.env\\..*'"
echo ""
echo -e "${RED}WARNING: Do not proceed with force push until:${NC}"
echo "  - All team members are notified"
echo "  - All team members have pushed their work"
echo "  - You have confirmed everyone is ready"
echo ""
echo -e "${GREEN}Backup location: ${BACKUP_DIR}${NC}"
echo ""

# Show repository size change
if [ "$METHOD" = "bfg" ]; then
    echo "To see size reduction, check .git directory size:"
    echo "  du -sh ${MIRROR_DIR}/.git"
else
    echo "Repository size after purge:"
    du -sh .git
fi

echo ""
echo -e "${GREEN}Script complete!${NC}"
echo ""
