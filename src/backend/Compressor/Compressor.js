import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Video Compressor Class
 * Handles video compression operations with configurable profiles
 */
export class Compressor {
   constructor(videoDatabase, workdir = process.cwd()) {
      this.videoDatabase = videoDatabase;
      this.workdir = workdir;
      this.compressionProfiles = null;
      this.loadCompressionProfiles();
   }

   /**
    * Load compression profiles from configuration file
    */
   loadCompressionProfiles() {
      try {
         const configPath = path.join(process.cwd(), 'compression-config.json');
         const configData = fs.readFileSync(configPath, 'utf8');
         this.compressionProfiles = JSON.parse(configData);
         console.log('📋 Loaded compression profiles:', Object.keys(this.compressionProfiles.profiles).join(', '));
      } catch (error) {
         console.error('Error loading compression profiles:', error.message);
         this.compressionProfiles = { profiles: {} };
      }
   }

   /**
    * Get all available compression profiles
    */
   getProfiles() {
      return this.compressionProfiles?.profiles || {};
   }

   /**
    * Get workspace-specific compression profiles
    */
   getWorkspaceProfiles() {
      const allProfiles = this.getProfiles();
      const workspaceProfiles = {};
      
      Object.entries(allProfiles).forEach(([key, profile]) => {
         if (profile.category === 'workspace' || key.startsWith('workspace_')) {
            workspaceProfiles[key] = profile;
         }
      });
      
      return workspaceProfiles;
   }

   /**
    * Compress a single video with specified profile
    */
   async compressVideo(videoId, profileName = 'web', progressCallback = null) {
      if (!this.videoDatabase.has(videoId)) {
         throw new Error(`Video not found: ${videoId}`);
      }

      const profiles = this.getProfiles();
      const profile = profiles[profileName];
      
      if (!profile) {
         throw new Error(`Compression profile not found: ${profileName}`);
      }

      const videoInfo = this.videoDatabase.get(videoId);
      const inputPath = videoInfo.path;
      const outputDir = path.join(this.workdir, 'var', 'work', 'compressed', profileName);
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
         fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `${videoId}_${profileName}.mp4`);
      
      console.log(`🎬 Starting compression: ${videoId} -> ${profileName}`);
      console.log(`📁 Input: ${inputPath}`);
      console.log(`📁 Output: ${outputPath}`);

      const ffmpegArgs = this.buildFfmpegArgs(inputPath, outputPath, profile);
      
      return new Promise((resolve, reject) => {
         const ffmpeg = spawn('ffmpeg', ffmpegArgs);
         let stderr = '';

         ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
            
            // Parse progress if callback provided
            if (progressCallback) {
               const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
               if (timeMatch && videoInfo.duration) {
                  const hours = parseInt(timeMatch[1]);
                  const minutes = parseInt(timeMatch[2]);
                  const seconds = parseFloat(timeMatch[3]);
                  const currentTime = hours * 3600 + minutes * 60 + seconds;
                  const progress = Math.min(100, Math.round((currentTime / videoInfo.duration) * 100));
                  
                  progressCallback({
                     videoId,
                     filename: path.basename(outputPath),
                     progress,
                     currentTime,
                     totalTime: videoInfo.duration
                  });
               }
            }
         });

         ffmpeg.on('close', (code) => {
            if (code === 0) {
               const stats = fs.statSync(outputPath);
               const result = {
                  videoId,
                  profile: profileName,
                  inputPath,
                  outputPath,
                  inputSize: fs.statSync(inputPath).size,
                  outputSize: stats.size,
                  compressionRatio: ((fs.statSync(inputPath).size - stats.size) / fs.statSync(inputPath).size * 100).toFixed(2) + '%',
                  outputSizeFormatted: this.formatFileSize(stats.size)
               };
               
               console.log(`✅ Compression completed: ${videoId} (${result.compressionRatio} reduction)`);
               resolve(result);
            } else {
               console.error(`❌ Compression failed for ${videoId}:`, stderr);
               reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`));
            }
         });

         ffmpeg.on('error', (error) => {
            console.error(`❌ FFmpeg error for ${videoId}:`, error);
            reject(error);
         });
      });
   }

   /**
    * Compress all videos with specified profile
    */
   async compressAllVideos(profileName = 'web', progressCallback = null) {
      const videoIds = Array.from(this.videoDatabase.keys());
      const results = [];
      
      console.log(`🚀 Starting batch compression with profile: ${profileName}`);
      console.log(`📊 Processing ${videoIds.length} videos`);

      for (const videoId of videoIds) {
         try {
            const result = await this.compressVideo(videoId, profileName, progressCallback);
            results.push(result);
         } catch (error) {
            console.error(`Failed to compress ${videoId}:`, error.message);
            results.push({
               videoId,
               error: error.message,
               success: false
            });
         }
      }

      const successful = results.filter(r => !r.error).length;
      const failed = results.length - successful;
      
      console.log(`✅ Batch compression completed: ${successful} successful, ${failed} failed`);
      
      return {
         profile: profileName,
         total: results.length,
         successful,
         failed,
         results
      };
   }

   /**
    * Build FFmpeg arguments for compression
    */
   buildFfmpegArgs(inputPath, outputPath, profile) {
      const args = [
         '-y', // Overwrite output file
         '-i', inputPath
      ];

      // Video codec
      if (profile.video?.codec) {
         args.push('-c:v', profile.video.codec);
      }

      // Bitrate
      if (profile.video?.bitrate) {
         args.push('-b:v', profile.video.bitrate);
      }

      // Resolution
      if (profile.video?.resolution) {
         args.push('-s', profile.video.resolution);
      }

      // Frame rate
      if (profile.video?.framerate) {
         args.push('-r', profile.video.framerate.toString());
      }

      // Audio codec
      if (profile.audio?.codec) {
         args.push('-c:a', profile.audio.codec);
      }

      // Audio bitrate
      if (profile.audio?.bitrate) {
         args.push('-b:a', profile.audio.bitrate);
      }

      // Additional options
      if (profile.options) {
         profile.options.forEach(option => {
            if (typeof option === 'string') {
               args.push(option);
            } else if (Array.isArray(option)) {
               args.push(...option);
            }
         });
      }

      // Output path
      args.push(outputPath);

      console.log('🔧 FFmpeg args:', args.join(' '));
      return args;
   }

   /**
    * Get list of compressed videos
    */
   getCompressedVideos() {
      const compressedDir = path.join(this.workdir, 'var', 'work', 'compressed');
      const compressed = [];

      if (!fs.existsSync(compressedDir)) {
         return compressed;
      }

      const profiles = fs.readdirSync(compressedDir);
      
      profiles.forEach(profile => {
         const profileDir = path.join(compressedDir, profile);
         if (fs.statSync(profileDir).isDirectory()) {
            const files = fs.readdirSync(profileDir);
            
            files.forEach(file => {
               if (file.endsWith('.mp4')) {
                  const filePath = path.join(profileDir, file);
                  const stats = fs.statSync(filePath);
                  const videoId = file.replace(`_${profile}.mp4`, '');
                  
                  compressed.push({
                     videoId,
                     profile,
                     filename: file,
                     path: filePath,
                     size: stats.size,
                     sizeFormatted: this.formatFileSize(stats.size),
                     created: stats.ctime,
                     modified: stats.mtime
                  });
               }
            });
         }
      });

      return compressed.sort((a, b) => b.modified - a.modified);
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
}