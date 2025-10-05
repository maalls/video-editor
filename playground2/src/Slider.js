export default class Slider {

    constructor() {
        this.sliderContainer;
        this.slider;
    }

    create() {
        // Create slider container
        this.sliderContainer = document.createElement('div');
        this.sliderContainer.className = 'minimal-slider-container';
        
        this.sliderContainer.style.width = 1000 + 'px';
        
        // Create the slider input
        this.slider = document.createElement('input');
        this.slider.type = 'range';
        this.slider.min = '0';
        this.slider.max = '100';
        this.slider.value = '50';
        this.slider.className = 'minimal-slider';
        
        // Add event listener for slider changes
        this.slider.addEventListener('input', (e) => {
            console.log('Slider value:', e.target.value);
            // You can add functionality here (volume, seek, etc.)
            // Fixed the syntax error: this..width -> this.width
            // this.width = (1 - 2*(50 - e.target.value) / 100) * this.baseWidth;
        });
        
        // Add slider to container
        this.sliderContainer.appendChild(this.slider);
        return this.sliderContainer;
    }
}