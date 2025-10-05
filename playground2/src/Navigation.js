import Canvas from './Canvas.js';
import Slider from './Slider.js';
export default class Navigation {

    constructor(container, player) {
        this.container = container;
        this.player = player;
        this.canvasCtx = null; // Will be set in createVisualizer
        this.lastFrequencyData = null;

        this.myCanvas = new Canvas();
        this.canvas = this.myCanvas.createCanvas();
        this.canvasCtx = this.canvas.getContext('2d');
    }

    togglePlayPause() {
        if (this.player.player.paused) {
            this.player.player.play();
        } else {
            this.player.pause();
        }
    }

    createVisualizer() {

        const slider = new Slider();

        // Create minimalistic slider
        const s = slider.create();
        s.addEventListener(Slider.SLIDER_CHANGED_EVENT, (e) => {
            console.log('Slider event received in Navigation:', this.player.player.duration);
            const timecode = Math.round(e.detail / 100 * this.player.player.duration);
            console.log('time code', timecode);
            this.player.seekTo(timecode);
            // You can add functionality here (volume, seek, etc.)
        });
        this.sliderContainer = s;
        this.container.appendChild(this.sliderContainer);
        this.container.append(this.canvasElement);
        console.log("canvas", this.canvas);
    
        this.setupAudioContext();
        this.addEventListeners();
    }

    

    // Method to update slider width if canvas width changes
    updateSliderWidth() {
        if (this.sliderContainer && this.canvas) {
            this.sliderContainer.style.width = this.canvas.width + 'px';
        }
    }

    // Method to resize canvas and update slider accordingly
    resizeCanvas(newWidth, newHeight) {
        this.canvas.width = newWidth;
        this.canvas.height = newHeight || this.canvas.height;
        this.updateSliderWidth();
        console.log(`Canvas resized to ${newWidth}x${this.canvas.height}, slider width updated`);
    }

    setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        const audioSource = this.audioContext.createMediaElementSource(this.player.player);
        
        this.analyser.fftSize = 256;
        
        audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    }

    addEventListeners() {

        this.canvas.addEventListener('click', () => {
            console.log('clickedss');
            this.togglePlayPause();
        });

        // Timeline tracking
        this.player.player.addEventListener('timeupdate', () => {
            //console.log(`Timeline: ${(this.player.currentTime * 1000).toFixed(0)}ms / ${(this.player.duration * 1000).toFixed(0)}ms`);
        });

        // Random start position
        this.player.player.addEventListener('loadedmetadata', () => {
            const randomTime = Math.random() * this.player.duration;
            this.player.currentTime = randomTime;
            console.log(`Random start position: ${(randomTime * 1000).toFixed(0)}ms (${randomTime.toFixed(3)}s)`);
        });

        // Start visualization
        this.player.player.addEventListener('play', () => {
            this.isPlaying = true;
            this.audioContext.resume().then(() => {
                this.drawWave();
            });
        });

        // Stop visualization when paused
        this.player.player.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        });

        // Add keyboard controls for swift navigation
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardControls(event);
        });
    }

    handleKeyboardControls(event) {
        // Only handle keys when the player is active
        if (!this.player || !this.player.duration) return;

        switch(event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.swiftLeft();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.swiftRight();
                break;
            case ' ': // Spacebar for play/pause
                event.preventDefault();
                this.togglePlayPause();
                break;
        }
    }

    drawWave() {
        if (!this.isPlaying) return;
        
        this.animationId = requestAnimationFrame(() => this.drawWave());

        //this.url.searchParams.set('time', this.player.currentTime);
        //history.replaceState(null, '', this.url);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        // Store the current frequency data for when we pause
        this.lastFrequencyData = new Uint8Array(dataArray);
        
        this.drawFrequencyBars(dataArray);
    }

    drawFrequencyBars(dataArray) {
        // Save the current canvas state
        this.canvasCtx.save();
        
        // Clear the canvas
        this.canvasCtx.fillStyle = 'rgba(246, 248, 248, 1)';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set a relative origin (e.g., bottom-left corner for bars)
        //sthis.canvasCtx.translate(0, this.canvas.height);
        //this.canvasCtx.scale(1, -1); // Flip Y-axis so positive Y goes up
        
        const barWidth = (this.canvas.width / dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            barHeight = dataArray[i] / 255 * this.canvas.height;
            this.canvasCtx.fillStyle = 'rgb(0,0,0)';
            // Now bars grow upward from the bottom
            this.canvasCtx.fillRect(x, 0, barWidth, barHeight);
            x += barWidth + 1;
        }
        
        // Restore the canvas state to draw the center line normally
        this.canvasCtx.restore();
        
        const width = this.canvas.width;
        const duration = this.player.duration;
        //console.log("w", width, 'd', duration);
        // Draw center line (without transformation)
        this.canvasCtx.fillStyle = 'rgba(246, 0, 248, 1)';
        this.canvasCtx.fillRect(this.canvas.width/2 - 2, 0, 4, this.canvas.height);
    }



    


}