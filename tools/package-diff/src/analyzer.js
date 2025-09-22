import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Package Dependency Change Analyzer
 * Analyzes changes in package-lock.json to show added, removed, and updated packages
 */
export class PackageDiffAnalyzer {
   constructor() {
      this.workingDir = process.cwd();
      this.packageLockPath = path.join(this.workingDir, 'package-lock.json');
   }

   /**
    * Run git diff on package-lock.json and parse the results
    */
   analyzeChanges() {
      console.log('🔍 Analysing package-lock.json changes...\n');

      if (!fs.existsSync(this.packageLockPath)) {
         console.error('❌ package-lock.json not found');
         process.exit(1);
      }

      try {
         // Check if there are uncommitted changes
         const status = execSync('git status --porcelain package-lock.json', { 
            encoding: 'utf8',
            cwd: this.workingDir 
         }).trim();

         if (!status) {
            console.log('✅ No changes detected in package-lock.json');
            return;
         }

         // Get the diff
         const diff = execSync('git diff package-lock.json', { 
            encoding: 'utf8',
            cwd: this.workingDir 
         });

         if (!diff) {
            console.log('✅ No diff available for package-lock.json');
            return;
         }

         this.parseDiff(diff);

      } catch (error) {
         console.error('❌ Error analyzing changes:', error.message);
         process.exit(1);
      }
   }

   /**
    * Parse git diff output to extract package changes
    */
   parseDiff(diff) {
      const lines = diff.split('\n');
      const changes = {
         added: new Map(),
         removed: new Map(),
         modified: new Map(),
         stats: { added: 0, removed: 0, modified: 0 }
      };

      let currentPackage = null;
      let isInNodeModules = false;

      for (let i = 0; i < lines.length; i++) {
         const line = lines[i];

         // Detect node_modules entries
         if (line.includes('"node_modules/')) {
            const packageMatch = line.match(/"node_modules\/([^"\/]+)/);
            if (packageMatch) {
               currentPackage = packageMatch[1];
               isInNodeModules = true;
            }
         }

         // Extract version changes
         if (isInNodeModules && line.includes('"version":')) {
            const versionMatch = line.match(/"version":\s*"([^"]+)"/);
            if (versionMatch) {
               const version = versionMatch[1];
               
               if (line.startsWith('+')) {
                  if (changes.removed.has(currentPackage)) {
                     // This is an update (removed old, added new)
                     const oldVersion = changes.removed.get(currentPackage);
                     changes.removed.delete(currentPackage);
                     changes.modified.set(currentPackage, { from: oldVersion, to: version });
                     changes.stats.removed--;
                     changes.stats.modified++;
                  } else {
                     changes.added.set(currentPackage, version);
                     changes.stats.added++;
                  }
               } else if (line.startsWith('-')) {
                  if (changes.added.has(currentPackage)) {
                     // This is an update (added new, removed old)
                     const newVersion = changes.added.get(currentPackage);
                     changes.added.delete(currentPackage);
                     changes.modified.set(currentPackage, { from: version, to: newVersion });
                     changes.stats.added--;
                     changes.stats.modified++;
                  } else {
                     changes.removed.set(currentPackage, version);
                     changes.stats.removed++;
                  }
               }
            }
         }

         // Reset when leaving a node_modules block
         if (line.trim() === '},' || line.trim() === '}') {
            isInNodeModules = false;
            currentPackage = null;
         }
      }

      this.displayResults(changes);
   }

   /**
    * Display the analysis results
    */
   displayResults(changes) {
      console.log('📦 Package Dependencies Analysis Results\n');
      console.log('═'.repeat(60));

      // Summary
      console.log(`\n📊 Summary:`);
      console.log(`   ➕ Added packages: ${changes.stats.added}`);
      console.log(`   ➖ Removed packages: ${changes.stats.removed}`);
      console.log(`   🔄 Modified packages: ${changes.stats.modified}`);
      console.log(`   📦 Total changes: ${changes.stats.added + changes.stats.removed + changes.stats.modified}`);

      // Added packages
      if (changes.added.size > 0) {
         console.log(`\n➕ Added Packages (${changes.added.size}):`);
         console.log('─'.repeat(40));
         const sortedAdded = Array.from(changes.added.entries()).sort();
         for (const [pkg, version] of sortedAdded) {
            console.log(`   + ${pkg}@${version}`);
         }
      }

      // Removed packages
      if (changes.removed.size > 0) {
         console.log(`\n➖ Removed Packages (${changes.removed.size}):`);
         console.log('─'.repeat(40));
         const sortedRemoved = Array.from(changes.removed.entries()).sort();
         for (const [pkg, version] of sortedRemoved) {
            console.log(`   - ${pkg}@${version}`);
         }
      }

      // Modified packages
      if (changes.modified.size > 0) {
         console.log(`\n🔄 Updated Packages (${changes.modified.size}):`);
         console.log('─'.repeat(40));
         const sortedModified = Array.from(changes.modified.entries()).sort();
         for (const [pkg, versions] of sortedModified) {
            console.log(`   📝 ${pkg}: ${versions.from} → ${versions.to}`);
         }
      }

      console.log('\n═'.repeat(60));
      console.log('✅ Analysis complete\n');
   }

   /**
    * Analyze changes since a specific commit
    */
   analyzeChangesSince(commitHash = 'HEAD~1') {
      console.log(`🔍 Analysing package-lock.json changes since ${commitHash}...\n`);

      try {
         const diff = execSync(`git diff ${commitHash} package-lock.json`, { 
            encoding: 'utf8',
            cwd: this.workingDir 
         });

         if (!diff) {
            console.log(`✅ No changes in package-lock.json since ${commitHash}`);
            return;
         }

         this.parseDiff(diff);

      } catch (error) {
         console.error('❌ Error analyzing changes:', error.message);
         process.exit(1);
      }
   }

   /**
    * Show current package versions
    */
   showCurrentPackages() {
      console.log('📦 Current Package Versions\n');
      console.log('═'.repeat(60));

      try {
         const output = execSync('npm list --depth=0', { 
            encoding: 'utf8',
            cwd: this.workingDir 
         });

         console.log(output);
      } catch (error) {
         console.error('❌ Error listing packages:', error.message);
      }
   }
}