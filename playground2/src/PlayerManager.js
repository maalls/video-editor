// PlayerManager.js - Handles all player-related initialization and setup
import { AudioPlayer } from './AudioPlayer.js';
import Navigation from "./Navigation.js";

export class PlayerManager {
    constructor() {
        this.audioPlayer = null;
        this.canvas = null;
    }

    async initializePlayer(containerElement, audioSrc) {
        try {
            // Initialize audio player
            this.audioPlayer = new AudioPlayer();
            const player = await this.audioPlayer.init(audioSrc);
            player.style.border = "1px solid blue";
            containerElement.append(player);
            
             // Get the actual DOM element
            this.navigation = new Navigation(containerElement, this.audioPlayer);
            this.navigation.createVisualizer();
            
            // Auto-play

            this.audioPlayer.player.addEventListener('play', async () => {
            });

            await this.audioPlayer.play();
            
            console.log('Audio player initialized successfully');
            return this.audioPlayer;
        } catch (error) {
            console.error('Error initializing audio player:', error);
            throw error;
        }
    }

    getPlayer() {
        return this.audioPlayer;
    }

    async loadAudioFromProject(projectData) {
        // You can extend this to read audio source from project data
        // For now, using the hardcoded path
        const audioSrc = "./var/data/chris-shop/christophe-entrepot.m4a";
        return audioSrc;
    }
}