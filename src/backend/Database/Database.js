import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
}
