# Package Dependency Change Analyzer

The Package Dependency Change Analyzer is a comprehensive tool for tracking changes in your `package-lock.json` file. It provides detailed analysis of package additions, removals, and updates.

## Features

- **Added Packages**: Shows newly added dependencies with versions
- **Removed Packages**: Shows removed dependencies with versions  
- **Updated Packages**: Shows version changes (old → new)
- **Summary Statistics**: Total count of changes by category
- **Git Integration**: Compare against any commit or branch
- **Current Package List**: Shows all installed packages with versions
- **Beautiful Output**: Formatted console output with emojis and clear sections

## Installation

The tool is already set up in your project. No additional installation required.

## Usage

### NPM Scripts (Recommended)

```bash
# Analyze current uncommitted changes
npm run deps:diff

# Show current package versions
npm run deps:list

# Analyze changes since a specific commit
npm run deps:since -- HEAD~2
npm run deps:since -- main

# Show help
npm run deps:help
```

### Direct Usage

```bash
# Analyze current changes
node tools/package-diff/bin/package-diff.js

# Analyze changes since commit
node tools/package-diff/bin/package-diff.js --since HEAD~1

# List current packages
node tools/package-diff/bin/package-diff.js --list

# Show help
node tools/package-diff/bin/package-diff.js --help
```

## Examples

### After running npm update

```bash
npm run deps:diff
```

Output:
```
🔍 Analysing package-lock.json changes...

📦 Package Dependencies Analysis Results

════════════════════════════════════════════════════════════

📊 Summary:
   ➕ Added packages: 35
   ➖ Removed packages: 21
   🔄 Modified packages: 9
   📦 Total changes: 65

➕ Added Packages (35):
────────────────────────────────────────
   + @types/estree@1.0.6
   + acorn@8.14.0
   + buffer-from@1.1.2
   ...

➖ Removed Packages (21):
────────────────────────────────────────
   - old-package@1.0.0
   - deprecated-lib@2.1.0
   ...

🔄 Updated Packages (9):
────────────────────────────────────────
   📝 browser-sync: 2.29.3 → 3.0.4
   📝 express: 4.21.2 → 5.1.0
   ...

════════════════════════════════════════════════════════════
✅ Analysis complete
```

### Compare against last commit

```bash
npm run deps:since -- HEAD~1
```

### Compare against main branch

```bash
npm run deps:since -- main
```

### Show current packages

```bash
npm run deps:list
```

## Architecture

The tool is organized into a modular structure:

```
tools/package-diff/
├── src/
│   └── analyzer.js      # Core PackageDiffAnalyzer class
├── bin/
│   └── package-diff.js  # CLI entry point (executable)
├── docs/
│   └── README.md        # This documentation
```

- **src/analyzer.js**: Contains the main `PackageDiffAnalyzer` class with all analysis logic
- **bin/package-diff.js**: CLI interface that imports and uses the analyzer
- **docs/README.md**: Complete documentation and usage examples

## Technical Details

### How it works

1. **Git Integration**: Uses `git diff` and `git status` to detect changes
2. **Parsing**: Analyzes the diff output to extract package information
3. **Categorization**: Separates changes into added, removed, and modified packages
4. **Formatting**: Presents results in a user-friendly format

### Requirements

- Git repository (for comparing changes)
- Node.js with ES modules support
- NPM package-lock.json file

### Error Handling

The tool gracefully handles:
- Missing package-lock.json files
- No git changes detected
- Invalid commit references
- Git command failures

## Troubleshooting

If you encounter issues:

1. **"package-lock.json not found"**: Ensure you're running from the project root
2. **"No changes detected"**: Make sure you have uncommitted changes or specify a commit to compare against
3. **Git errors**: Ensure you're in a git repository and the specified commit exists

## Contributing

The tool is designed to be easily extensible. To add new features:

1. Modify the `PackageDiffAnalyzer` class in `src/analyzer.js`
2. Update the CLI interface in `bin/package-diff.js` if needed
3. Update this documentation

## Output Format

The tool provides structured output with:
- 📊 **Summary**: Counts of each change type
- ➕ **Added Packages**: New dependencies with versions
- ➖ **Removed Packages**: Removed dependencies with versions  
- 🔄 **Updated Packages**: Version changes (old → new format)
- 📦 **Package Listing**: Complete current package inventory

This helps track dependency changes during updates and understand what packages were affected by changes.