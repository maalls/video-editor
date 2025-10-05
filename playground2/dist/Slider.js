function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Slider = /*#__PURE__*/function () {
  function Slider() {
    _classCallCheck(this, Slider);
    this.sliderContainer;
    this.slider;
  }
  return _createClass(Slider, [{
    key: "create",
    value: function create() {
      var _this = this;
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
      this.slider.addEventListener('input', function (e) {
        console.log('Slider value:', e.target.value);
        // emit an event
        _this.emit(Slider.SLIDER_CHANGED_EVENT, e.target.value);
        // You can add functionality here (volume, seek, etc.)
        // Fixed the syntax error: this..width -> this.width
        // this.width = (1 - 2*(50 - e.target.value) / 100) * this.baseWidth;
      });

      // Add slider to container
      this.sliderContainer.appendChild(this.slider);
      return this.sliderContainer;
    }
  }, {
    key: "emit",
    value: function emit(eventName, detail) {
      console.log("emiting slide event", eventName, detail);
      var event = new CustomEvent(eventName, {
        detail: detail
      });
      this.sliderContainer.dispatchEvent(event);
    }
  }]);
}();
_defineProperty(Slider, "SLIDER_CHANGED_EVENT", 'sliderChange');
export { Slider as default };