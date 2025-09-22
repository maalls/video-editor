import UiBuilder from './UiBuilder.js';

class VideoLibraryApp {
   constructor() {
      console.log('🚀 VideoLibraryApp constructor called');
      this.apiBaseUrl = 'http://localhost:3000';
      this.project = null;
      this.filteredVideos = [];
      this.isLoading = false;
      this.uiBuilder = new UiBuilder();
      
      // Server connection monitoring (display only)
      this.serverConnectionStats = {
         active: 0,
         total: 0,
         maxConcurrent: 0
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
      // Create Bootstrap header with robot logo and connection monitor
      const header = this.uiBuilder.createTag('header');
      header.className = 'bg-primary text-white text-center';
      header.innerHTML = `
         <div class="container-fluid d-flex justify-content-between align-items-center pe-1">
            <div id="connection-monitor" class="small opacity-75" title="Real-time server connection monitoring">
               <span class="badge bg-secondary">Server: 0 active</span>
            </div>
            <div>
               <small class="opacity-75">Video Editor AI Interface</small>
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
                     element: this.createDisplay(),
                  },
               },
            },
            main: {
               element: this.uiBuilder.createTag('div', null, 'main timeline'),
            },
         },
      };

      let context = this.uiBuilder.container;
      this.addElements(this.app);

      try {
         console.log('Fetching videos from API...');
         const response = await (await fetch('/project')).json();
         if (response.error) {
            this.uiBuilder.error('API Error', JSON.stringify(response.error));
         } else {
            this.project = response;
            console.log('✅ Videos loaded successfully!', this.project);
            console.log(this.project.dailies); // Nice table view

            //this.loadSidebar();

            this.loadEditor();
            this.loadDisplay();

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

            // Initialize connection monitoring
            this.fetchServerConnectionStats();

            // Console styling
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
      if (this.project.dailies.length) {
         const filename = this.project.dailies[0].filename;
         console.log('loadDisplay', filename);
         this.displayClip(this.project.dailies[0]);
      }
   }

   async loadEditor() {
      const ratio = 1920 / 1080;
      const height = this.configuration.timeline.height;
      const width = Math.round(height * ratio);
      const dom = this.dom('main');
      
      // Create timeline playhead
      this.playhead = this.uiBuilder.createTag('div', '', 'timeline-playhead');
      this.playhead.style.left = '20px'; // Initial position (accounting for padding)
      dom.element.appendChild(this.playhead);
      
      // Add click interaction to timeline
      dom.element.addEventListener('click', (event) => {
         this.handleTimelineClick(event);
      });
      
      for (const video of this.project.dailies) {
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
         imageTag.src = 'work/thumbnails/' + video.filename.replace('.MP4', '.jpg');
         imageTag.setAttribute(
            'style',
            `width: ${width}px; height: ${height}px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0);`
         );

         imageTag.addEventListener('click', event => {
            console.log('🤖 AI Processing:', video.filename, imageTag.src);
            this.displayClip(video);
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

   displayClip(video, start = true) {
      
      this.updatePlayer(video);
      
   }

   createDisplay() {
      const ratio = 1920 / 1080;
      const height = 300;
      const width = height * ratio;
      const videoPlayer = this.uiBuilder.createTag('video', '', 'video main-video-player');
         videoPlayer.setAttribute('id', 'main-video-player');
         videoPlayer.setAttribute('class', 'video');
         videoPlayer.setAttribute('controls', '');
         videoPlayer.setAttribute('preload', 'meta');
         videoPlayer.setAttribute('style', `width: ${width}px; height: ${height}px; background: #000;`);
         
         // Add event listeners only once
         videoPlayer.addEventListener('timeupdate', () => {
            // Only update playhead if we're not in the middle of a seek operation
            if (!this.isSeeking && this.currentVideo) {
               this.updatePlayheadPosition(videoPlayer.currentTime, this.currentVideo);
            }
         });
         
         videoPlayer.addEventListener('loadedmetadata', () => {
            this.videoDuration = videoPlayer.duration;
            console.log('Video duration loaded:', this.videoDuration, 'for', this.currentVideo?.filename);
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

   

   updatePlayer(video) {
      // Clear existing sources and properly clean up resources
      const player = this.getPlayer();
      
      // Pause and reset current video to free up buffer space
      player.pause();
      player.currentTime = 0;
      
      // Remove existing sources and clean up URLs
      const existingSources = player.querySelectorAll('source');
      existingSources.forEach(source => {
         // Revoke blob URLs if they exist to free memory
         if (source.src && source.src.startsWith('blob:')) {
            URL.revokeObjectURL(source.src);
         }
         source.remove();
      });
      
      // Clear src attribute to fully reset the video element
      player.removeAttribute('src');
      player.load(); // This clears the current resource
      
      // Create new source
      const source = this.uiBuilder.createTag('source', '', 'video-source');
      source.setAttribute('src', `/video/${video.filename}/stream`);
      source.setAttribute('type', 'video/mp4');
      
      player.append(source);
      
      // Load the new video
      player.load();
      
      console.log(`📼 Updated player source: ${video.filename}`);

      this.currentVideo = video;
      console.log(`📼 Loaded video source: ${video.filename}`);

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
            badge.className = 'badge ' + (
               stats.active === 0 ? 'bg-secondary' :
               stats.active <= 2 ? 'bg-success' :
               stats.active <= 5 ? 'bg-warning' : 'bg-danger'
            );
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

   cleanupVideoResources() {
      // Method to clean up video resources and prevent memory leaks
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

   updatePlayheadPosition(currentTime, currentVideo) {
      if (!this.playhead || !this.videoDuration) return;
      
      // Calculate the total timeline width
      const timelineWidth = this.calculateTimelineWidth();
      const paddingLeft = 20; // Timeline padding
      
      // For now, we'll show the playhead position relative to the current video
      // In a full timeline implementation, you'd need to calculate based on all videos
      const videoIndex = this.project.dailies.findIndex(v => v.filename === currentVideo.filename);
      const videoWidth = this.configuration.timeline.height * (1920 / 1080);
      
      // Calculate position within the current video thumbnail
      const progressWithinVideo = currentTime / this.videoDuration;
      const positionWithinVideo = progressWithinVideo * videoWidth;
      
      // Calculate absolute position in timeline
      const absolutePosition = paddingLeft + (videoIndex * videoWidth) + positionWithinVideo;
      
      this.playhead.style.left = `${absolutePosition}px`;
      
      //console.log(`Playhead: ${currentTime.toFixed(2)}s / ${this.videoDuration.toFixed(2)}s at position ${absolutePosition}px`);
   }

   calculateTimelineWidth() {
      const videoWidth = this.configuration.timeline.height * (1920 / 1080);
      return this.project.dailies.length * videoWidth;
   }

   handleTimelineClick(event) {
      // Don't handle clicks on the playhead itself
      if (event.target.classList.contains('timeline-playhead')) return;
      
      const timeline = event.currentTarget;
      const rect = timeline.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const paddingLeft = 20; // Timeline padding
      
      // Calculate which video and position within that video
      const videoWidth = this.configuration.timeline.height * (1920 / 1080);
      const relativeClickX = clickX - paddingLeft;
      
      if (relativeClickX < 0) return; // Clicked in padding area
      
      const videoIndex = Math.floor(relativeClickX / videoWidth);
      const positionInVideo = relativeClickX % videoWidth;
      
      if (videoIndex >= this.project.dailies.length) return; // Clicked beyond videos
      
      // Calculate progress within the clicked video (0 to 1)
      const progressInVideo = positionInVideo / videoWidth;
      
      // Get the clicked video
      const clickedVideo = this.project.dailies[videoIndex];
      
      // Show visual debug info
      this.showDebugInfo(`🎬 Video ${videoIndex}: ${clickedVideo.filename}\n⏱️ Progress: ${(progressInVideo * 100).toFixed(1)}%\n📍 Click: ${clickX}px`);
      
      // Store the target playhead position for later
      this.targetPlayheadPosition = clickX;
      
      // Load and seek to the clicked video position
      this.seekToVideoPosition(clickedVideo, progressInVideo, videoIndex);
      
      console.log(`Timeline clicked: Video ${videoIndex} (${clickedVideo.filename}) at ${(progressInVideo * 100).toFixed(1)}%`);
      
   }
   
   showDebugInfo(message, duration = 3000) {
      // Remove existing debug info
      const existingDebug = document.querySelector('.debug-info');
      if (existingDebug) existingDebug.remove();
      
      // Create debug info display
      const debugDiv = document.createElement('div');
      debugDiv.className = 'debug-info';
      debugDiv.style.cssText = `
         position: fixed;
         top: 10px;
         right: 10px;
         background: rgba(0, 0, 0, 0.8);
         color: white;
         padding: 10px;
         border-radius: 5px;
         font-family: monospace;
         font-size: 12px;
         z-index: 10000;
         max-width: 300px;
      `;
      debugDiv.textContent = message;
      
      document.body.appendChild(debugDiv);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
         if (debugDiv.parentElement) {
            debugDiv.remove();
         }
      }, duration);
   }

   seekToVideoPosition(video, progress, videoIndex) {
      // First, display the clicked video (loads new source)
      this.displayClip(video, false);
      
      // Use the single reusable video element
      const videoElement = this.getPlayer();
      if (!videoElement) {
         console.error('Video element not found');
         return;
      }
      
      // Store the target progress for when the video is ready
      const targetProgress = progress;

      const performSeekAndPlay = async () => {

         const targetTime = targetProgress * videoElement.duration;
         console.log('target time', targetTime);
      }
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
               console.log(`⚠️ Time jumped during play, correcting from ${videoElement.currentTime.toFixed(2)}s to ${currentTime.toFixed(2)}s`);
               videoElement.currentTime = currentTime;
            }
            
            playButton.remove();
            console.log(`✅ Manual play successful for ${filename} from ${currentTime.toFixed(2)}s`);
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
// Auto-refresh every 5 minutes
setInterval(() => {
   if (app && !app.isLoading) {
      console.log('⏰ Running periodic server check...');
      app.checkServerStatus();
   }
}, 300000);

// Monitor connections every 10 seconds
setInterval(() => {
   if (app) {
      app.fetchServerConnectionStats();
   }
}, 10000);
