import { PlayerManager } from './PlayerManager.js';

export default class App {
    constructor() {
        this.playerManager = new PlayerManager();
        this.projectData = null;
    }

    // Load project configuration
    async loadProjectData() {
        try {
            const response = await fetch('project.json');
            this.projectData = await response.json();
            console.log('Project data loaded:', this.projectData);
            return this.projectData;
        } catch (error) {
            console.error('Error loading project.json:', error);
            throw error;
        }
    }

    // Initialize the audio player
    async initializePlayer() {
        try {
            const view = document.getElementById('view');
            const audioSrc = await this.playerManager.loadAudioFromProject(this.projectData);
            await this.playerManager.initializePlayer(view, audioSrc);
        } catch (error) {
            console.error('Error initializing player:', error);
        }
    }

    // Start the application
    async start() {
        try {
            // Load project data
            

            await this.initializeProject();
            
            // Initialize audio player
            await this.initializePlayer();
            
            console.log('Application started successfully');
        } catch (error) {
            console.error('Error starting application:', error);
        }
    }

    async initializeProject() {

        await this.loadProjectData();

        const loading = document.getElementById('loading');
        loading.style.display = 'none';

        const bar = document.getElementById('bar');
        bar.style.textAlign = 'left';
        bar.innerHTML = "<pre>" + JSON.stringify(this.projectData, null, 2) + "</pre>";
        console.log("YO");
        const body =document.body;
        body.addEventListener('monitor', (event) => {
            console.log("monitor", event.detail.currentTime);
            bar.innerHTML = "<pre>" + event.detail.currentTime + "</pre>";
        });

    }
}