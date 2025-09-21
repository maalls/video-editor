import path from 'path';
import fs from 'fs';

import express from 'express';
import cors from 'cors';
import Database from './../Database/Database.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = new URL('.', import.meta.url).pathname;
const FRONTEND_DIR = path.join(__dirname, './../../', 'frontend');
export default class Server {
   constructor(videoPath, workdir) {
      this.app = app;
      this.port = PORT;
      this.videoPath = videoPath;
      this.workdir = workdir;
      this.videoDatabase = new Database(videoPath, workdir);
   }

   async start() {
      // Middleware
      app.use(cors());
      app.use(express.json());

      // Serve static files from frontend directory
      app.use('/static', express.static(path.join(FRONTEND_DIR, 'static')));

      const workDir = path.join(FRONTEND_DIR, '../../var/work');
      app.use('/work', express.static(workDir));

      console.log("work dir", workDir);
      
      // Video database - will store video info indexed by video ID

      /**
       * Scans the video directory and builds a database of video information
       */
      this.videoDatabase.load();

      /**
       * Extracts video information using ffprobe
       */

      // API Routes
      app.get('/', (req, res) => {
         res.sendFile(path.join(__dirname, './../../', 'frontend', 'index.html'));
      });

      app.get('/project', (req, res) => {
         const videos = this.videoDatabase.values();
         const project = {
            dailies: videos,
         };
         return res.json(project);
      });
      /**
       * GET /videos - List all available videos
       */
      app.get('/videos', (req, res) => {
         const videos = this.videoDatabase.values();

         res.json(videos);
      });

      /**
       * GET /video/:id - Get detailed video information by ID
       */
      app.get('/video/:id', (req, res) => {
         const videoId = req.params.id;

         if (!this.videoDatabase.has(videoId)) {
            return res.status(404).json({
               error: 'Video not found',
               message: `No video found with ID: ${videoId}`,
            });
         }

         const video = this.videoDatabase.get(videoId);
         res.json(video);
      });

      /**
       * GET /video/:id/exists - Check if a video exists
       */
      app.get('/video/:id/exists', (req, res) => {
         const videoId = req.params.id;
         const exists = this.videoDatabase.has(videoId);

         res.json({
            videoId,
            exists,
            message: exists ? 'Video found' : 'Video not found',
         });
      });

      /**
       * GET /video/:id/stream - Stream video file with range request support
       */
      app.get('/video/:id/stream', (req, res) => {
         const videoId = req.params.id;

         if (!this.videoDatabase.has(videoId)) {
            return res.status(404).json({
               error: 'Video not found',
               message: `No video found with ID: ${videoId}`,
            });
         }

         const videoPath = path.join(this.videoPath, videoId);

         // Check if file exists
         if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
               error: 'Video file not found',
               message: `Video file does not exist: ${videoId}`,
            });
         }

         const stat = fs.statSync(videoPath);
         const fileSize = stat.size;
         const range = req.headers.range;

         if (range) {
            // Handle range requests for video seeking
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = {
               'Content-Range': `bytes ${start}-${end}/${fileSize}`,
               'Accept-Ranges': 'bytes',
               'Content-Length': chunksize,
               'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
         } else {
            // Stream entire file
            const head = {
               'Content-Length': fileSize,
               'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
         }
      });

      /**
       * POST /refresh - Refresh the video database
       */
      app.post('/refresh', async (req, res) => {
         try {
            this.videoDatabase.refresh();
            res.json({
               message: 'Video database refreshed successfully',
               count: this.videoDatabase.size(),
            });
         } catch (err) {
            res.status(500).json({
               error: 'Failed to refresh video database',
               message: err.message,
            });
         }
      });

      // Health check endpoint
      app.get('/health', (req, res) => {
         res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            videoCount: this.videoDatabase.size(),
            videoPath: this.videoPath,
         });
      });

      // Serve frontend app
      app.get('/', (req, res) => {
         res.sendFile(path.join(this.workdir, 'frontend', 'index.html'));
      });

      // Error handling middleware
      app.use((err, req, res, next) => {
         console.error('Unhandled error:', err);
         res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
         });
      });

      // 404 handler
      app.use((req, res) => {
         res.status(404).json({
            error: 'Not found',
            message: `Route ${req.method} ${req.originalUrl} not found`,
         });
      });
      try {
         // Scan videos on startup
         await this.videoDatabase.load();

         app.listen(PORT, () => {
            console.log(`🚀 Video server running on http://localhost:${PORT}`);
            console.log(`📁 Video directory: ${this.videoPath}`);
            console.log(`📊 ${this.videoDatabase.size()} videos loaded`);
            console.log('\nAvailable endpoints:');
            console.log('  GET  /health           - Health check');
            console.log('  GET  /videos           - List all videos');
            console.log('  GET  /video/:id        - Get video info by ID');
            console.log('  GET  /video/:id/exists - Check if video exists');
            console.log('  GET  /video/:id/stream - Stream video file');
            console.log('  POST /refresh          - Refresh video database');
         });
      } catch (err) {
         console.error('Failed to start server:', err);
         process.exit(1);
      }
   }
}
