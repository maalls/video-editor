class VideoLibraryApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000';
        this.project = [];
        this.filteredVideos = [];
        this.isLoading = false;
        this.start();
    }

    start() {
        if(!this.project) {
            this.project = fetch('/videos');
            console.log("project", this.project);
            
        }
    }
}

const app = new VideoLibraryApp();

// Auto-refresh every 5 minutes
setInterval(() => {
    if (app && !app.isLoading) {
        app.checkServerStatus();
    }
}, 300000);