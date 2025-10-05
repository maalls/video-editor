# Tools Directory

This directory contains utility tools for the video-editor project.

## Package Dependency Analyzer

The `package-diff.js` tool analyzes changes in `package-lock.json` to show added, removed, and updated packages.

### Usage

#### NPM Scripts (Recommended)
```bash
# Analyze current uncommitted changes
npm run deps:diff

# Show current package versions
npm run deps:list

# Analyze changes since a specific commit
npm run deps:since HEAD~2
npm run deps:since main

# Show help
npm run deps:help
```

#### Direct Usage
```bash
# Analyze current changes
node tools/package-diff.js

# Analyze changes since commit
node tools/package-diff.js --since HEAD~1

# List current packages
node tools/package-diff.js --list

# Show help
node tools/package-diff.js --help
```

### Features

- **Added Packages**: Shows newly added dependencies
- **Removed Packages**: Shows removed dependencies  
- **Updated Packages**: Shows version changes (old → new)
- **Summary Statistics**: Total count of changes
- **Git Integration**: Compare against any commit
- **Current Package List**: Shows all installed packages

### Examples

After running `npm update`:
```bash
npm run deps:diff
```

To see what changed since last commit:
```bash
npm run deps:since HEAD~1
```

To compare against main branch:
```bash
npm run deps:since main
```

### Output Format

The tool provides:
- 📊 Summary with counts
- ➕ Added packages with versions
- ➖ Removed packages with versions  
- 🔄 Updated packages showing version changes
- 📦 Current package listing

This helps track dependency changes during updates and understand what packages were affected.