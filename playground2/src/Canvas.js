export default class Canvas {

    constructor() {
        this.canvas = document.createElement('canvas');
    }
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.baseWidth = 800;
        this.canvas.width = this.baseWidth;
        this.canvas.height = 200;
        this.canvas.style.border = '1px solid #000';
        this.canvas.style.marginTop = '10px';
        return this.canvas;
    }
    

}