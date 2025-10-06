// AudioPlayer.js - ES Module
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
        

        this.player.addEventListener('loadedmetadata', () => {
            console.log(`Audio duration: ${(this.player.duration * 1000).toFixed(0)}ms (${this.player.duration.toFixed(3)}s)`);
            const time = this.url.searchParams.get('time');
            if (time) {
                const value = this.parseTimeParam(time);

                if(value) {
                    this.player.currentTime = value;
                }
                else if(time == "random") {
                    const randomTime = Math.random() * this.player.duration;
                    this.player.currentTime = randomTime;
                }
            }
        });

        return this.player;

    }

    /*
     
    Parse time parameter from URL (e.g., "time=00h00m01s069ms" to seconds)

    */
    parseTimeParam(timeString) {
        const regex = /(\d{2})h(\d{2})m(\d{2})s(\d{3})ms/;
        const match = timeString.match(regex);
        if (match) {
            const hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const seconds = parseInt(match[3], 10);
            const milliseconds = parseInt(match[4], 10);
            return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
        }
        return 0;
    }

    togglePlayPause() {
        if (this.player.player.paused) {
            this.player.play();
        } else {
            this.player.player.pause();
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
            /*this.urlInterval = setInterval(() => {

                const formattedTime = this.formatTime(this.player.currentTime);
                this.url.searchParams.set('time', (formattedTime));
                history.replaceState(null, '', this.url);
            }, 500);*/
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