export default class Timeline {
   constructor() {
      this.configuration = {
         timeline: {
            height: 100,
         },
      };
   }

   init() {
      document.addEventListener('project_selected', event => {
         console.log('[timeline] project changed');
         this.loadProject(event.detail.project);
      });
   }

   loadProject(project) {
      console.log('[timeline] loading project', project);
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
      const clickX = event.clientX - rect.left;
      const paddingLeft = 20; // Timeline padding

      // Calculate which video and position within that video
      const videoWidth = this.configuration.timeline.height * (1920 / 1080);
      const relativeClickX = clickX - paddingLeft;

      console.log(`Timeline dimensions: width=${rect.width}, height=${rect.height}`);
      console.log(
         `Click: clientX=${event.clientX}, clickX=${clickX}, relativeClickX=${relativeClickX}`
      );
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
         console.log(
            `Click beyond available videos: index ${videoIndex}, available ${videos.length}`
         );
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
}
