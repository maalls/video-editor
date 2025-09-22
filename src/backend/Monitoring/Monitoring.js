import fs from 'fs';
import path from 'path';

/**
 * File Monitoring Class
 * Handles project file analysis, size tracking, and report generation
 */
export class Monitoring {
   constructor(workdir = process.cwd()) {
      this.workdir = workdir;
      this.excludePatterns = [
         'node_modules',
         '.git',
         'var/work/compressed',
         '.DS_Store',
         'Thumbs.db',
         '*.log',
      ];
      this.textExtensions = [
         '.js',
         '.ts',
         '.json',
         '.html',
         '.css',
         '.md',
         '.txt',
         '.yml',
         '.yaml',
         '.xml',
         '.jsx',
         '.tsx',
         '.vue',
         '.py',
         '.java',
         '.cpp',
         '.c',
         '.h',
         '.php',
         '.rb',
         '.go',
         '.rs',
         '.sh',
      ];
   }

   /**
    * Generate comprehensive file monitoring report
    */
   async generateFileReport() {
      console.log('🔍 Starting file monitoring scan...');

      const projectRoot = this.workdir;
      const monitoringDir = path.join(projectRoot, 'var', 'data', 'monitoring');
      const outputFile = path.join(monitoringDir, 'filesizes.json');

      // Ensure monitoring directory exists
      if (!fs.existsSync(monitoringDir)) {
         fs.mkdirSync(monitoringDir, { recursive: true });
      }

      const fileData = {
         timestamp: new Date().toISOString(),
         projectRoot: projectRoot,
         scan: {
            totalFiles: 0,
            totalSize: 0,
            totalLines: 0,
            directories: {},
         },
         files: [],
         summary: {
            byExtension: {},
            byDirectory: {},
            largestFiles: [],
            mostLines: [],
         },
      };

      // Scan project files
      await this.scanDirectory(projectRoot, fileData, '');

      // Generate summary statistics
      this.generateSummaryStats(fileData);

      // Write to JSON file
      fs.writeFileSync(outputFile, JSON.stringify(fileData, null, 2));

      console.log(`📊 File report generated: ${outputFile}`);
      console.log(`📁 Scanned ${fileData.scan.totalFiles} files`);
      console.log(`💾 Total size: ${this.formatFileSize(fileData.scan.totalSize)}`);
      console.log(`📝 Total lines: ${fileData.scan.totalLines.toLocaleString()}`);

      return {
         outputFile,
         totalFiles: fileData.scan.totalFiles,
         totalSize: fileData.scan.totalSize,
         totalSizeFormatted: this.formatFileSize(fileData.scan.totalSize),
         totalLines: fileData.scan.totalLines,
      };
   }

   /**
    * Recursively scan directory for files
    */
   async scanDirectory(dirPath, fileData, relativePath) {
      try {
         const items = fs.readdirSync(dirPath);

         for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const relativeItemPath = path.join(relativePath, item);

            // Skip excluded patterns
            if (this.isExcluded(relativeItemPath, item)) {
               continue;
            }

            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
               fileData.scan.directories[relativeItemPath] = {
                  files: 0,
                  size: 0,
                  lines: 0,
               };
               await this.scanDirectory(fullPath, fileData, relativeItemPath);
            } else if (stats.isFile()) {
               const fileInfo = await this.analyzeFile(fullPath, relativeItemPath, stats);
               fileData.files.push(fileInfo);
               fileData.scan.totalFiles++;
               fileData.scan.totalSize += fileInfo.size;
               fileData.scan.totalLines += fileInfo.lines;

               // Update directory stats
               const dirKey = path.dirname(relativeItemPath);
               if (fileData.scan.directories[dirKey]) {
                  fileData.scan.directories[dirKey].files++;
                  fileData.scan.directories[dirKey].size += fileInfo.size;
                  fileData.scan.directories[dirKey].lines += fileInfo.lines;
               }
            }
         }
      } catch (error) {
         console.warn(`Warning: Could not scan directory ${dirPath}:`, error.message);
      }
   }

   /**
    * Check if file/directory should be excluded
    */
   isExcluded(relativeItemPath, item) {
      return this.excludePatterns.some(pattern => {
         if (pattern.includes('*')) {
            return item.match(new RegExp(pattern.replace('*', '.*')));
         }
         return relativeItemPath.includes(pattern) || item === pattern;
      });
   }

   /**
    * Analyze individual file for metrics
    */
   async analyzeFile(fullPath, relativePath, stats) {
      const ext = path.extname(relativePath).toLowerCase();
      const fileInfo = {
         path: relativePath,
         name: path.basename(relativePath),
         extension: ext,
         size: stats.size,
         sizeFormatted: this.formatFileSize(stats.size),
         lines: 0,
         created: stats.ctime,
         modified: stats.mtime,
         isText: false,
      };

      // Check if file is text-based for line counting
      if (this.textExtensions.includes(ext)) {
         fileInfo.isText = true;
         try {
            const content = fs.readFileSync(fullPath, 'utf8');
            fileInfo.lines = content.split('\n').length;

            // Additional analysis for code files
            if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
               fileInfo.language = 'JavaScript/TypeScript';
               fileInfo.emptyLines = (content.match(/^\s*$/gm) || []).length;
               fileInfo.commentLines = (content.match(/^\s*(\/\/|\/\*|\*)/gm) || []).length;
            } else if (['.html', '.htm'].includes(ext)) {
               fileInfo.language = 'HTML';
            } else if (ext === '.css') {
               fileInfo.language = 'CSS';
            } else if (ext === '.json') {
               fileInfo.language = 'JSON';
            }
         } catch (error) {
            console.warn(`Warning: Could not read file ${relativePath}:`, error.message);
         }
      }

      return fileInfo;
   }

   /**
    * Generate summary statistics from file data
    */
   generateSummaryStats(fileData) {
      // Group by extension
      fileData.files.forEach(file => {
         const ext = file.extension || 'no-extension';
         if (!fileData.summary.byExtension[ext]) {
            fileData.summary.byExtension[ext] = {
               count: 0,
               totalSize: 0,
               totalLines: 0,
               averageSize: 0,
            };
         }
         fileData.summary.byExtension[ext].count++;
         fileData.summary.byExtension[ext].totalSize += file.size;
         fileData.summary.byExtension[ext].totalLines += file.lines;
      });

      // Calculate averages
      Object.keys(fileData.summary.byExtension).forEach(ext => {
         const stats = fileData.summary.byExtension[ext];
         stats.averageSize = Math.round(stats.totalSize / stats.count);
         stats.totalSizeFormatted = this.formatFileSize(stats.totalSize);
         stats.averageSizeFormatted = this.formatFileSize(stats.averageSize);
      });

      // Group by directory
      fileData.files.forEach(file => {
         const dir = path.dirname(file.path);
         if (!fileData.summary.byDirectory[dir]) {
            fileData.summary.byDirectory[dir] = {
               count: 0,
               totalSize: 0,
               totalLines: 0,
            };
         }
         fileData.summary.byDirectory[dir].count++;
         fileData.summary.byDirectory[dir].totalSize += file.size;
         fileData.summary.byDirectory[dir].totalLines += file.lines;
      });

      // Find largest files
      fileData.summary.largestFiles = fileData.files
         .sort((a, b) => b.size - a.size)
         .slice(0, 10)
         .map(file => ({
            path: file.path,
            size: file.size,
            sizeFormatted: file.sizeFormatted,
         }));

      // Find files with most lines
      fileData.summary.mostLines = fileData.files
         .filter(file => file.isText)
         .sort((a, b) => b.lines - a.lines)
         .slice(0, 10)
         .map(file => ({
            path: file.path,
            lines: file.lines,
            size: file.size,
            sizeFormatted: file.sizeFormatted,
         }));
   }

   /**
    * Get latest monitoring data from file
    */
   getLatestData() {
      try {
         const monitoringFile = path.join(
            this.workdir,
            'var',
            'data',
            'monitoring',
            'filesizes.json'
         );

         if (!fs.existsSync(monitoringFile)) {
            return null;
         }

         const data = JSON.parse(fs.readFileSync(monitoringFile, 'utf8'));
         return data;
      } catch (error) {
         console.error('Error reading monitoring data:', error);
         return null;
      }
   }

   /**
    * Get monitoring history (if multiple reports exist)
    */
   getHistory() {
      // Future enhancement: could store timestamped reports
      // For now, just return the latest data
      return this.getLatestData();
   }

   /**
    * Format file size in human readable format
    */
   formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
   }

   /**
    * Set custom exclude patterns
    */
   setExcludePatterns(patterns) {
      this.excludePatterns = patterns;
   }

   /**
    * Add exclude pattern
    */
   addExcludePattern(pattern) {
      if (!this.excludePatterns.includes(pattern)) {
         this.excludePatterns.push(pattern);
      }
   }

   /**
    * Remove exclude pattern
    */
   removeExcludePattern(pattern) {
      this.excludePatterns = this.excludePatterns.filter(p => p !== pattern);
   }
}
