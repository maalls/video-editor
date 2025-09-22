import path from 'path';
import fs from 'fs';

import express from 'express';
import cors from 'cors';
import Database from './../Database/Database.js';
import { Compressor } from '../Compressor/Compressor.js';
import { Monitoring } from '../Monitoring/Monitoring.js';

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
      
      // Initialize specialized service classes
      this.compressor = new Compressor(this.videoDatabase, workdir);
      this.monitoring = new Monitoring(workdir);
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

      /**
       * GET /compression/profiles - Get available compression profiles
       */
      app.get('/compression/profiles', (req, res) => {
         try {
            const profiles = this.compressor.getProfiles();
            res.json({
               profiles,
               default: 'web'
            });
         } catch (err) {
            res.status(500).json({
               error: 'Failed to get compression profiles',
               message: err.message,
            });
         }
      });

      /**
       * POST /compress/:id - Compress a specific video
       */
      app.post('/compress/:id', async (req, res) => {
         const videoId = req.params.id;
         const { profile } = req.body;

         if (!this.videoDatabase.has(videoId)) {
            return res.status(404).json({
               error: 'Video not found',
               message: `No video found with ID: ${videoId}`,
            });
         }

         try {
            const result = await this.compressor.compressVideo(videoId, profile, (progress) => {
               // Could implement WebSocket for real-time progress updates
               console.log(`Compression progress: ${progress.filename} - ${progress.progress}%`);
            });

            res.json({
               message: 'Video compression completed',
               videoId,
               ...result
            });
         } catch (err) {
            res.status(500).json({
               error: 'Video compression failed',
               message: err.message,
               videoId
            });
         }
      });

      /**
       * POST /compress/batch - Compress all videos with specified profile
       */
      app.post('/compress/batch', async (req, res) => {
         const { profile } = req.body;

         try {
            const result = await this.compressor.compressAllVideos(profile, (progress) => {
               console.log(`Batch compression: [${progress.batchProgress.current}/${progress.batchProgress.total}] ${progress.filename} - ${progress.progress}%`);
            });

            res.json({
               message: 'Batch compression completed',
               ...result
            });
         } catch (err) {
            res.status(500).json({
               error: 'Batch compression failed',
               message: err.message,
            });
         }
      });

      /**
       * GET /compressed - List compressed videos
       */
      app.get('/compressed', (req, res) => {
         try {
            const files = this.compressor.getCompressedVideos();
            res.json({ files });
         } catch (error) {
            res.status(500).json({ error: 'Failed to list compressed files', message: error.message });
         }
      });

      /**
       * GET /compression/workspace - Get workspace-specific compression profiles
       */
      app.get('/compression/workspace', (req, res) => {
         try {
            const workspaceProfiles = this.compressor.getWorkspaceProfiles();
            const defaultProfile = this.videoDatabase.getDefaultWorkspaceProfile();
            
            res.json({
               profiles: workspaceProfiles,
               default: defaultProfile,
               description: "Video editing optimized compression profiles"
            });
         } catch (err) {
            res.status(500).json({
               error: 'Failed to get workspace compression profiles',
               message: err.message,
            });
         }
      });

      /**
       * POST /compress/workspace/:id - Compress video with workspace profile
       */
      app.post('/compress/workspace/:id', async (req, res) => {
         const videoId = req.params.id;
         const { profile = 'workspace_basic' } = req.body;

         if (!this.videoDatabase.has(videoId)) {
            return res.status(404).json({
               error: 'Video not found',
               message: `No video found with ID: ${videoId}`,
            });
         }

         // Validate it's a workspace profile
         const workspaceProfiles = this.compressor.getWorkspaceProfiles();
         if (!workspaceProfiles[profile]) {
            return res.status(400).json({
               error: 'Invalid workspace profile',
               message: `Profile '${profile}' is not a workspace editing profile`,
               availableProfiles: Object.keys(workspaceProfiles)
            });
         }

         try {
            const result = await this.compressor.compressVideo(videoId, profile, (progress) => {
               console.log(`Workspace compression: ${progress.filename} - ${progress.progress}%`);
            });

            res.json({
               message: 'Workspace video compression completed',
               videoId,
               profile: workspaceProfiles[profile].name,
               optimizedForEditing: true,
               ...result
            });
         } catch (err) {
            res.status(500).json({
               error: 'Workspace video compression failed',
               message: err.message,
               videoId
            });
         }
      });

      // File monitoring endpoints
      app.get('/monitoring/files', async (req, res) => {
         try {
            console.log('📊 Generating file monitoring report...');
            
            const report = await this.monitoring.generateFileReport();
            res.json({ 
               success: true, 
               message: 'File monitoring report generated successfully',
               data: report
            });
         } catch (error) {
            console.error('File monitoring error:', error);
            res.status(500).json({ 
               success: false, 
               error: error.message 
            });
         }
      });

      app.get('/monitoring/files/json', (req, res) => {
         try {
            const data = this.monitoring.getLatestData();
            
            if (!data) {
               return res.status(404).json({
                  success: false,
                  error: 'No monitoring data found. Generate a report first.'
               });
            }

            res.json({
               success: true,
               data: data
            });
         } catch (error) {
            console.error('Error reading monitoring data:', error);
            res.status(500).json({ 
               success: false, 
               error: error.message 
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
            console.log('  GET  /compression/profiles - Get compression profiles');
            console.log('  GET  /compression/workspace - Get workspace editing profiles');
            console.log('  POST /compress/:id     - Compress specific video');
            console.log('  POST /compress/workspace/:id - Compress with workspace profile');
            console.log('  POST /compress/batch   - Compress all videos');
            console.log('  GET  /compressed       - List compressed videos');
            console.log('  GET  /monitoring/files - Generate file monitoring report');
            console.log('  GET  /monitoring/files/json - Get latest monitoring data');
         });
      } catch (err) {
         console.error('Failed to start server:', err);
         process.exit(1);
      }
   }
}
