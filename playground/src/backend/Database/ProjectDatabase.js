import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

/**
 * ProjectDatabase extends the original Database to work with project-specific directories
 * Each project has its own database.json, dailies folder, and thumbnails folder
 */
export default class ProjectDatabase {
   constructor(projectManager, projectSlug) {
      this.projectManager = projectManager;
      this.projectSlug = projectSlug;

      if (!projectManager.projectExists(projectSlug)) {
         throw new Error(`Project '${projectSlug}' does not exist`);
      }

      const project = projectManager.getProject(projectSlug);
      this.sourceFolder = project.paths.dailies;
      this.workdir = project.paths.root;
      this.databaseFile = project.paths.database;
      this.thumbnailsDir = project.paths.thumbnails;

      this.data = {};
      this.compressionConfig = this.loadCompressionConfig();

      // Update last accessed time
      this.projectManager.updateLastAccessed(projectSlug);
   }

   loadCompressionConfig() {
      const configPath = path.join(process.cwd(), 'compression-config.json');
      try {
         if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configContent);
         } else {
            console.warn('Compression config file not found:', configPath);
            return null;
         }
      } catch (error) {
         console.error('Error loading compression config:', error);
         return null;
      }
   }

   refresh() {
      this.import();
      this.save();
   }

   save() {
      // Ensure directory exists
      if (!fs.existsSync(path.dirname(this.databaseFile))) {
         fs.mkdirSync(path.dirname(this.databaseFile), { recursive: true });
      }
      fs.writeFileSync(this.databaseFile, JSON.stringify(this.data, null, 2));
   }

   load() {
      this.data = {};
      if (fs.existsSync(this.databaseFile)) {
         try {
            const fileContent = fs.readFileSync(this.databaseFile);
            const data = JSON.parse(fileContent);
            this.data = data;
         } catch (error) {
            console.warn('Error parsing database file:', error);
            this.import();
         }
      } else {
         console.log(
            `Database file does not exist for project '${this.projectSlug}':`,
            this.databaseFile
         );
         this.import();
         this.save();
      }
      return this.data;
   }

   import() {
      const files = this.getVideoFilenames();
      const data = files.map(file => {
         const videoInfo = this.getVideoInfoFromFilename(file);
         this.generateThumbnails(file);
         this.set(file, videoInfo);
      });
   }

   generateThumbnails(videoFile) {
      // Ensure thumbnails directory exists
      if (!fs.existsSync(this.thumbnailsDir)) {
         fs.mkdirSync(this.thumbnailsDir, { recursive: true });
      }

      const fullPath = this.getVideoFullPath(videoFile);
      const thumbnailPath = path.join(
         this.thumbnailsDir,
         `${path.basename(videoFile, '.MP4')}.jpg`
      );

      if (!fs.existsSync(thumbnailPath)) {
         try {
            const command = `/usr/local/bin/ffmpeg -i "${fullPath}" -ss 00:00:01.000 -vframes 1 "${thumbnailPath}"`;
            console.log(`Generating thumbnail for project '${this.projectSlug}':`, command);
            execSync(command);
            console.log(`Generated thumbnail for ${videoFile} at ${thumbnailPath}`);
         } catch (error) {
            console.error(`Failed to generate thumbnail for ${videoFile}:`, error);
         }
      }
   }

   getVideoFilenames() {
      if (!fs.existsSync(this.sourceFolder)) {
         console.log(
            `Dailies folder does not exist for project '${this.projectSlug}':`,
            this.sourceFolder
         );
         return [];
      }

      const files = fs.readdirSync(this.sourceFolder);
      const videoFiles = files.filter(
         file =>
            file.toLowerCase().endsWith('.mp4') ||
            file.toLowerCase().endsWith('.mov') ||
            file.toLowerCase().endsWith('.avi')
      );
      return videoFiles;
   }

   getVideoInfoFromFilename(filename) {
      const fullPath = this.getVideoFullPath(filename);

      try {
         const ffprob = this.getFfprobeInfo(fullPath);
         const videoStream = ffprob.streams.find(s => s.codec_type === 'video');
         const audioStream = ffprob.streams.find(s => s.codec_type === 'audio');

         return {
            filename: filename,
            project: this.projectSlug,
            info: {
               ffprob: {
                  source: ffprob,
                  video: videoStream,
                  audio: audioStream,
               },
            },
            created_at: ffprob.format.tags?.creation_time || new Date().toISOString(),
         };
      } catch (error) {
         console.error(`Error processing video info for ${filename}:`, error);
         return {
            filename: filename,
            project: this.projectSlug,
            error: error.message,
            created_at: new Date().toISOString(),
         };
      }
   }

   getVideoFullPath(filename) {
      return path.join(this.sourceFolder, filename);
   }

   getFfprobeInfo(filePath) {
      try {
         const output = execSync(
            `/usr/local/bin/ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
         ).toString();

         const info = JSON.parse(output);
         return info;
      } catch (error) {
         console.error('Error running ffprobe for file', filePath, error);
         throw error;
      }
   }

   get(key) {
      return this.data[key];
   }

   set(key, value) {
      this.data[key] = value;
   }

   delete(key) {
      delete this.data[key];
   }

   has(key) {
      return key in this.data;
   }

   values() {
      return Object.values(this.data);
   }

   size() {
      return Object.keys(this.data).length;
   }

   /**
    * Get video thumbnail path
    */
   getThumbnailPath(filename) {
      const thumbnailName = `${path.basename(filename, path.extname(filename))}.jpg`;
      return path.join(this.thumbnailsDir, thumbnailName);
   }

   /**
    * Check if thumbnail exists for a video
    */
   hasThumbnail(filename) {
      const thumbnailPath = this.getThumbnailPath(filename);
      return fs.existsSync(thumbnailPath);
   }

   /**
    * Get project information
    */
   getProjectInfo() {
      return this.projectManager.getProject(this.projectSlug);
   }

   /**
    * Get default workspace profile from project preferences
    */
   getDefaultWorkspaceProfile() {
      try {
         const project = this.getProjectInfo();
         return project.preferences.settings?.compressionProfile || 'workspace_basic';
      } catch (error) {
         console.warn('Error getting default workspace profile:', error);
         return 'workspace_basic';
      }
   }
}
