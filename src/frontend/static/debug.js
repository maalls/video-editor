export default class Debug {
   constructor() {
      this.debugConfig = {
         debug: true,
         check_server_connections: true,
         debug_timeline_clicks: true,
         show_video_metadata: false,
         log_video_events: true,
         connection_check_interval: 10000,
         server_health_check_interval: 300000,
      };
   }

   async init() {
      await this.loadDebugConfig();
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
}
