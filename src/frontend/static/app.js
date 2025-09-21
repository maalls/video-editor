import UiBuilder from './UiBuilder.js';

class VideoLibraryApp {
   constructor() {
      console.log('🚀 VideoLibraryApp constructor called');
      this.apiBaseUrl = 'http://localhost:3000';
      this.project = null;
      this.filteredVideos = [];
      this.isLoading = false;
      this.uiBuilder = new UiBuilder();

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
      // Create Bootstrap header with robot logo
      const header = this.uiBuilder.createTag('header');
      header.className = 'bg-primary text-white text-center';
      header.innerHTML = `
         <div class="container-fluid d-flex justify-content-end pe-1">
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
                  display: {
                     element: this.uiBuilder.createTag('div', null, 'display'),
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
      const width = height * ratio;
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
      const ratio = 1920 / 1080;
      const height = 300;
      const width = height * ratio;

      const display = this.app.childrens.top.childrens.display.element;
      const videoTag = this.uiBuilder.createTag('video', '', 'video');
      videoTag.setAttribute('id', `video-player-${video.filename}`);
      videoTag.setAttribute('class', 'video');
      videoTag.setAttribute('controls', '');
      videoTag.setAttribute('preload', 'meta');
      videoTag.setAttribute('style', `width: ${width}px; height: ${height}px; background: #000;`);
      const source = this.uiBuilder.createTag('source', '', 'video-source');
      source.setAttribute('src', `/video/${video.filename}/stream`);
      source.setAttribute('type', 'video/mp4');
      videoTag.append(source);

      display.innerHTML = null;
      display.append(videoTag);
      
      // Add event listeners for playhead synchronization
      videoTag.addEventListener('timeupdate', () => {
         this.updatePlayheadPosition(videoTag.currentTime, video);
      });
      
      videoTag.addEventListener('loadedmetadata', () => {
         this.videoDuration = videoTag.duration;
         console.log('Video duration loaded:', this.videoDuration);
      });
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
      
      console.log(`Playhead: ${currentTime.toFixed(2)}s / ${this.videoDuration.toFixed(2)}s at position ${absolutePosition}px`);
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
      
      // Update playhead position immediately
      this.playhead.style.left = `${clickX}px`;
      
      // Get the clicked video
      const clickedVideo = this.project.dailies[videoIndex];
      
      // Load and seek to the clicked video position
      this.seekToVideoPosition(clickedVideo, progressInVideo, videoIndex);
      
      console.log(`Timeline clicked: Video ${videoIndex} (${clickedVideo.filename}) at ${(progressInVideo * 100).toFixed(1)}%`);
   }

   seekToVideoPosition(video, progress, videoIndex) {
      // First, display the clicked video
      this.displayClip(video, false);
      
      // Wait a bit for the video to load, then seek to the position and play
      setTimeout(() => {
         const videoElement = document.querySelector(`#video-player-${video.filename}`);
         if (videoElement) {
            const seekAndPlay = () => {
               const targetTime = progress * videoElement.duration;
               videoElement.currentTime = targetTime;
               
               // Auto-play the video after seeking
               videoElement.play().then(() => {
                  console.log(`Playing ${video.filename} from ${targetTime.toFixed(2)}s`);
               }).catch(error => {
                  console.log('Auto-play prevented by browser policy:', error);
                  console.log('Click the play button to start playback');
               });
            };
            
            videoElement.addEventListener('loadedmetadata', seekAndPlay, { once: true });
            
            // If metadata is already loaded
            if (videoElement.readyState >= 1) {
               seekAndPlay();
            }
         }
      }, 100);
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
