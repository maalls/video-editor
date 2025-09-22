#!/usr/bin/env node

import { PackageDiffAnalyzer } from '../src/analyzer.js';

// CLI Interface
function main() {
   const analyzer = new PackageDiffAnalyzer();
   const args = process.argv.slice(2);

   if (args.length === 0) {
      // Default: analyze current changes
      analyzer.analyzeChanges();
   } else if (args[0] === '--since' && args[1]) {
      // Analyze changes since specific commit
      analyzer.analyzeChangesSince(args[1]);
   } else if (args[0] === '--list' || args[0] === '-l') {
      // Show current packages
      analyzer.showCurrentPackages();
   } else if (args[0] === '--help' || args[0] === '-h') {
      console.log(`
📦 Package Dependency Change Analyzer

Usage:
  node tools/package-diff/bin/package-diff.js                    # Analyze current uncommitted changes
  node tools/package-diff/bin/package-diff.js --since <commit>   # Analyze changes since specific commit
  node tools/package-diff/bin/package-diff.js --list             # Show current package versions
  node tools/package-diff/bin/package-diff.js --help             # Show this help

NPM Scripts:
  npm run deps:diff                                              # Analyze current changes
  npm run deps:since -- <commit>                                # Analyze changes since commit
  npm run deps:list                                              # Show current packages
  npm run deps:help                                              # Show help

Examples:
  node tools/package-diff/bin/package-diff.js
  node tools/package-diff/bin/package-diff.js --since HEAD~2
  node tools/package-diff/bin/package-diff.js --since main
  node tools/package-diff/bin/package-diff.js --list
  
  npm run deps:diff
  npm run deps:since -- HEAD~2
  npm run deps:list
      `);
   } else {
      console.error('❌ Invalid arguments. Use --help for usage information.');
      process.exit(1);
   }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
   main();
}

export { main };