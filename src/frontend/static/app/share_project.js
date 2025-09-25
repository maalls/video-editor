export default class ShareProject {
   init() {
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
         navigator
            .share({
               title: `VIAI - ${this.currentProject?.name || this.currentProjectSlug}`,
               text: `Check out this video project: ${this.currentProject?.name || this.currentProjectSlug}`,
               url: projectUrl,
            })
            .then(() => {
               console.log('✅ Project shared successfully');
            })
            .catch(error => {
               console.log('❌ Error sharing:', error);
               this.fallbackShare(projectUrl);
            });
      } else {
         this.fallbackShare(projectUrl);
      }
   }

   fallbackShare(projectUrl) {
      // Fallback: copy to clipboard
      navigator.clipboard
         .writeText(projectUrl)
         .then(() => {
            this.showSuccess('URL Copied', `Project URL copied to clipboard!\n${projectUrl}`);
            console.log('✅ Project URL copied to clipboard:', projectUrl);
         })
         .catch(error => {
            console.error('❌ Failed to copy URL:', error);
            // Final fallback: show URL in a prompt
            prompt('Copy this project URL:', projectUrl);
         });
   }
}
