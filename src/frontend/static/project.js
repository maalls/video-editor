export default class Project {
   constructor(id) {
      this.id = id;
   }

   setId(id) {
      this.id = id;
   }

   async init() {
      // Load project-specific resources, if any
      // Clean up resources when page is about to be closed
      window.addEventListener('beforeunload', () => {
         this.project.cleanupVideoResources();
      });

      document.addEventListener('project_selected', event => {
         console.log('[project] project changed', event.detail.project);
      });

      document.addEventListener('visibilitychange', () => {
         if (document.hidden) {
            const player = this.getPlayer();
            if (player && !player.paused) {
               player.pause();
               console.log('🔇 Paused video due to page visibility change');
            }
         }
      });
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

      console.log(
         `🎯 Target: Video ${videoIndex} (${video.filename}) at ${(targetProgress * 100).toFixed(1)}%`
      );
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
      const source = this.uiBuilder.createTag('source', 'player-source');
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

   getPlayer() {
      return this.app.childrens.top.childrens.player.element;
   }

   async loadDisplay() {
      const videos = this.currentProject?.dailies || this.project?.dailies || [];
      if (videos.length > 0) {
         this.putPlayer(videos[0]);
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
   async loadEditor(dom) {
      const ratio = 1920 / 1080;
      const height = this.configuration.timeline.height;
      const width = Math.round(height * ratio);

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
      // Create timeline playhead
      this.playhead = this.uiBuilder.createTag('div', 'playhead', 'timeline-playhead');
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
            'container',
            'video-container position-relative'
         );
         videoContainer.setAttribute('style', `width: ${width}px;`);

         // Add robot icon overlay for AI processing indicator
         const robotOverlay = this.uiBuilder.createTag(
            'div',
            'robot-overlay',
            'position-absolute top-0 end-0 p-1'
         );
         const smallRobotIcon = this.createRobotIcon(16, 'opacity-75');
         robotOverlay.append(smallRobotIcon);

         const imageTag = this.uiBuilder.createTag('img', 'robot-thumbnail');
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
         dom.element.append(videoContainer);

         // Get video element and add event listeners
      }
   }
}
