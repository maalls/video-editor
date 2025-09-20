import UiBuilder from './UiBuilder.js';

class VideoLibraryApp {
   constructor() {
      console.log('🚀 VideoLibraryApp constructor called');
      this.apiBaseUrl = 'http://localhost:3000';
      this.project = null;
      this.filteredVideos = [];
      this.isLoading = false;
      this.uiBuilder = new UiBuilder();

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
      // Create Bootstrap header
      const header = this.uiBuilder.createTag('header');
      header.className = 'bg-primary text-center pd-2';
      header.innerHTML = `AI Vids Editor`;

      this.app = {
         element: this.uiBuilder.container,
         childrens: {
            header: {
               element: header,
            },
            main: {
               element: this.uiBuilder.createTag('div', null, 'main'),
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

   

   addElements({ element, childrens }, parentDom) {
      parentDom = parentDom ? parentDom : document.body;
      console.log('append', element, 'to', parentDom);
      parentDom.append(element);

      if (!childrens) return;

      for (const key in childrens) {
         const child = childrens[key];
         this.addElements(child, element);
      }
   }

   async loadEditor() {
      const ratio = 1920 / 1080;
      const width = 300;
      const height = width / ratio;
      const dom = this.dom('main');
      for (const video of this.project.dailies) {
         // Create enhanced video player UI
         console.log('Creating video player for:', video.filename);
         const videoPlayerContainer = this.uiBuilder.createTag('div', '', 'timeline');
         videoPlayerContainer.innerHTML = `
                
                    
                    <video 
                    id="video-player-${video.filename}" 
                    class="video" 
                    controls 
                    preload="metadata"
                    style="width: ${width}px; height: ${height}px; background: #000;"
                    >
                    <source src="/video/${video.filename}/stream" type="video/mp4">
                    Your browser does not support the video tag.
                    </video>
              
                  
                
        `;

         dom.element.append(videoPlayerContainer);

         // Get video element and add event listeners
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
}
const app = new VideoLibraryApp();
// Auto-refresh every 5 minutes
setInterval(() => {
   if (app && !app.isLoading) {
      console.log('⏰ Running periodic server check...');
      app.checkServerStatus();
   }
}, 300000);
