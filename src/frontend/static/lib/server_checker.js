export default class ServerChecker {
   constructor() {
      this.serverConnectionStats = {
         active: 0,
         total: 0,
         maxConcurrent: 0,
      };
   }
   init() {
      if (this.debugConfig.check_server_connections) {
         this.fetchServerConnectionStats();
      }
      // Auto-refresh server health check based on config
      setInterval(async () => {
         if (app && !app.isLoading && app.debugConfig.debug) {
            console.log('⏰ Running periodic server check...');
            await this.checkServerStatus();
         }
      }, app?.debugConfig?.server_health_check_interval || 300000);

      // Monitor connections based on config
      setInterval(async () => {
         if (app && app.debugConfig.debug && app.debugConfig.check_server_connections) {
            await this.fetchServerConnectionStats();
         }
      }, app?.debugConfig?.connection_check_interval || 10000);
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
}
