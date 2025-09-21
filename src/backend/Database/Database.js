import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
export default class Database {
   constructor(sourceFolder, workdir) {
      this.sourceFolder = sourceFolder;
      if (!workdir) {
         this.workdir = sourceFolder;
      } else {
         this.workdir = workdir;
      }
      this.databaseFile = path.join(workdir, 'database.json');
      this.data = {};
      this.compressionConfig = this.loadCompressionConfig();
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
      this.scan(true);
   }

   save() {
      fs.writeFileSync(this.databaseFile, JSON.stringify(this.data, null, 2));
   }

   load() {
      this.data = {};
      if (fs.existsSync(this.databaseFile)) {
         //console.log("Loading database from file:", this.databaseFile);
         const fileContent = fs.readFileSync(this.databaseFile);
         try {
            const data = JSON.parse(fileContent);
            this.data = data;
         } catch (e) {
            console.warning('Error parsing database file:', error);
            this.import();
         }
      } else {
         console.log('Database file does not exist:', this.databaseFile);
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
      const thumbnailDir = path.join(this.workdir, 'thumbnails');
      if (!fs.existsSync(thumbnailDir)) {
         fs.mkdirSync(thumbnailDir);
      }

      const fullPath = this.getVideoFullPath(videoFile);
      const thumbnailPath = path.join(thumbnailDir, `${path.basename(videoFile, '.MP4')}.jpg`);
      if (!fs.existsSync(thumbnailPath)) {
         const command = `/usr/local/bin/ffmpeg -i "${fullPath}" -ss 00:00:01.000 -vframes 1 "${thumbnailPath}"`;
         console.log('command', command);
         execSync(command);
         console.log(`Generated thumbnail for ${videoFile} at ${thumbnailPath}`);
      }
   }

   getVideoFilenames() {
      const files = fs.readdirSync(this.sourceFolder);
      const videoFiles = files.filter(file => file.endsWith('.MP4') && file.startsWith('GX'));
      return videoFiles;
   }

   getVideoInfoFromFilename(filename) {
      const fullPath = this.getVideoFullPath(filename);
      const ffprob = this.getFfprobeInfo(fullPath);
      const videoStream = ffprob.streams.find(s => s.codec_type === 'video');
      const audioStream = ffprob.streams.find(s => s.codec_type === 'audio');

      //console.log('filename', filename, ffprob)
      return {
         filename: filename,
         info: {
            ffprob: {
               source: ffprob,
               video: videoStream,
               audio: audioStream,
            },
         },
         created_at: ffprob.format.tags.creation_time,
      };
   }

   getVideoFullPath(filename) {
      return this.sourceFolder + '/' + filename;
   }

   getFfprobeInfo(filePath) {
      console.log('file path', filePath);
      const output = execSync(
         `/usr/local/bin/ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
      ).toString();

      try {
         const info = JSON.parse(output);
         return info;
      } catch (e) {
         console.error('Error parsing ffprobe output for file', filePath, e);
         throw e;
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

   // Video Compression Methods
   async compressVideo(filename, profileName = null, onProgress = null) {
      if (!this.compressionConfig || !this.compressionConfig.compression.enabled) {
         throw new Error('Video compression is not enabled or configured');
      }

      const profile = profileName 
         ? this.compressionConfig.compression.profiles[profileName]
         : this.compressionConfig.compression.profiles[this.compressionConfig.compression.defaultProfile];

      if (!profile) {
         throw new Error(`Compression profile '${profileName}' not found`);
      }

      const inputPath = this.getVideoFullPath(filename);
      const outputDir = path.resolve(this.compressionConfig.compression.outputDirectory);
      
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
         fs.mkdirSync(outputDir, { recursive: true });
      }

      const baseName = path.basename(filename, path.extname(filename));
      const outputFilename = `${baseName}${profile.suffix}.${profile.format}`;
      const outputPath = path.join(outputDir, outputFilename);

      // Check if file already exists and overwrite setting
      if (fs.existsSync(outputPath) && !this.compressionConfig.compression.options.overwriteExisting) {
         console.log(`Compressed file already exists: ${outputPath}`);
         return {
            success: true,
            message: 'File already exists',
            outputPath: outputPath,
            profile: profile.name
         };
      }

      console.log(`🎬 Starting compression: ${filename} -> ${outputFilename} (${profile.name})`);

      return new Promise((resolve, reject) => {
         const args = this.buildFfmpegArgs(inputPath, outputPath, profile);
         const ffmpeg = spawn(this.compressionConfig.compression.ffmpegPath, args);

         let duration = 0;
         let progress = 0;

         ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            
            // Parse duration from ffmpeg output
            const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}.\d{2})/);
            if (durationMatch) {
               const hours = parseInt(durationMatch[1]);
               const minutes = parseInt(durationMatch[2]);
               const seconds = parseFloat(durationMatch[3]);
               duration = hours * 3600 + minutes * 60 + seconds;
            }

            // Parse current time for progress
            const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}.\d{2})/);
            if (timeMatch && duration > 0) {
               const hours = parseInt(timeMatch[1]);
               const minutes = parseInt(timeMatch[2]);
               const seconds = parseFloat(timeMatch[3]);
               const currentTime = hours * 3600 + minutes * 60 + seconds;
               progress = Math.round((currentTime / duration) * 100);

               if (onProgress) {
                  onProgress({
                     filename,
                     profile: profile.name,
                     progress,
                     currentTime,
                     duration,
                     outputPath
                  });
               }
            }

            if (this.compressionConfig.compression.options.logLevel === 'debug') {
               console.log('FFmpeg:', output);
            }
         });

         ffmpeg.on('close', (code) => {
            if (code === 0) {
               console.log(`✅ Successfully compressed: ${filename} -> ${outputFilename}`);
               resolve({
                  success: true,
                  message: 'Compression completed successfully',
                  outputPath: outputPath,
                  profile: profile.name,
                  inputSize: this.getFileSize(inputPath),
                  outputSize: this.getFileSize(outputPath)
               });
            } else {
               reject(new Error(`FFmpeg exited with code ${code}`));
            }
         });

         ffmpeg.on('error', (error) => {
            reject(new Error(`FFmpeg process error: ${error.message}`));
         });
      });
   }

   buildFfmpegArgs(inputPath, outputPath, profile) {
      const args = [
         '-i', inputPath,
         '-c:v', profile.videoCodec,
         '-c:a', profile.audioCodec,
         '-b:v', profile.videoBitrate,
         '-b:a', profile.audioBitrate,
         '-crf', profile.crf.toString(),
         '-preset', profile.preset,
         '-r', profile.fps.toString()
      ];

      // Add resolution scaling if specified
      if (profile.resolution && profile.resolution !== 'original') {
         args.push('-vf', `scale=${profile.resolution}`);
      }

      // Add overwrite flag if enabled
      if (this.compressionConfig.compression.options.overwriteExisting) {
         args.push('-y');
      }

      args.push(outputPath);
      return args;
   }

   async compressAllVideos(profileName = null, onProgress = null) {
      const videos = this.getVideoFilenames();
      const results = [];

      console.log(`📦 Starting batch compression of ${videos.length} videos`);

      for (let i = 0; i < videos.length; i++) {
         const filename = videos[i];
         try {
            console.log(`[${i + 1}/${videos.length}] Processing: ${filename}`);
            
            const result = await this.compressVideo(filename, profileName, (progress) => {
               if (onProgress) {
                  onProgress({
                     ...progress,
                     batchProgress: {
                        current: i + 1,
                        total: videos.length,
                        overallProgress: Math.round(((i + progress.progress / 100) / videos.length) * 100)
                     }
                  });
               }
            });

            results.push({ filename, success: true, ...result });
         } catch (error) {
            console.error(`❌ Failed to compress ${filename}:`, error.message);
            results.push({ filename, success: false, error: error.message });
         }
      }

      const successful = results.filter(r => r.success).length;
      console.log(`🎉 Batch compression completed: ${successful}/${videos.length} successful`);

      return {
         total: videos.length,
         successful,
         failed: videos.length - successful,
         results
      };
   }

   getCompressionProfiles() {
      if (!this.compressionConfig) return {};
      return this.compressionConfig.compression.profiles;
   }

   getFileSize(filePath) {
      try {
         const stats = fs.statSync(filePath);
         return stats.size;
      } catch (error) {
         return 0;
      }
   }

   formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
   }
}
