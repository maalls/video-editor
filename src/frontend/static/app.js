class UiBuilder {
   constructor(container) {
      this.container = container;
      document.body.append(this.container);
   }

   appendTag(tagName, textContent) {
      const element = document.createElement(tagName);
      element.textContent = textContent;
      this.container.appendChild(element);
   }

   createTag(tagName, textContent) {
      const element = document.createElement(tagName);
      element.textContent = textContent;
      this.container.appendChild(element);
   }
}

class VideoLibraryApp {
   constructor() {
      console.log('🚀 VideoLibraryApp constructor called');
      this.apiBaseUrl = 'http://localhost:3000';
      this.project = null;
      this.filteredVideos = [];
      this.isLoading = false;

      this.container = document.createElement('div');
      this.uiBuilder = new UiBuilder(this.container);

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
      console.log('Fetching videos from API...');

      this.uiBuilder.appendTag('h1', 'AI Vids Editor');

      try {
         this.project = await fetch('/project');

         const response = await this.project.json();
         if (response.error) {
            console.log('error:', response.error);
            const errorMessage = document.createElement('div');
            errorMessage.style.color = 'red';
            errorMessage.innerHTML = `API Error: ${JSON.stringify(response.error)}`;
            this.container.append(errorMessage);
         } else {
            console.log('✅ Videos loaded successfully:', this.project);
            console.table(this.project.videos); // Nice table view

            const main = document.createElement('div');

            for (const video of this.project.videos) {
               const videoElement = document.createElement('div');
               videoElement.innerHTML = video.title;
               main.append(videoElement);
            }

            container.append(main);
         }
      } catch (error) {
         console.log('error:', error);

         const errorMessage = document.createElement('div');
         errorMessage.style.color = 'red';

         errorMessage.innerHTML = `Errors: ${error.message}`;
         container.append(errorMessage);
      }

      console.log('Creating app view...');
   }
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

// Console styling
const app = new VideoLibraryApp();

// Auto-refresh every 5 minutes
setInterval(() => {
   if (app && !app.isLoading) {
      console.log('⏰ Running periodic server check...');
      app.checkServerStatus();
   }
}, 300000);
