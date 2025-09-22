import path from 'path';
import fs from 'fs';

import express from 'express';
import cors from 'cors';
import Database from './../Database/Database.js';
import ProjectDatabase from './../Database/ProjectDatabase.js';
import ProjectManager from './../Project/ProjectManager.js';
import { Compressor } from '../Compressor/Compressor.js';
import { Monitoring } from '../Monitoring/Monitoring.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = new URL('.', import.meta.url).pathname;
const FRONTEND_DIR = path.join(__dirname, './../../', 'frontend');

export default class MultiProjectServer {
   constructor(videoPath, workdir) {
      this.app = app;
      this.port = PORT;
      this.videoPath = videoPath; // Keep for backward compatibility
      this.workdir = workdir;

      // Initialize project management
      this.projectManager = new ProjectManager(workdir);

      // Legacy single-project database (for backward compatibility)
      this.videoDatabase = new Database(videoPath, workdir);

      // Project-specific databases cache
      this.projectDatabases = new Map();

      // Initialize specialized service classes
      this.compressor = new Compressor(this.videoDatabase, workdir);
      this.monitoring = new Monitoring(workdir);

      // Connection monitoring
      this.activeConnections = new Map();
      this.connectionStats = {
         total: 0,
         active: 0,
         videoStreams: 0,
         maxConcurrent: 0,
      };
   }

   /**
    * Get or create project database instance
    */
   getProjectDatabase(projectSlug) {
      if (!this.projectDatabases.has(projectSlug)) {
         const projectDb = new ProjectDatabase(this.projectManager, projectSlug);
         // Import videos if database is empty or doesn't exist
         try {
            projectDb.import();
         } catch (error) {
            console.warn(`Could not import videos for project ${projectSlug}:`, error.message);
         }
         this.projectDatabases.set(projectSlug, projectDb);
      }
      return this.projectDatabases.get(projectSlug);
   }

   async start() {
      // Middleware
      app.use(cors());
      app.use(express.json());

      // Serve static files from frontend directory
      app.use('/static', express.static(path.join(FRONTEND_DIR, 'static')));

      const workDir = path.join(FRONTEND_DIR, '../../var/work');
      app.use('/work', express.static(workDir));

      console.log('work dir', workDir);

      // ===============================
      // PROJECT MANAGEMENT ENDPOINTS
      // ===============================

      /**
       * GET /projects - List all projects
       */
      app.get('/projects', (req, res) => {
         try {
            const projects = this.projectManager.listProjects();
            res.json({
               success: true,
               projects: projects,
            });
         } catch (error) {
            res.status(500).json({
               success: false,
               error: 'Failed to list projects',
               message: error.message,
            });
         }
      });

      /**
       * POST /projects - Create a new project
       */
      app.post('/projects', (req, res) => {
         const { name, slug } = req.body;

         if (!name) {
            return res.status(400).json({
               success: false,
               error: 'Project name is required',
            });
         }

         try {
            const project = this.projectManager.createProject(name, slug);
            res.status(201).json({
               success: true,
               message: 'Project created successfully',
               project: project,
            });
         } catch (error) {
            res.status(400).json({
               success: false,
               error: 'Failed to create project',
               message: error.message,
            });
         }
      });

      /**
       * GET /projects/:slug - Get project information
       */
      app.get('/projects/:slug', (req, res) => {
         const { slug } = req.params;

         try {
            const project = this.projectManager.getProject(slug);
            const stats = this.projectManager.getProjectStats(slug);

            res.json({
               success: true,
               project: {
                  ...project,
                  stats: stats,
               },
            });
         } catch (error) {
            res.status(404).json({
               success: false,
               error: 'Project not found',
               message: error.message,
            });
         }
      });

      /**
       * PUT /projects/:slug - Update project information
       */
      app.put('/projects/:slug', (req, res) => {
         const { slug } = req.params;
         const { name } = req.body;

         if (!name) {
            return res.status(400).json({
               success: false,
               error: 'Project name is required',
            });
         }

         try {
            this.projectManager.renameProject(slug, name);
            res.json({
               success: true,
               message: 'Project updated successfully',
            });
         } catch (error) {
            res.status(404).json({
               success: false,
               error: 'Failed to update project',
               message: error.message,
            });
         }
      });

      /**
       * DELETE /projects/:slug - Delete a project
       */
      app.delete('/projects/:slug', (req, res) => {
         const { slug } = req.params;

         try {
            this.projectManager.deleteProject(slug);

            // Remove from database cache
            if (this.projectDatabases.has(slug)) {
               this.projectDatabases.delete(slug);
            }

            res.json({
               success: true,
               message: 'Project deleted successfully',
            });
         } catch (error) {
            res.status(404).json({
               success: false,
               error: 'Failed to delete project',
               message: error.message,
            });
         }
      });

      // ===============================
      // PROJECT-SPECIFIC VIDEO ENDPOINTS
      // ===============================

      /**
       * GET /projects/:slug/videos - List videos for a project
       */
      app.get('/projects/:slug/videos', (req, res) => {
         const { slug } = req.params;

         try {
            const projectDb = this.getProjectDatabase(slug);
            const videos = projectDb.values();
            res.json({
               success: true,
               project: slug,
               videos: videos,
            });
         } catch (error) {
            res.status(404).json({
               success: false,
               error: 'Project not found or failed to load videos',
               message: error.message,
            });
         }
      });

      /**
       * GET /projects/:slug/project - Get project information with videos (dailies)
       */
      app.get('/projects/:slug/project', (req, res) => {
         const { slug } = req.params;

         try {
            const projectDb = this.getProjectDatabase(slug);
            const videos = projectDb.values();
            const projectInfo = this.projectManager.getProject(slug);

            const project = {
               ...projectInfo,
               dailies: videos,
            };

            res.json(project);
         } catch (error) {
            res.status(404).json({
               success: false,
               error: 'Project not found',
               message: error.message,
            });
         }
      });

      /**
       * GET /projects/:slug/video/:id - Get video information
       */
      app.get('/projects/:slug/video/:id', (req, res) => {
         const { slug, id } = req.params;

         try {
            const projectDb = this.getProjectDatabase(slug);

            if (!projectDb.has(id)) {
               return res.status(404).json({
                  error: 'Video not found',
                  message: `No video found with ID: ${id} in project ${slug}`,
               });
            }

            const video = projectDb.get(id);
            res.json(video);
         } catch (error) {
            res.status(404).json({
               success: false,
               error: 'Project not found',
               message: error.message,
            });
         }
      });

      /**
       * GET /projects/:slug/video/:id/exists - Check if video exists in project
       */
      app.get('/projects/:slug/video/:id/exists', (req, res) => {
         const { slug, id } = req.params;

         try {
            const projectDb = this.getProjectDatabase(slug);
            const exists = projectDb.has(id);

            res.json({
               videoId: id,
               project: slug,
               exists,
               message: exists ? 'Video found' : 'Video not found',
            });
         } catch (error) {
            res.status(404).json({
               success: false,
               error: 'Project not found',
               message: error.message,
            });
         }
      });

      /**
       * GET /projects/:slug/video/:id/stream - Stream video from project
       */
      app.get('/projects/:slug/video/:id/stream', (req, res) => {
         const { slug, id } = req.params;
         const connectionId = `stream-${slug}-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

         // Track this connection
         this.trackConnection(connectionId, 'video-stream', req);

         try {
            const projectDb = this.getProjectDatabase(slug);

            if (!projectDb.has(id)) {
               this.closeConnection(connectionId);
               return res.status(404).json({
                  error: 'Video not found',
                  message: `No video found with ID: ${id} in project ${slug}`,
               });
            }

            const videoPath = projectDb.getVideoFullPath(id);

            // Check if file exists
            if (!fs.existsSync(videoPath)) {
               this.closeConnection(connectionId);
               return res.status(404).json({
                  error: 'Video file not found',
                  message: `Video file does not exist: ${id} in project ${slug}`,
               });
            }

            const stat = fs.statSync(videoPath);
            const fileSize = stat.size;
            const range = req.headers.range;

            // Handle connection cleanup when client disconnects
            req.on('close', () => {
               this.closeConnection(connectionId);
            });

            res.on('finish', () => {
               this.closeConnection(connectionId);
            });

            if (range) {
               // Handle range requests for video seeking
               const parts = range.replace(/bytes=/, '').split('-');
               const start = parseInt(parts[0], 10);
               const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
               const chunksize = end - start + 1;
               const file = fs.createReadStream(videoPath, { start, end });

               file.on('error', () => {
                  this.closeConnection(connectionId);
               });

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
               const file = fs.createReadStream(videoPath);

               file.on('error', () => {
                  this.closeConnection(connectionId);
               });

               const head = {
                  'Content-Length': fileSize,
                  'Content-Type': 'video/mp4',
               };
               res.writeHead(200, head);
               file.pipe(res);
            }
         } catch (error) {
            this.closeConnection(connectionId);
            res.status(404).json({
               success: false,
               error: 'Project not found',
               message: error.message,
            });
         }
      });

      /**
       * POST /projects/:slug/refresh - Refresh project video database
       */
      app.post('/projects/:slug/refresh', async (req, res) => {
         const { slug } = req.params;

         try {
            const projectDb = this.getProjectDatabase(slug);
            projectDb.refresh();
            res.json({
               success: true,
               message: 'Project video database refreshed successfully',
               project: slug,
               count: projectDb.size(),
            });
         } catch (error) {
            res.status(404).json({
               success: false,
               error: 'Failed to refresh project video database',
               message: error.message,
            });
         }
      });

      // ===============================
      // LEGACY ENDPOINTS (for backward compatibility)
      // ===============================

      /**
       * GET /project - Legacy endpoint that returns the old single-project format
       */
      app.get('/project', (req, res) => {
         const videos = this.videoDatabase.values();
         const project = {
            dailies: videos,
         };
         return res.json(project);
      });

      /**
       * GET /videos - Legacy endpoint
       */
      app.get('/videos', (req, res) => {
         const videos = this.videoDatabase.values();
         res.json(videos);
      });

      /**
       * GET /video/:id - Legacy endpoint for video info
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
       * GET /video/:id/exists - Legacy endpoint
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
       * GET /video/:id/stream - Legacy endpoint for video streaming
       */
      app.get('/video/:id/stream', (req, res) => {
         const videoId = req.params.id;
         const connectionId = `stream-legacy-${videoId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

         // Track this connection
         this.trackConnection(connectionId, 'video-stream', req);

         if (!this.videoDatabase.has(videoId)) {
            this.closeConnection(connectionId);
            return res.status(404).json({
               error: 'Video not found',
               message: `No video found with ID: ${videoId}`,
            });
         }

         const videoPath = path.join(this.videoPath, videoId);

         // Check if file exists
         if (!fs.existsSync(videoPath)) {
            this.closeConnection(connectionId);
            return res.status(404).json({
               error: 'Video file not found',
               message: `Video file does not exist: ${videoId}`,
            });
         }

         const stat = fs.statSync(videoPath);
         const fileSize = stat.size;
         const range = req.headers.range;

         // Handle connection cleanup when client disconnects
         req.on('close', () => {
            this.closeConnection(connectionId);
         });

         res.on('finish', () => {
            this.closeConnection(connectionId);
         });

         if (range) {
            // Handle range requests for video seeking
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });

            file.on('error', () => {
               this.closeConnection(connectionId);
            });

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
            const file = fs.createReadStream(videoPath);

            file.on('error', () => {
               this.closeConnection(connectionId);
            });

            const head = {
               'Content-Length': fileSize,
               'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            file.pipe(res);
         }
      });

      /**
       * POST /refresh - Legacy endpoint
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

      // ===============================
      // SHARED ENDPOINTS (compression, monitoring, etc.)
      // ===============================

      /**
       * GET /compression/profiles - Get available compression profiles
       */
      app.get('/compression/profiles', (req, res) => {
         try {
            const profiles = this.compressor.getProfiles();
            res.json({
               profiles,
               default: 'web',
            });
         } catch (err) {
            res.status(500).json({
               error: 'Failed to get compression profiles',
               message: err.message,
            });
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
               description: 'Video editing optimized compression profiles',
            });
         } catch (err) {
            res.status(500).json({
               error: 'Failed to get workspace compression profiles',
               message: err.message,
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
               data: report,
            });
         } catch (error) {
            console.error('File monitoring error:', error);
            res.status(500).json({
               success: false,
               error: error.message,
            });
         }
      });

      app.get('/monitoring/files/json', (req, res) => {
         try {
            const data = this.monitoring.getLatestData();

            if (!data) {
               return res.status(404).json({
                  success: false,
                  error: 'No monitoring data found. Generate a report first.',
               });
            }

            res.json({
               success: true,
               data: data,
            });
         } catch (error) {
            console.error('Error reading monitoring data:', error);
            res.status(500).json({
               success: false,
               error: error.message,
            });
         }
      });

      /**
       * GET /connections - Get current connection statistics
       */
      app.get('/connections', (req, res) => {
         try {
            const stats = this.getConnectionStats();
            res.json({
               success: true,
               data: stats,
            });
         } catch (error) {
            console.error('Error getting connection stats:', error);
            res.status(500).json({
               success: false,
               error: 'Failed to get connection statistics',
               message: error.message,
            });
         }
      });

      // Health check endpoint
      app.get('/health', (req, res) => {
         const projectCount = this.projectManager.listProjects().length;
         res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            videoCount: this.videoDatabase.size(),
            projectCount: projectCount,
            videoPath: this.videoPath,
         });
      });

      // API Routes
      app.get('/', (req, res) => {
         res.sendFile(path.join(__dirname, './../../', 'frontend', 'index.html'));
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
         // Scan videos on startup for legacy database
         await this.videoDatabase.load();

         app.listen(PORT, () => {
            const projectCount = this.projectManager.listProjects().length;
            console.log(`🚀 Multi-Project Video server running on http://localhost:${PORT}`);
            console.log(`📁 Legacy video directory: ${this.videoPath}`);
            console.log(`📊 ${this.videoDatabase.size()} legacy videos loaded`);
            console.log(`🗂️  ${projectCount} projects available`);
            console.log('\nProject endpoints:');
            console.log('  GET    /projects              - List all projects');
            console.log('  POST   /projects              - Create new project');
            console.log('  GET    /projects/:slug        - Get project info');
            console.log('  PUT    /projects/:slug        - Update project');
            console.log('  DELETE /projects/:slug        - Delete project');
            console.log('  GET    /projects/:slug/videos - List project videos');
            console.log('  GET    /projects/:slug/project - Get project with dailies');
            console.log('  GET    /projects/:slug/video/:id - Get video info');
            console.log('  GET    /projects/:slug/video/:id/stream - Stream video');
            console.log('  POST   /projects/:slug/refresh - Refresh project database');
            console.log('\nLegacy endpoints (backward compatibility):');
            console.log('  GET  /health           - Health check');
            console.log('  GET  /videos           - List all videos');
            console.log('  GET  /video/:id        - Get video info by ID');
            console.log('  GET  /video/:id/stream - Stream video file');
            console.log('  POST /refresh          - Refresh video database');
         });
      } catch (err) {
         console.error('Failed to start server:', err);
         process.exit(1);
      }
   }

   trackConnection(connectionId, type, req) {
      const connection = {
         id: connectionId,
         type: type,
         startTime: Date.now(),
         clientIP: req.ip || req.connection.remoteAddress,
         userAgent: req.get('User-Agent'),
      };

      this.activeConnections.set(connectionId, connection);
      this.connectionStats.total++;
      this.connectionStats.active = this.activeConnections.size;

      if (type === 'video-stream') {
         this.connectionStats.videoStreams++;
      }

      if (this.connectionStats.active > this.connectionStats.maxConcurrent) {
         this.connectionStats.maxConcurrent = this.connectionStats.active;
      }

      console.log(
         `🔗 New ${type} connection: ${connectionId} from ${connection.clientIP} (Active: ${this.connectionStats.active})`
      );

      return connectionId;
   }

   closeConnection(connectionId) {
      if (this.activeConnections.has(connectionId)) {
         const connection = this.activeConnections.get(connectionId);
         const duration = Date.now() - connection.startTime;

         this.activeConnections.delete(connectionId);
         this.connectionStats.active = this.activeConnections.size;

         if (connection.type === 'video-stream') {
            this.connectionStats.videoStreams--;
         }

         console.log(
            `✅ Connection closed: ${connectionId} (Duration: ${duration}ms, Active: ${this.connectionStats.active})`
         );
      }
   }

   getConnectionStats() {
      return {
         ...this.connectionStats,
         connections: Array.from(this.activeConnections.values()).map(conn => ({
            id: conn.id,
            type: conn.type,
            duration: Date.now() - conn.startTime,
            clientIP: conn.clientIP,
         })),
      };
   }
}
