#!/bin/bash

# Script helper pour créer des tags versionnés et déclencher l'auto-merge
# Usage: ./scripts/create-tag.sh <version> [message]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if version is provided
if [ $# -eq 0 ]; then
    print_error "Version is required!"
    echo ""
    echo "Usage: $0 <version> [message]"
    echo ""
    echo "Examples:"
    echo "  $0 1.0.0                          # Create tag v1.0.0"
    echo "  $0 1.2.3 'New feature release'    # Create tag with custom message"
    echo "  $0 2.0.0-beta.1                   # Create pre-release tag"
    echo ""
    exit 1
fi

VERSION=$1
TAG_NAME="v$VERSION"
MESSAGE=${2:-"Release $TAG_NAME"}

# Validate version format (basic semver check)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
    print_error "Invalid version format. Use semantic versioning (e.g., 1.0.0, 1.2.3-beta.1)"
    exit 1
fi

print_info "Creating version tag: $TAG_NAME"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository!"
    exit 1
fi

# Check if tag already exists
if git tag -l | grep -q "^$TAG_NAME$"; then
    print_error "Tag $TAG_NAME already exists!"
    print_info "Existing tags:"
    git tag -l | grep "^v" | sort -V | tail -5
    exit 1
fi

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    print_warning "Working directory is not clean. Uncommitted changes detected."
    echo ""
    git status --porcelain
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted by user"
        exit 0
    fi
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Create and push the tag
print_info "Creating tag $TAG_NAME with message: '$MESSAGE'"
git tag -a "$TAG_NAME" -m "$MESSAGE"

print_success "Tag $TAG_NAME created successfully!"

# Push the tag
print_info "Pushing tag to origin..."
git push origin "$TAG_NAME"

print_success "Tag $TAG_NAME pushed to origin!"

echo ""
print_info "🚀 Auto-merge workflow will be triggered shortly..."
print_info "📋 You can monitor the workflow at: https://github.com/maalls/video-editor/actions"
echo ""

# Show recent tags
print_info "Recent tags:"
git tag -l | grep "^v" | sort -V | tail -5

echo ""
print_success "✨ Release process initiated!"
print_info "The GitHub Actions workflow will automatically:"
print_info "  • Attempt to merge $TAG_NAME to main branch"
print_info "  • Create an issue if conflicts are detected" 
print_info "  • Notify you of the result"