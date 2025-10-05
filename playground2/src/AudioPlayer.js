// AudioPlayer.js - ES Module
import Navigation from "./Navigation.js";
export class AudioPlayer {
    constructor(containerElement) {
        this.container = containerElement;
        this.player = null;
        this.isPlaying = false;
        this.url = new URL(window.location);
    }

    init(audioSrc) {
        this.player = document.createElement("audio");
        const source = document.createElement("source");
        this.player.setAttribute('controls', true);
        this.player.setAttribute('preload', 'metadata');
        source.src = audioSrc;
        source.type = "audio/mpeg";
        this.player.appendChild(source);
        this.container.append(this.player);
    }

    togglePlayPause() {
        if (this.player.paused) {
            this.player.play();
        } else {
            this.player.pause();
        }
    }

    seekTo(time, unit = 'seconds') {
        let timeInSeconds;
        
        if (unit === 'ms' || unit === 'milliseconds') {
            timeInSeconds = time / 1000;
        } else {
            timeInSeconds = time;
        }
        
        if (timeInSeconds >= 0 && timeInSeconds <= this.player.duration) {
            this.player.currentTime = timeInSeconds;
            console.log(`Seeking to: ${(timeInSeconds * 1000).toFixed(0)}ms (${timeInSeconds.toFixed(3)}s)`);
        } else {
            console.error(`Invalid time: ${time}${unit}. Must be between 0 and ${(this.player.duration * 1000).toFixed(0)}ms`);
        }
    }

    async play() {
        try {
            this.urlInterval = setInterval(() => {

                const formattedTime = this.formatTime(this.player.currentTime);
                this.url.searchParams.set('time', (formattedTime));
                history.replaceState(null, '', this.url);
            }, 100);
            await this.player.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }
    formatTime(timeInSeconds) {
        //console.log("format time", timeInSeconds);
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const hours = Math.floor(timeInSeconds / 3600);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
        //console.log("formatted time", 'h', hours, 'm', minutes, 's', seconds, 'ms', milliseconds);

        return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}m${String(seconds).padStart(2, '0')}s${String(milliseconds).padStart(3, '0')}ms`;
    }
    
}