import UiBuilder from './UiBuilder.js';

class VideoLibraryApp {
   constructor() {
      console.log('🚀 VideoLibraryApp constructor called');
      this.apiBaseUrl = 'http://localhost:3000';
      this.projects = []; // All available projects
      this.currentProject = null; // Currently selected project
      this.currentProjectSlug = null; // Currently selected project slug
      this.project = null; // Legacy compatibility
      this.filteredVideos = [];
      this.isLoading = false;
      this.uiBuilder = new UiBuilder();

      // Load debug configuration
      this.debugConfig = {
         debug: true,
         check_server_connections: true,
         debug_timeline_clicks: true,
         show_video_metadata: false,
         log_video_events: true,
         connection_check_interval: 10000,
         server_health_check_interval: 300000,
      };
      this.loadDebugConfig();

      // Server connection monitoring (display only)
      this.serverConnectionStats = {
         active: 0,
         total: 0,
         maxConcurrent: 0,
      };

      this.configuration = {
         timeline: {
            height: 100,
         },
         assets: {
            iconPath: 'static/assets/icons/',
            robotIcon: {
               svg: 'robot_icon.svg',
               sizes: {
                  16: 'robot_icon_16x16.png',
                  32: 'robot_icon_32x32.png',
                  64: 'robot_icon_64x64.png',
                  128: 'robot_icon_128x128.png',
                  512: 'robot_icon_512x512.png',
               },
            },
         },
      };

      // Log environment info
      console.log('🌍 Environment:', {
         userAgent: navigator.userAgent,
         url: window.location.href,
         apiBaseUrl: this.apiBaseUrl,
      });

      this.start();
   }

   /**
    * Parse URL parameters for project ID
    */
   getUrlProjectId() {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('project') || urlParams.get('projectId') || urlParams.get('id');
      console.log('🔗 URL project parameter:', projectId);
      return projectId;
   }

   /**
    * Update URL with current project ID without page reload
    */
   updateUrlProjectId(projectSlug) {
      if (!projectSlug) return;
      
      const url = new URL(window.location);
      url.searchParams.set('project', projectSlug);
      window.history.replaceState({}, '', url);
      console.log('🔗 Updated URL with project:', projectSlug);
   }

   async loadDebugConfig() {
      try {
         const response = await fetch('/debug.json');
         if (response.ok) {
            const config = await response.json();
            this.debugConfig = { ...this.debugConfig, ...config };
            console.log('🐛 Debug config loaded:', this.debugConfig);
         } else {
            console.warn('⚠️ Could not load debug.json, using defaults');
         }
      } catch (error) {
         console.warn('⚠️ Error loading debug config:', error.message);
      }
   }

   toggleDebugMode() {
      this.debugConfig.debug = !this.debugConfig.debug;
      console.log('🐛 Debug mode:', this.debugConfig.debug ? 'ON' : 'OFF');

      // Update connection monitor visibility
      this.updateDebugUI();

      // Save to localStorage for persistence
      localStorage.setItem('debug_mode', this.debugConfig.debug.toString());
   }

   updateDebugUI() {
      const monitor = document.getElementById('connection-monitor');
      const debugToggle = document.getElementById('debug-toggle');

      if (monitor) {
         monitor.style.display =
            this.debugConfig.debug && this.debugConfig.check_server_connections ? 'block' : 'none';
      }

      if (debugToggle) {
         debugToggle.textContent = this.debugConfig.debug ? '🐛 Debug: ON' : '🐛 Debug: OFF';
         debugToggle.className = `btn btn-sm ${this.debugConfig.debug ? 'btn-warning' : 'btn-secondary'}`;
      }
   }

   async checkServerStatus() {
      console.log('🔍 Checking server status...');

      try {
         const response = await fetch(`${this.apiBaseUrl}/health`);
         const data = await response.json();

         if (response.ok && data.status === 'healthy') {
            console.log('✅ Server is healthy:', data);
         } else {
            console.warn('⚠️ Server status not healthy:', data);
         }
      } catch (error) {
         console.error('❌ Server check failed:', error);
      }
   }

   async start() {
      // Create Bootstrap header with robot logo, project selector, and connection monitor
      const header = this.uiBuilder.createTag('header');
      header.className = 'bg-primary text-white';
      header.innerHTML = `
         <div class="container-fluid">
            <div class="row align-items-center py-2">
               <div class="col-md-3">
                  <div class="d-flex align-items-center">
                     <h5 class="mb-0 text-white">🤖 VIAI</h5>
                     <small class="ms-2 opacity-75">Video Editor AI</small>
                  </div>
               </div>
               <div class="col-md-6 text-center">
                  <div id="project-selector" class="d-flex align-items-center justify-content-center gap-3">
                     <select id="project-select" class="form-select form-select-sm" style="width: auto; min-width: 200px;">
                        <option>Loading projects...</option>
                     </select>
                     <button id="new-project-btn" class="btn btn-sm btn-outline-light" title="Create New Project">
                        ➕ New Project
                     </button>
                  </div>
               </div>
               <div class="col-md-3 text-end">
                  <div class="d-flex align-items-center justify-content-end gap-2">
                     <button id="share-project-btn" class="btn btn-sm btn-outline-light" title="Share project URL" style="display: none;">
                        🔗 Share
                     </button>
                     <small class="opacity-75">Multi-Project Mode</small>
                  </div>
               </div>
            </div>
         </div>
      `;

      // Create footer with debug controls
      const footer = this.uiBuilder.createTag('footer');
      footer.className = 'bg-dark text-white py-2 mt-auto';
      footer.innerHTML = `
         <div class="container-fluid">
            <div class="row align-items-center">
               <div class="col-md-6">
                  <div class="d-flex align-items-center gap-3">
                     <button id="debug-toggle" class="btn btn-sm btn-secondary" title="Toggle debug mode">
                        🐛 Debug: OFF
                     </button>
                     <div id="connection-monitor" class="small opacity-75" title="Real-time server connection monitoring" style="display: none;">
                        <span class="badge bg-secondary">Server: 0 active</span>
                     </div>
                  </div>
               </div>
               <div class="col-md-6 text-end">
                  <small class="opacity-75">VIAI Debug Console</small>
               </div>
            </div>
         </div>
      `;

      this.app = {
         element: this.uiBuilder.container,
         childrens: {
            header: {
               element: header,
            },
            top: {
               element: this.uiBuilder.createTag('div', null, 'top'),
               childrens: {
                  player: {
                     element: this.createPlayer(),
                  },
               },
            },
            main: {
               element: this.uiBuilder.createTag('div', null, 'main timeline'),
            },
            footer: {
               element: footer,
            },
         },
      };

      let context = this.uiBuilder.container;
      this.addElements(this.app);

      // Set up debug toggle button
      const debugToggle = document.getElementById('debug-toggle');
      if (debugToggle) {
         debugToggle.addEventListener('click', () => {
            this.toggleDebugMode();
         });
      }

      // Check localStorage for saved debug preference
      const savedDebugMode = localStorage.getItem('debug_mode');
      if (savedDebugMode !== null) {
         this.debugConfig.debug = savedDebugMode === 'true';
      }

      // Initialize debug UI
      this.updateDebugUI();

      try {
         console.log('Fetching projects from API...');
         await this.loadProjects();

         // Set up project selector event handlers
         this.setupProjectSelector();

         // Check for project ID in URL parameters first
         const urlProjectId = this.getUrlProjectId();
         let targetProject = null;

         if (urlProjectId) {
            // Try to find project by slug
            targetProject = this.projects.find(p => p.slug === urlProjectId);
            
            if (targetProject) {
               console.log('✅ Found project from URL:', targetProject.name);
            } else {
               console.warn('⚠️ Project not found in URL:', urlProjectId);
               this.showError('Project Not Found', `Project "${urlProjectId}" was not found. Loading first available project instead.`);
            }
         }

         // Load target project or fallback to first available project
         if (targetProject) {
            await this.selectProject(targetProject.slug);
         } else if (this.projects.length > 0) {
            await this.selectProject(this.projects[0].slug);
         } else {
            // No projects available, show empty state
            this.showEmptyState();
         }

         // Global error handling for better debugging
         window.addEventListener('error', event => {
            console.error('🚨 Global Error:', {
               message: event.message,
               filename: event.filename,
               line: event.lineno,
               column: event.colno,
               error: event.error,
            });
         });

         window.addEventListener('unhandledrejection', event => {
            console.error('🚨 Unhandled Promise Rejection:', event.reason);
         });

         // Clean up resources when page is about to be closed
         window.addEventListener('beforeunload', () => {
            this.cleanupVideoResources();
         });

         // Clean up when page becomes hidden (mobile/tab switching)
         document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
               const player = this.getPlayer();
               if (player && !player.paused) {
                  player.pause();
                  console.log('🔇 Paused video due to page visibility change');
               }
            }
         });

         // Initialize connection monitoring if enabled
         if (this.debugConfig.check_server_connections) {
            this.fetchServerConnectionStats();
         }
      } catch (error) {
         console.log('error:', error);

         const errorAlert = document.createElement('div');
         errorAlert.className = 'alert alert-danger';
         errorAlert.innerHTML = `
            <h4 class="alert-heading">Connection Error!</h4>
            <p><strong>Error:</strong> ${error.message}</p>
            <hr>
            <p class="mb-0">Make sure your server is running on <code>http://localhost:3000</code></p>
         `;
         this.uiBuilder.container.append(errorAlert);
      }
      console.log('app view created');
   }

   async loadProjects() {
      try {
         const response = await fetch(`${this.apiBaseUrl}/projects`);
         const data = await response.json();

         if (data.success) {
            // Load basic project info and stats
            this.projects = [];

            for (const project of data.projects) {
               try {
                  // Get project details including stats
                  const detailResponse = await fetch(`${this.apiBaseUrl}/projects/${project.slug}`);
                  const detailData = await detailResponse.json();

                  if (detailData.success) {
                     this.projects.push({
                        ...project,
                        stats: detailData.project.stats,
                     });
                  } else {
                     this.projects.push(project);
                  }
               } catch (err) {
                  console.warn(`Could not load stats for ${project.slug}:`, err);
                  this.projects.push(project);
               }
            }

            console.log('✅ Projects loaded:', this.projects);
            this.updateProjectSelector();
         } else {
            console.error('❌ Failed to load projects:', data.error);
            this.showError('Failed to load projects', data.error);
         }
      } catch (error) {
         console.error('❌ Error loading projects:', error);
         this.showError('Connection Error', 'Could not connect to server');
      }
   }

   async selectProject(projectSlug) {
      if (this.currentProjectSlug === projectSlug) {
         console.log('Project already selected:', projectSlug);
         return;
      }

      console.log('🎬 Selecting project:', projectSlug);
      this.isLoading = true;

      // Clear any currently playing video before switching projects
      this.clearCurrentVideo();

      try {
         // Use the project endpoint that includes videos (dailies)
         const response = await fetch(`${this.apiBaseUrl}/projects/${projectSlug}/project`);
         const data = await response.json();

         if (response.ok && data) {
            this.currentProject = data;
            this.currentProjectSlug = projectSlug;
            this.project = data; // Legacy compatibility

            console.log('✅ Project loaded:', this.currentProject);
            console.log('📹 Videos in project:', this.currentProject.dailies?.length || 0);

            // Update UI
            this.updateProjectDisplay();
            this.loadEditor();
            this.loadDisplay();

            // Update URL to reflect current project
            this.updateUrlProjectId(projectSlug);
         } else {
            console.error('❌ Failed to load project:', data?.error || 'Unknown error');
            this.showError('Failed to load project', data?.error || 'Unknown error');
            // Keep video cleared since project failed to load
         }
      } catch (error) {
         console.error('❌ Error loading project:', error);
         this.showError('Connection Error', 'Could not load project data');
         // Keep video cleared since project failed to load
      } finally {
         this.isLoading = false;
      }
   }

   updateProjectSelector() {
      const select = document.getElementById('project-select');
      if (!select) return;

      select.innerHTML = '';

      if (this.projects.length === 0) {
         select.innerHTML = '<option>No projects available</option>';
         select.disabled = true;
         return;
      }

      this.projects.forEach(project => {
         const option = document.createElement('option');
         option.value = project.slug;
         option.textContent = `${project.name} (${project.stats?.videos || 0} videos)`;
         select.appendChild(option);
      });

      select.disabled = false;

      // Select the current project if set
      if (this.currentProjectSlug) {
         select.value = this.currentProjectSlug;
      }
   }

   updateProjectDisplay() {
      // Update any project-specific UI elements here
      const projectInfo = document.querySelector('.project-info');
      if (projectInfo && this.currentProject) {
         projectInfo.innerHTML = `
            <h6>📁 ${this.currentProject.name}</h6>
            <small class="text-muted">${this.currentProject.stats?.videos || 0} videos • ${this.currentProject.stats?.totalSizeFormatted || 'Unknown size'}</small>
         `;
      }

      // Update browser title to include project name
      if (this.currentProject) {
         document.title = `VIAI - ${this.currentProject.name}`;
      }

      // Show/hide share button based on whether a project is selected
      const shareBtn = document.getElementById('share-project-btn');
      if (shareBtn) {
         shareBtn.style.display = this.currentProjectSlug ? 'inline-block' : 'none';
      }
   }

   setupProjectSelector() {
      const select = document.getElementById('project-select');
      const newProjectBtn = document.getElementById('new-project-btn');

      if (select) {
         select.addEventListener('change', async e => {
            const selectedSlug = e.target.value;
            if (selectedSlug && selectedSlug !== this.currentProjectSlug) {
               await this.selectProject(selectedSlug);
            }
         });
      }

      if (newProjectBtn) {
         newProjectBtn.addEventListener('click', () => {
            this.showNewProjectDialog();
         });
      }

      // Set up share project button
      const shareBtn = document.getElementById('share-project-btn');
      if (shareBtn) {
         shareBtn.addEventListener('click', () => {
            this.shareCurrentProject();
         });
      }
   }

   shareCurrentProject() {
      if (!this.currentProjectSlug) {
         this.showError('No Project Selected', 'Please select a project first to share its URL.');
         return;
      }

      const projectUrl = `${window.location.origin}${window.location.pathname}?project=${this.currentProjectSlug}`;
      
      // Try to use the Web Share API if available
      if (navigator.share) {
         navigator.share({
            title: `VIAI - ${this.currentProject?.name || this.currentProjectSlug}`,
            text: `Check out this video project: ${this.currentProject?.name || this.currentProjectSlug}`,
            url: projectUrl
         }).then(() => {
            console.log('✅ Project shared successfully');
         }).catch((error) => {
            console.log('❌ Error sharing:', error);
            this.fallbackShare(projectUrl);
         });
      } else {
         this.fallbackShare(projectUrl);
      }
   }

   fallbackShare(projectUrl) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(projectUrl).then(() => {
         this.showSuccess('URL Copied', `Project URL copied to clipboard!\n${projectUrl}`);
         console.log('✅ Project URL copied to clipboard:', projectUrl);
      }).catch((error) => {
         console.error('❌ Failed to copy URL:', error);
         // Final fallback: show URL in a prompt
         prompt('Copy this project URL:', projectUrl);
      });
   }

   showNewProjectDialog() {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
         <div class="modal-dialog">
            <div class="modal-content">
               <div class="modal-header">
                  <h5 class="modal-title">🎬 Create New Project</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
               </div>
               <div class="modal-body">
                  <form id="new-project-form">
                     <div class="mb-3">
                        <label for="project-name" class="form-label">Project Name</label>
                        <input type="text" class="form-control" id="project-name" placeholder="My Video Project" required>
                        <div class="form-text">Choose a descriptive name for your project</div>
                     </div>
                  </form>
               </div>
               <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-primary" id="create-project-btn">Create Project</button>
               </div>
            </div>
         </div>
      `;

      document.body.appendChild(modal);

      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      // Handle form submission
      const createBtn = modal.querySelector('#create-project-btn');
      const projectNameInput = modal.querySelector('#project-name');

      createBtn.addEventListener('click', async () => {
         const projectName = projectNameInput.value.trim();
         if (!projectName) {
            projectNameInput.classList.add('is-invalid');
            return;
         }

         createBtn.disabled = true;
         createBtn.innerHTML = '⏳ Creating...';

         try {
            await this.createProject(projectName);
            bsModal.hide();
         } catch (error) {
            console.error('Error creating project:', error);
            createBtn.disabled = false;
            createBtn.innerHTML = 'Create Project';
         }
      });

      // Auto-focus the input
      modal.addEventListener('shown.bs.modal', () => {
         projectNameInput.focus();
      });

      // Clean up modal when hidden
      modal.addEventListener('hidden.bs.modal', () => {
         document.body.removeChild(modal);
      });
   }

   async createProject(projectName) {
      try {
         const response = await fetch(`${this.apiBaseUrl}/projects`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: projectName }),
         });

         const data = await response.json();

         if (data.success) {
            console.log('✅ Project created:', data.project);

            // Reload projects and select the new one
            await this.loadProjects();
            await this.selectProject(data.project.slug);

            // Show success message
            this.showSuccess('Project Created', `"${projectName}" has been created successfully!`);
         } else {
            console.error('❌ Failed to create project:', data.error);
            this.showError('Failed to create project', data.error);
         }
      } catch (error) {
         console.error('❌ Error creating project:', error);
         this.showError('Connection Error', 'Could not create project');
      }
   }

   showEmptyState() {
      // Clear any video that might be playing
      this.clearCurrentVideo();
      
      const main = this.dom('main');
      main.element.innerHTML = `
         <div class="text-center py-5">
            <div class="mb-4">
               <div class="display-1">📁</div>
               <h3>No Projects Available</h3>
               <p class="text-muted">Create your first project to start organizing your videos</p>
            </div>
            <button class="btn btn-primary btn-lg" onclick="document.getElementById('new-project-btn').click()">
               ➕ Create First Project
            </button>
         </div>
      `;
   }

   showError(title, message) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-danger alert-dismissible fade show';
      alert.innerHTML = `
         <h4 class="alert-heading">${title}</h4>
         <p>${message}</p>
         <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;

      // Insert at the top of the container
      const container = this.uiBuilder.container;
      container.insertBefore(alert, container.firstChild);
   }

   showSuccess(title, message) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-success alert-dismissible fade show';
      alert.innerHTML = `
         <h4 class="alert-heading">${title}</h4>
         <p>${message}</p>
         <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;

      // Insert at the top of the container
      const container = this.uiBuilder.container;
      container.insertBefore(alert, container.firstChild);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
         if (alert.parentElement) {
            alert.remove();
         }
      }, 5000);
   }

   addElements({ parentId, element, childrens }, parentDom) {
      element = element || this.uiBuilder.createTag('div', null, parentId);
      parentDom = parentDom ? parentDom : document.body;
      console.log('append', element, 'to', parentDom);
      parentDom.append(element);

      if (!childrens) return;

      for (const key in childrens) {
         const child = childrens[key];
         this.addElements(child, element);
      }
   }

   async loadDisplay() {
      const videos = this.currentProject?.dailies || this.project?.dailies || [];
      if (videos.length > 0) {
         this.putPlayer(videos[0]);
      }
   }

   async loadEditor() {
      const ratio = 1920 / 1080;
      const height = this.configuration.timeline.height;
      const width = Math.round(height * ratio);
      const dom = this.dom('main');

      // Clear existing content
      dom.element.innerHTML = '';

      // Get videos from current project or legacy format
      const videos = this.currentProject?.dailies || this.project?.dailies || [];

      if (videos.length === 0) {
         dom.element.innerHTML = `
            <div class="text-center py-4">
               <p class="text-muted">No videos in this project yet</p>
               <small>Upload videos to the project's dailies folder to get started</small>
            </div>
         `;
         return;
      }

      // Add project info header
      /*const projectHeader = this.uiBuilder.createTag('div', '', 'project-header mb-3');
      projectHeader.innerHTML = `
         <div class="d-flex justify-content-between align-items-center">
            <div class="project-info">
               <h6>📁 ${this.currentProject?.name || 'Legacy Project'}</h6>
               <small class="text-muted">${videos.length} videos • ${this.currentProject?.stats?.totalSizeFormatted || 'Unknown size'}</small>
            </div>
            <div class="timeline-controls">
               <small class="text-muted">Click on timeline to navigate</small>
            </div>
         </div>
      `;
      dom.element.appendChild(projectHeader);
      */
      // Create timeline playhead
      this.playhead = this.uiBuilder.createTag('div', '', 'timeline-playhead');
      this.playhead.style.left = '20px'; // Initial position (accounting for padding)
      dom.element.appendChild(this.playhead);

      // Add click interaction to timeline
      dom.element.addEventListener('click', event => {
         this.handleTimelineClick(event);
      });

      for (const video of videos) {
         // Create enhanced video player UI
         console.log('Creating video player for:', video.filename);

         const videoContainer = this.uiBuilder.createTag(
            'div',
            '',
            'video-container position-relative'
         );
         videoContainer.setAttribute('style', `width: ${width}px;`);

         // Add robot icon overlay for AI processing indicator
         const robotOverlay = this.uiBuilder.createTag(
            'div',
            '',
            'position-absolute top-0 end-0 p-1'
         );
         const smallRobotIcon = this.createRobotIcon(16, 'opacity-75');
         robotOverlay.append(smallRobotIcon);

         const imageTag = this.uiBuilder.createTag('img');
         // Use project-specific thumbnail path or legacy path
         const thumbnailPath = this.currentProjectSlug
            ? `work/${this.currentProjectSlug}/thumbnails/${video.filename.replace('.MP4', '.jpg')}`
            : `work/thumbnails/${video.filename.replace('.MP4', '.jpg')}`;
         imageTag.src = thumbnailPath;
         imageTag.setAttribute(
            'style',
            `width: ${width}px; height: ${height}px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0);`
         );

         imageTag.addEventListener('click', event => {
            console.log('🤖 AI Processing:', video.filename, imageTag.src);
            this.putPlayer(video);
         });

         videoContainer.append(imageTag, robotOverlay);

         /*const videoInfo = this.uiBuilder.createTag('div', '', 'video-info');
         videoInfo.innerHTML = `
            <div>${video.filename}</div>
            `;
         videoContainer.append(videoInfo);*/

         dom.element.append(videoContainer);

         // Get video element and add event listeners
      }
   }

   createPlayer() {
      const ratio = 1920 / 1080;
      const height = 300;
      const width = height * ratio;
      const videoPlayer = this.uiBuilder.createTag('video', '', 'video main-video-player');
      videoPlayer.setAttribute('id', 'main-video-player');
      videoPlayer.setAttribute('class', 'video');
      videoPlayer.setAttribute('controls', '');
      videoPlayer.setAttribute('preload', 'meta');
      videoPlayer.setAttribute(
         'style',
         `width: ${width}px; height: ${height}px; background: #000;`
      );

      // Add event listeners only once
      videoPlayer.addEventListener('timeupdate', () => {
         // Only update playhead if we're not in the middle of a seek operation
         if (!this.isSeeking && this.currentVideo) {
            if (this.debugConfig.log_video_events) {
               //console.log('updating playhead', videoPlayer.currentTime);
            }
            this.updatePlayheadPosition(videoPlayer.currentTime);
         }
      });

      videoPlayer.addEventListener('loadedmetadata', () => {
         this.videoDuration = videoPlayer.duration;
         console.log(
            'Video duration loaded:',
            this.videoDuration,
            'for',
            this.currentVideo?.filename
         );
      });

      videoPlayer.addEventListener('loadeddata', () => {
         // Show video when data is loaded (for normal video display, not timeline seeks)
         if (!this.isSeeking) {
            this.getPlayer().poster = '';
            this.getPlayer().style.visibility = 'visible';
         }
      });
      return videoPlayer;
   }

   putPlayer(video) {
      if (video.filename === this.currentVideo?.filename) {
         console.log('Video already loaded:', video.filename);
         return this.getPlayer();
      }
      const player = this.setPlayer(video);

      return player;
   }

   setPlayer(video) {
      console.log('Loading video into player:', video.filename);
      const player = this.getPlayer();
      if (!player) {
         console.error('Video element not found');
         return;
      }

      // Clean up previous video resources
      this.cleanupVideoResources();

      // Set poster while loading - use project-specific path or legacy path
      const thumbnailPath = this.currentProjectSlug
         ? `work/${this.currentProjectSlug}/thumbnails/${video.filename.replace('.MP4', '.jpg')}`
         : `work/thumbnails/${video.filename.replace('.MP4', '.jpg')}`;
      player.poster = thumbnailPath;
      player.style.visibility = 'hidden'; // Hide until ready

      // Set new source - use project-specific path or legacy path
      const source = this.uiBuilder.createTag('source');
      const videoPath = this.currentProjectSlug
         ? `work/${this.currentProjectSlug}/dailies/${video.filename}`
         : `work/dailies/${video.filename}`;
      source.src = videoPath;
      source.type = 'video/mp4';

      player.appendChild(source);
      player.load();

      this.currentVideo = video;
      this.videoDuration = 0; // Reset duration until loaded

      // Attempt to play the video, handling autoplay restrictions
      const tryPlay = async () => {
         try {
            await player.play();
            console.log('✅ Playing video:', video.filename);
         } catch (error) {
            console.warn('❌ Auto-play failed, showing play button:', error);
            this.showPlayButton(player, video.filename);
         }
      };

      // Wait for metadata to load before trying to play
      if (player.readyState >= HTMLMediaElement.HAVE_METADATA) {
         tryPlay();
      } else {
         const onLoadedMetadata = () => {
            player.removeEventListener('loadedmetadata', onLoadedMetadata);
            tryPlay();
         };
         player.addEventListener('loadedmetadata', onLoadedMetadata);
      }

      return player;
   }

   updateConnectionDisplay(serverStats = null) {
      const stats = serverStats || this.serverConnectionStats;
      const monitor = document.getElementById('connection-monitor');
      if (monitor) {
         const badge = monitor.querySelector('.badge');
         if (badge) {
            badge.textContent = `Server: ${stats.active} active`;

            // Color coding based on connection count
            badge.className =
               'badge ' +
               (stats.active === 0
                  ? 'bg-secondary'
                  : stats.active <= 2
                    ? 'bg-success'
                    : stats.active <= 5
                      ? 'bg-warning'
                      : 'bg-danger');
         }
      }
   }

   async fetchServerConnectionStats() {
      try {
         const response = await fetch(`${this.apiBaseUrl}/connections`);
         const data = await response.json();

         if (data.success) {
            console.log('🌐 Server Connection Stats:', data.data);

            // Update local stats and UI
            this.serverConnectionStats = data.data;
            this.updateConnectionDisplay(data.data);

            // Update tooltip with detailed info
            const monitor = document.getElementById('connection-monitor');
            if (monitor) {
               monitor.title = `Active: ${data.data.active}, Total: ${data.data.total}, Max Concurrent: ${data.data.maxConcurrent}, Video Streams: ${data.data.videoStreams}`;
            }

            return data.data;
         }
      } catch (error) {
         console.error('Failed to fetch server connection stats:', error);
      }
      return null;
   }

   clearCurrentVideo() {
      // Clear the currently playing video when switching projects
      console.log('🧹 Clearing current video before project switch...');
      
      const player = this.getPlayer();
      if (player) {
         // Pause the video
         player.pause();
         
         // Reset to beginning
         player.currentTime = 0;
         
         // Hide the video element
         player.style.visibility = 'hidden';
         
         // Clear the poster
         player.poster = '';
         
         // Remove all sources
         const sources = player.querySelectorAll('source');
         sources.forEach(source => source.remove());
         
         // Remove src attribute and reload to clear
         player.removeAttribute('src');
         player.load();
         
         console.log('✅ Current video cleared');
      }
      
      // Clear current video reference
      this.currentVideo = null;
      
      // Reset playhead position
      if (this.playhead) {
         this.playhead.style.left = '20px';
      }
   }

   cleanupVideoResources() {
      // Method to clean up video resources and prevent memory leaks
      console.log('🧹 Cleaning up video resources...');
      const player = this.getPlayer();
      if (player) {
         player.pause();
         player.currentTime = 0;

         // Clean up all sources
         const sources = player.querySelectorAll('source');
         sources.forEach(source => {
            if (source.src && source.src.startsWith('blob:')) {
               URL.revokeObjectURL(source.src);
            }
            source.remove();
         });

         player.removeAttribute('src');
         player.load();

         console.log('🧹 Video resources cleaned up');
      }
   }

   getPlayer() {
      return this.app.childrens.top.childrens.player.element;
   }

   updatePlayheadPosition() {
      if (!this.playhead || !this.videoDuration) return;

      const videoElement = this.getPlayer();
      const currentTime = videoElement.currentTime;
      const currentVideo = this.currentVideo;
      // Calculate the total timeline width
      const timelineWidth = this.calculateTimelineWidth();
      const paddingLeft = 20; // Timeline padding

      // For now, we'll show the playhead position relative to the current video
      // In a full timeline implementation, you'd need to calculate based on all videos
      const videos = this.currentProject?.dailies || this.project?.dailies || [];
      const videoIndex = videos.findIndex(v => v.filename === currentVideo.filename);
      const videoWidth = this.configuration.timeline.height * (1920 / 1080);

      // Calculate position within the current video thumbnail
      const progressWithinVideo = currentTime / this.videoDuration;
      const positionWithinVideo = progressWithinVideo * videoWidth;

      // Calculate absolute position in timeline
      const absolutePosition = paddingLeft + videoIndex * videoWidth + positionWithinVideo;

      this.playhead.style.left = `${absolutePosition}px`;

      if (this.debugConfig.log_video_events && Math.floor(currentTime) % 5 === 0) {
         console.log(`📍 Playhead: Video ${videoIndex}, time ${currentTime.toFixed(1)}s/${this.videoDuration.toFixed(1)}s, position ${absolutePosition}px`);
         console.log(`📐 Calculation: ${paddingLeft} + ${videoIndex} * ${videoWidth} + ${positionWithinVideo} = ${absolutePosition}`);
      }

      //console.log(`Playhead: ${currentTime.toFixed(2)}s / ${this.videoDuration.toFixed(2)}s at position ${absolutePosition}px`);
   }

   calculateTimelineWidth() {
      const videoWidth = this.configuration.timeline.height * (1920 / 1080);
      const videos = this.currentProject?.dailies || this.project?.dailies || [];
      return videos.length * videoWidth;
   }

   handleTimelineClick(event) {
      console.log('Timeline clicked at', event.clientX, event.clientY);

      // Don't handle clicks on the playhead itself
      if (event.target.classList.contains('timeline-playhead')) return;

      const timeline = event.currentTarget;
      const rect = timeline.getBoundingClientRect();
      
      // Find the scrollable parent container (.main)
      const scrollContainer = timeline.closest('.main') || timeline.parentElement;
      const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
      
      const clickX = event.clientX - rect.left + scrollLeft;
      const paddingLeft = 20; // Timeline padding

      // Calculate which video and position within that video
      const videoWidth = this.configuration.timeline.height * (1920 / 1080);
      const relativeClickX = clickX - paddingLeft;

      console.log(`Timeline dimensions: width=${rect.width}, height=${rect.height}`);
      console.log(`Scroll container: ${scrollContainer?.className}, scrollLeft=${scrollLeft}`);
      console.log(`Click: clientX=${event.clientX}, rectLeft=${rect.left}, scrollLeft=${scrollLeft}, clickX=${clickX}, relativeClickX=${relativeClickX}`);
      console.log(`Video width: ${videoWidth}, padding: ${paddingLeft}`);

      if (relativeClickX < 0) {
         console.log('Clicked in padding area');
         return; // Clicked in padding area
      }

      const videoIndex = Math.floor(relativeClickX / videoWidth);
      const positionInVideo = relativeClickX % videoWidth;

      // Get videos from current project or legacy format
      const videos = this.currentProject?.dailies || this.project?.dailies || [];
      
      if (videos.length === 0) {
         console.log('No videos available for timeline interaction');
         return;
      }

      if (videoIndex >= videos.length) {
         console.log(`Click beyond available videos: index ${videoIndex}, available ${videos.length}`);
         return; // Clicked beyond videos
      }

      // Ensure we don't have negative video index
      if (videoIndex < 0) {
         console.log('Click before first video');
         return;
      }

      // Calculate progress within the clicked video (0 to 1)
      const progressInVideo = positionInVideo / videoWidth;

      // Get the clicked video
      const clickedVideo = videos[videoIndex];

      // Show visual debug info if enabled
      if (this.debugConfig.debug_timeline_clicks) {
         this.showDebugInfo(
            `🎬 Video ${videoIndex}: ${clickedVideo.filename}\n⏱️ Progress: ${(progressInVideo * 100).toFixed(1)}%\n📍 Click: ${clickX}px\n📐 Video Width: ${videoWidth}px\n📍 Position in Video: ${positionInVideo}px`
         );
      }

      // Calculate the correct target playhead position
      // This should match the calculation in updatePlayheadPosition()
      const targetPosition = paddingLeft + videoIndex * videoWidth + positionInVideo;
      this.targetPlayheadPosition = targetPosition;

      // Load and seek to the clicked video position
      this.seekToVideoPosition(clickedVideo, progressInVideo, videoIndex);

      console.log(
         `Timeline clicked: Video ${videoIndex} (${clickedVideo.filename}) at ${(progressInVideo * 100).toFixed(1)}%`
      );
   }

   showDebugInfo(message, duration = 3000) {
      // Only show debug info if debug mode is enabled
      if (!this.debugConfig.debug) return;

      // Remove existing debug info
      const existingDebug = document.querySelector('.debug-info');
      if (existingDebug) existingDebug.remove();

      // Create debug info display container
      const debugDiv = document.createElement('div');
      debugDiv.className = 'debug-info';
      debugDiv.style.cssText = `
         position: fixed;
         top: 10px;
         right: 10px;
         background: rgba(0, 0, 0, 0.8);
         color: white;
         padding: 10px 35px 10px 10px;
         border-radius: 5px;
         font-family: monospace;
         font-size: 12px;
         z-index: 10000;
         max-width: 300px;
         border: 1px solid rgba(255, 255, 255, 0.2);
      `;

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.cssText = `
         position: absolute;
         top: 5px;
         right: 8px;
         background: none;
         border: none;
         color: white;
         font-size: 16px;
         font-weight: bold;
         cursor: pointer;
         opacity: 0.7;
         transition: opacity 0.2s ease;
         padding: 0;
         line-height: 1;
         width: 20px;
         height: 20px;
         display: flex;
         align-items: center;
         justify-content: center;
      `;

      // Close button hover effect
      closeButton.onmouseenter = () => {
         closeButton.style.opacity = '1';
         closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
         closeButton.style.borderRadius = '3px';
      };

      closeButton.onmouseleave = () => {
         closeButton.style.opacity = '0.7';
         closeButton.style.backgroundColor = 'transparent';
      };

      // Create message content
      const messageContent = document.createElement('div');
      messageContent.textContent = message;
      messageContent.style.cssText = `
         white-space: pre-wrap;
         word-break: break-word;
      `;

      // Assemble the debug info
      debugDiv.appendChild(messageContent);
      debugDiv.appendChild(closeButton);

      document.body.appendChild(debugDiv);

      // Auto-remove after specified duration (but allow manual close)
      const autoRemoveTimeout = setTimeout(() => {
         if (debugDiv.parentElement) {
            debugDiv.remove();
         }
      }, duration);

      // Close button click handler (handles both manual close and timeout clearing)
      closeButton.onclick = () => {
         clearTimeout(autoRemoveTimeout);
         debugDiv.remove();
      };
   }

   seekToVideoPosition(video, progress, videoIndex) {
      // First, display the clicked video (loads new source)
      this.putPlayer(video, false);

      // Use the single reusable video element
      const videoElement = this.getPlayer();
      if (!videoElement) {
         console.error('Video element not found');
         return;
      }

      // Store the target progress for when the video is ready
      const targetProgress = progress;

      // Don't set playhead position immediately - let it be handled by the seek completion
      // this.playhead.style.left = `${this.targetPlayheadPosition}px`;

      console.log(`🎯 Target: Video ${videoIndex} (${video.filename}) at ${(targetProgress * 100).toFixed(1)}%`);
      console.log(`📐 Expected playhead position: ${this.targetPlayheadPosition}px`);

      const targetTime = targetProgress * video.info.ffprob.video.duration;
      console.log('duration', video.info.ffprob.video.duration);
      console.log('target time', targetTime);
      videoElement.currentTime = targetTime;

      const performSeekAndPlay = async () => {
         const targetTime = targetProgress * video.info.ffprob.video.duration;
         console.log('info', video);
         console.log('target time:', targetProgress, videoElement.duration, targetTime);
         console.log(
            `Seeking to ${targetTime.toFixed(2)}s in ${video.filename} (duration: ${videoElement.duration.toFixed(2)}s)`
         );
      };
      /*
      const performSeekAndPlay = async () => {
         try {
            // Set seeking flag to prevent playhead updates during seek
            this.isSeeking = true;
            
            const targetTime = targetProgress * videoElement.duration;
            console.log(`Seeking to ${targetTime.toFixed(2)}s in ${video.filename} (duration: ${videoElement.duration.toFixed(2)}s)`);
            
            // Update debug info with seek details
            this.showDebugInfo(`🎬 Video: ${video.filename}\n⏱️ Seeking to: ${targetTime.toFixed(2)}s\n📺 Duration: ${videoElement.duration.toFixed(2)}s`);
            
            // Set up a promise to wait for the seek to complete
            const waitForSeek = new Promise((resolve) => {
               const onSeeked = () => {
                  videoElement.removeEventListener('seeked', onSeeked);
                  console.log(`✅ Seek completed to ${videoElement.currentTime.toFixed(2)}s`);
                  //this.showDebugInfo(`✅ Seeked to: ${videoElement.currentTime.toFixed(2)}s\n🎬 Ready to play from this position`);
                  
                  // Remove poster and show video now that seek is complete
                  videoElement.poster = '';
                  videoElement.style.visibility = 'visible';
                  
                  // Update playhead position now that seek is complete
                  if (this.targetPlayheadPosition !== undefined && this.playhead) {
                     this.playhead.style.left = `${this.targetPlayheadPosition}px`;
                     this.targetPlayheadPosition = undefined; // Clear the target
                  }
                  
                  // Clear seeking flag after a short delay to allow the video to stabilize
                  setTimeout(() => {
                     this.isSeeking = false;
                  }, 100);
                  
                  resolve();
               };
               videoElement.addEventListener('seeked', onSeeked);
               
               // Pause the video first to ensure clean seeking
               videoElement.pause();
               videoElement.currentTime = targetTime;
            });
            
            // Wait for seek to complete, then try to play
            await waitForSeek;
            
            try {
               console.log(`🎬 Attempting to play ${video.filename}...`);
               await videoElement.play();
               console.log(`✅ Successfully playing ${video.filename} from ${targetTime.toFixed(2)}s`);
            } catch (playError) {
               console.log('❌ Auto-play blocked by browser policy:', playError.message);
               this.showPlayButton(videoElement, video.filename);
            }
            
         } catch (error) {
            console.error('Error in seekToVideoPosition:', error);
            this.isSeeking = false; // Make sure to clear the flag on error
         }
      }; */

      // Check if video metadata is already loaded
      if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
         performSeekAndPlay();
      } else {
         // Wait for metadata to load using proper event listeners
         const onLoadedMetadata = () => {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            performSeekAndPlay();
         };
         videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      }
   }

   showPlayButton(videoElement, filename) {
      return;
      // Add a play button overlay if auto-play fails
      const playButton = document.createElement('div');
      playButton.innerHTML = '▶️ Click to Play';
      playButton.className = 'video-play-overlay';
      playButton.style.cssText = `
         position: absolute; 
         top: 50%; 
         left: 50%; 
         transform: translate(-50%, -50%);
         background: rgba(0,0,0,0.8); 
         color: white; 
         padding: 12px 20px; 
         border-radius: 8px;
         cursor: pointer;
         z-index: 1000;
         font-size: 16px;
         font-weight: bold;
         box-shadow: 0 4px 12px rgba(0,0,0,0.3);
         transition: background-color 0.2s ease;
      `;

      playButton.onmouseenter = () => {
         playButton.style.backgroundColor = 'rgba(0,0,0,0.9)';
      };

      playButton.onmouseleave = () => {
         playButton.style.backgroundColor = 'rgba(0,0,0,0.8)';
      };

      playButton.onclick = async () => {
         try {
            // Store current time before play to ensure it doesn't reset
            const currentTime = videoElement.currentTime;
            console.log(`🎬 Manual play from ${currentTime.toFixed(2)}s`);

            await videoElement.play();

            // Ensure the video is still at the correct time after play starts
            if (Math.abs(videoElement.currentTime - currentTime) > 0.5) {
               console.log(
                  `⚠️ Time jumped during play, correcting from ${videoElement.currentTime.toFixed(2)}s to ${currentTime.toFixed(2)}s`
               );
               videoElement.currentTime = currentTime;
            }

            playButton.remove();
            console.log(
               `✅ Manual play successful for ${filename} from ${currentTime.toFixed(2)}s`
            );
         } catch (error) {
            console.error('Manual play failed:', error);
         }
      };

      // Ensure parent has relative positioning
      if (videoElement.parentElement) {
         videoElement.parentElement.style.position = 'relative';
         videoElement.parentElement.appendChild(playButton);

         // Auto-remove after 10 seconds
         setTimeout(() => {
            if (playButton.parentElement) {
               playButton.remove();
            }
         }, 10000);
      }
   }

   showVideoError(dom, title, message) {
      dom.element.innerHTML = `
         <div class="card border-danger">
            <div class="card-header bg-danger text-white">
               <h5 class="mb-0">❌ ${title}</h5>
            </div>
            <div class="card-body">
               <p class="text-danger"><strong>Error:</strong> ${message}</p>
               <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button class="btn btn-outline-primary" onclick="location.reload()">🔄 Retry</button>
                  <button class="btn btn-secondary" onclick="history.back()">← Go Back</button>
               </div>
            </div>
         </div>
      `;
   }

   dom(path, context) {
      context = context || this.app;
      const parts = path.split('.');
      console.log('dom path', path, parts);

      while (parts.length) {
         const part = parts.shift();
         console.log('dom', part, context.childrens);
         if (context.childrens[part]) {
         } else {
            throw new Error(`Invalid path: ${path}, missing part: ${part}`);
         }
         context = context.childrens[part];
      }

      return context;
   }

   error(title, message) {
      console.log('error:', title, message);
      const errorAlert = document.createElement('div');
      errorAlert.className = 'alert alert-danger';
      errorAlert.innerHTML = `
               <h4 class="alert-heading">${title}</h4>
               <p>${JSON.stringify(message)}</p>
            `;
      this.uiBuilder.container.append(errorAlert);
   }

   selectVideo(video) {
      console.log('📹 Selected video:', video);

      // Update the selected state in sidebar
      document.querySelectorAll('.list-group-item').forEach(item => {
         item.classList.remove('active');
      });

      // Find and highlight the selected video
      const videoItems = document.querySelectorAll('.list-group-item');
      videoItems.forEach(item => {
         if (item.innerHTML.includes(video.filename)) {
            item.classList.add('active');
         }
      });

      // Load and display the video
      this.showVideoDetails(video.filename);
   }

   /**
    * Helper method to create robot icons
    * @param {number} size - Icon size (16, 32, 64, 128, 512)
    * @param {string} className - Additional CSS classes
    * @param {string} alt - Alt text for accessibility
    * @returns {HTMLImageElement} - Robot icon element
    */
   createRobotIcon(size = 32, className = '', alt = 'VIAI Robot') {
      const icon = this.uiBuilder.createTag('img');
      const iconConfig = this.configuration.assets.robotIcon;

      if (iconConfig.sizes[size]) {
         icon.src = this.configuration.assets.iconPath + iconConfig.sizes[size];
      } else {
         // Fallback to SVG for custom sizes
         icon.src = this.configuration.assets.iconPath + iconConfig.svg;
         icon.style.width = `${size}px`;
         icon.style.height = `${size}px`;
      }

      icon.alt = alt;
      icon.className = `robot-icon ${className}`;

      return icon;
   }

   /**
    * Create a branded button with robot icon
    * @param {string} text - Button text
    * @param {string} className - Bootstrap button classes
    * @param {number} iconSize - Icon size
    * @returns {HTMLButtonElement} - Branded button
    */
   createRobotButton(text, className = 'btn-primary', iconSize = 16) {
      const button = this.uiBuilder.createTag('button');
      button.className = `btn ${className} d-flex align-items-center gap-2`;

      const icon = this.createRobotIcon(iconSize, '', 'VIAI');
      const textSpan = this.uiBuilder.createTag('span');
      textSpan.textContent = text;

      button.append(icon, textSpan);
      return button;
   }
}
const app = new VideoLibraryApp();
// Auto-refresh server health check based on config
setInterval(() => {
   if (app && !app.isLoading && app.debugConfig.debug) {
      console.log('⏰ Running periodic server check...');
      app.checkServerStatus();
   }
}, app?.debugConfig?.server_health_check_interval || 300000);

// Monitor connections based on config
setInterval(() => {
   if (app && app.debugConfig.debug && app.debugConfig.check_server_connections) {
      app.fetchServerConnectionStats();
   }
}, app?.debugConfig?.connection_check_interval || 10000);
