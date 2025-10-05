function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import Canvas from './Canvas.js';
import Slider from './Slider.js';
var Navigation = /*#__PURE__*/function () {
  function Navigation(container, player, canvas) {
    _classCallCheck(this, Navigation);
    this.container = container;
    this.player = player;
    this.canvas = canvas;
    console.log("hello", canvas);
    this.canvasCtx = null; // Will be set in createVisualizer
    this.lastFrequencyData = null;
  }
  return _createClass(Navigation, [{
    key: "togglePlayPause",
    value: function togglePlayPause() {
      if (this.player.paused) {
        this.player.play();
      } else {
        this.player.pause();
      }
    }
  }, {
    key: "createVisualizer",
    value: function createVisualizer() {
      var slider = new Slider();

      // Create minimalistic slider
      var s = slider.create();
      this.container.appendChild(s);
      this.timeoffsetContainer = document.createElement('div');
      this.timeoffsetContainer.style.position = 'relative';
      this.timeoffsetContainer.style.top = '0px';
      this.timeoffsetContainer.style.left = '0px';
      this.timeoffsetContainer.append(this.canvas);
      this.container.append(this.timeoffsetContainer);
      console.log("canvas", this.canvas);
      this.canvasCtx = this.canvas.getContext('2d');
      this.setupAudioContext();
      this.addEventListeners();
    }
  }, {
    key: "createSlider",
    value: function createSlider() {
      return this.slider.create();
    }

    // Method to update slider width if canvas width changes
  }, {
    key: "updateSliderWidth",
    value: function updateSliderWidth() {
      if (this.sliderContainer && this.canvas) {
        this.sliderContainer.style.width = this.canvas.width + 'px';
      }
    }

    // Method to resize canvas and update slider accordingly
  }, {
    key: "resizeCanvas",
    value: function resizeCanvas(newWidth, newHeight) {
      this.canvas.width = newWidth;
      this.canvas.height = newHeight || this.canvas.height;
      this.updateSliderWidth();
      console.log("Canvas resized to ".concat(newWidth, "x").concat(this.canvas.height, ", slider width updated"));
    }
  }, {
    key: "setupAudioContext",
    value: function setupAudioContext() {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      var audioSource = this.audioContext.createMediaElementSource(this.player);
      this.analyser.fftSize = 256;
      audioSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
  }, {
    key: "addEventListeners",
    value: function addEventListeners() {
      var _this = this;
      this.canvas.addEventListener('click', function () {
        console.log('clickedss');
        _this.togglePlayPause();
      });

      // Timeline tracking
      this.player.addEventListener('timeupdate', function () {
        //console.log(`Timeline: ${(this.player.currentTime * 1000).toFixed(0)}ms / ${(this.player.duration * 1000).toFixed(0)}ms`);
      });

      // Random start position
      this.player.addEventListener('loadedmetadata', function () {
        var randomTime = Math.random() * _this.player.duration;
        _this.player.currentTime = randomTime;
        console.log("Random start position: ".concat((randomTime * 1000).toFixed(0), "ms (").concat(randomTime.toFixed(3), "s)"));
      });

      // Start visualization
      this.player.addEventListener('play', function () {
        _this.isPlaying = true;
        _this.audioContext.resume().then(function () {
          _this.drawWave();
        });
      });

      // Stop visualization when paused
      this.player.addEventListener('pause', function () {
        _this.isPlaying = false;
        if (_this.animationId) {
          cancelAnimationFrame(_this.animationId);
          _this.animationId = null;
        }
      });

      // Add keyboard controls for swift navigation
      document.addEventListener('keydown', function (event) {
        _this.handleKeyboardControls(event);
      });
    }
  }, {
    key: "handleKeyboardControls",
    value: function handleKeyboardControls(event) {
      // Only handle keys when the player is active
      if (!this.player || !this.player.duration) return;
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          this.swiftLeft();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.swiftRight();
          break;
        case ' ':
          // Spacebar for play/pause
          event.preventDefault();
          this.togglePlayPause();
          break;
      }
    }
  }, {
    key: "drawWave",
    value: function drawWave() {
      var _this2 = this;
      if (!this.isPlaying) return;
      this.animationId = requestAnimationFrame(function () {
        return _this2.drawWave();
      });

      //this.url.searchParams.set('time', this.player.currentTime);
      //history.replaceState(null, '', this.url);

      var bufferLength = this.analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // Store the current frequency data for when we pause
      this.lastFrequencyData = new Uint8Array(dataArray);
      this.drawFrequencyBars(dataArray);
    }
  }, {
    key: "drawFrequencyBars",
    value: function drawFrequencyBars(dataArray) {
      // Save the current canvas state
      this.canvasCtx.save();

      // Clear the canvas
      this.canvasCtx.fillStyle = 'rgba(246, 248, 248, 1)';
      this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Set a relative origin (e.g., bottom-left corner for bars)
      //sthis.canvasCtx.translate(0, this.canvas.height);
      //this.canvasCtx.scale(1, -1); // Flip Y-axis so positive Y goes up

      var barWidth = this.canvas.width / dataArray.length * 2.5;
      var barHeight;
      var x = 0;
      for (var i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 255 * this.canvas.height;
        this.canvasCtx.fillStyle = 'rgb(0,0,0)';
        // Now bars grow upward from the bottom
        this.canvasCtx.fillRect(x, 0, barWidth, barHeight);
        x += barWidth + 1;
      }

      // Restore the canvas state to draw the center line normally
      this.canvasCtx.restore();
      var width = this.canvas.width;
      var duration = this.player.duration;
      //console.log("w", width, 'd', duration);
      // Draw center line (without transformation)
      this.canvasCtx.fillStyle = 'rgba(246, 0, 248, 1)';
      this.canvasCtx.fillRect(this.canvas.width / 2 - 2, 0, 4, this.canvas.height);
    }
  }]);
}();
export { Navigation as default };