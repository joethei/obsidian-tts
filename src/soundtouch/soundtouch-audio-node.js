/*
* SoundTouch Audio Worklet v0.1.17 AudioWorklet using the
* SoundTouch audio processing library
* 
* Copyright (c) Olli Parviainen
* Copyright (c) Ryan Berdeen
* Copyright (c) Jakub Fiala
* Copyright (c) Steve 'Cutter' Blades
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  Object.defineProperty(subClass, "prototype", {
    writable: false
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }

  return _assertThisInitialized(self);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

var pad = function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};
var minsSecs = function minsSecs(secs) {
  var mins = Math.floor(secs / 60);
  var seconds = secs - mins * 60;
  return "".concat(mins, ":").concat(pad(parseInt(seconds), 2));
};
var diffSecs = function diffSecs(ms1, ms2) {
  return (ms2 - ms1) / 1000;
};

var createSoundTouchNode = function createSoundTouchNode(audioCtx, AudioWorkletNode, arrayBuffer, options) {
  var SoundTouchNode = function (_AudioWorkletNode) {
    _inherits(SoundTouchNode, _AudioWorkletNode);
    var _super = _createSuper(SoundTouchNode);
    function SoundTouchNode(context, arrayBuffer, options) {
      var _this;
      _classCallCheck(this, SoundTouchNode);
      _this = _super.call(this, context, 'soundtouch-worklet', options);
      _this._arrayBuffer = arrayBuffer.slice(0);
      _this.listeners = [];
      _this.port.onmessage = _this._messageProcessor.bind(_assertThisInitialized(_this));
      _this.sourcePosition = 0;
      _this.timePlayed = 0;
      _this._startTime = 0;
      _this._pauseTime = 0;
      _this._playHead = 0;
      _this._playing = false;
      _this._ready = false;
      _this._initialPlay = true;
      return _this;
    }
    _createClass(SoundTouchNode, [{
      key: "formattedDuration",
      get: function get() {
        return minsSecs(this.duration);
      }
    }, {
      key: "formattedTimePlayed",
      get: function get() {
        return minsSecs(this.timePlayed);
      }
    }, {
      key: "percentagePlayed",
      get: function get() {
        return 100 * this.sourcePosition / (this.duration * this.sampleRate);
      }
      ,
      set: function set(percentage) {
        var duration = this.duration,
            sampleRate = this.sampleRate;
        this.sourcePosition = parseInt(duration * sampleRate * (percentage / 100));
        this._updateFilterProp('sourcePosition', this.sourcePosition);
        this.currentTime = this.duration * percentage / 100;
      }
    }, {
      key: "currentTime",
      get: function get() {
        if (!this.playing) {
          return this._playHead;
        }
        return this._playHead + diffSecs(this._startTime, new Date().getTime());
      }
      ,
      set: function set(val) {
        this._playHead = val;
      }
    }, {
      key: "playing",
      get: function get() {
        return this._playing;
      }
      ,
      set: function set(val) {
        this._playing = Boolean(val);
      }
    }, {
      key: "ready",
      get: function get() {
        return this._ready;
      }
      ,
      set: function set(val) {
        this._ready = Boolean(val);
      }
    }, {
      key: "sampleRate",
      get: function get() {
        if (this.audioBuffer) {
          return this.audioBuffer.sampleRate;
        }
        return undefined;
      }
    }, {
      key: "duration",
      get: function get() {
        if (this.audioBuffer) {
          return this.audioBuffer.duration;
        }
        return undefined;
      }
    }, {
      key: "bufferLength",
      get: function get() {
        if (this.audioBuffer) {
          return this.audioBuffer.length;
        }
        return undefined;
      }
    }, {
      key: "numberOfChannels",
      get: function get() {
        if (this.audioBuffer) {
          return this.audioBuffer.numberOfChannels;
        }
        return undefined;
      }
    }, {
      key: "pitch",
      set: function set(pitch) {
        this._updatePipeProp('pitch', pitch);
      }
    }, {
      key: "pitchSemitones",
      set: function set(semitone) {
        this._updatePipeProp('pitchSemitones', semitone);
      }
    }, {
      key: "rate",
      set: function set(rate) {
        this._updatePipeProp('rate', rate);
      }
    }, {
      key: "tempo",
      set: function set(tempo) {
        this._updatePipeProp('tempo', tempo);
      }
    }, {
      key: "connectToBuffer",
      value: function connectToBuffer() {
        this.bufferNode = this.context.createBufferSource();
        this.bufferNode.buffer = this.audioBuffer;
        this.bufferNode.onended = function () {
          return console.log('song ended');
        };
        this.bufferNode.connect(this);
        return this.bufferNode;
      }
    }, {
      key: "disconnectFromBuffer",
      value: function disconnectFromBuffer() {
        this.bufferNode.disconnect();
      }
    }, {
      key: "handleAudioData",
      value: function handleAudioData(audioBuffer) {
        this.audioBuffer = audioBuffer;
        this.port.postMessage({
          message: 'INITIALIZE_PROCESSOR',
          detail: this.createBaseArray(audioBuffer)
        });
      }
    }, {
      key: "createBaseArray",
      value: function createBaseArray(audioBuffer) {
        return [{
          sampleRate: this.sampleRate,
          duration: this.duration,
          bufferLength: this.bufferLength,
          numberOfChannels: this.numberOfChannels
        }, audioBuffer.getChannelData(0), this.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : audioBuffer.getChannelData(0)];
      }
    }, {
      key: "play",
      value: function () {
        var _play = _asyncToGenerator( regeneratorRuntime.mark(function _callee() {
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (this.ready) {
                    _context.next = 2;
                    break;
                  }
                  throw new Error('Your processor is not ready yet');
                case 2:
                  if (this.playing) {
                    this.stop(true);
                  }
                  if (this._initialPlay) {
                    if (this._playHead === 0) {
                      this.percentagePlayed = 0;
                    }
                    this._initialPlay = false;
                  }
                  _context.next = 6;
                  return this.context.resume();
                case 6:
                  this._startTime = new Date().getTime();
                  this.playing = true;
                case 8:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
        function play() {
          return _play.apply(this, arguments);
        }
        return play;
      }()
    }, {
      key: "pause",
      value: function pause() {
        var currTime = this.currentTime;
        this.stop();
        this.currentTime = currTime;
      }
    }, {
      key: "stop",
      value: function () {
        var _stop = _asyncToGenerator( regeneratorRuntime.mark(function _callee2() {
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return this.context.suspend();
                case 2:
                  this.currentTime = 0;
                  this._startTime = new Date().getTime();
                  this.playing = false;
                case 5:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));
        function stop() {
          return _stop.apply(this, arguments);
        }
        return stop;
      }()
    }, {
      key: "on",
      value: function on(eventName, cb) {
        this.listeners.push({
          name: eventName,
          cb: cb
        });
        this.addEventListener(eventName, function (event) {
          return cb(event.detail);
        });
      }
    }, {
      key: "off",
      value: function off() {
        var _this2 = this;
        var eventName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var listeners = this.listeners;
        if (eventName) {
          listeners = listeners.filter(function (e) {
            return e.name === eventName;
          });
        }
        listeners.forEach(function (e) {
          _this2.removeEventListener(e.name, function (event) {
            return e.cb(event.detail);
          });
        });
      }
    }, {
      key: "onprocessorerror",
      value: function onprocessorerror(err) {
        throw err;
      }
    }, {
      key: "_updatePipeProp",
      value: function _updatePipeProp(name, value) {
        this.port.postMessage({
          message: 'SET_PIPE_PROP',
          detail: {
            name: name,
            value: value
          }
        });
      }
    }, {
      key: "_updateFilterProp",
      value: function _updateFilterProp(name, value) {
        this.port.postMessage({
          message: 'SET_FILTER_PROP',
          detail: {
            name: name,
            value: value
          }
        });
      }
    }, {
      key: "_messageProcessor",
      value: function _messageProcessor(eventFromWorker) {
        var _this3 = this;
        var _eventFromWorker$data = eventFromWorker.data,
            message = _eventFromWorker$data.message,
            detail = _eventFromWorker$data.detail;
        var sampleRate = this.sampleRate,
            currentTime = this.timePlayed;
        if (message === 'SOURCEPOSITION') {
          this.sourcePosition = detail;
          var timePlayed = detail / sampleRate;
          if (currentTime !== timePlayed) {
            this.timePlayed = timePlayed;
            var timeEvent = new CustomEvent('play', {
              detail: {
                timePlayed: this.timePlayed,
                formattedTimePlayed: this.formattedTimePlayed,
                percentagePlayed: this.percentagePlayed
              }
            });
            this.dispatchEvent(timeEvent);
          }
        }
        if (message === 'PROCESSOR_CONSTRUCTOR') {
          this.context.decodeAudioData(this._arrayBuffer, function (audioData) {
            return _this3.handleAudioData(audioData);
          }, function (err) {
            return console.log('[decodeAudioData ERROR] ', err);
          });
          return;
        }
        if (message === 'PROCESSOR_READY') {
          this.ready = true;
          if (typeof this.onInitialized === 'function') {
            this.onInitialized(detail);
            return;
          }
          var init = new CustomEvent('initialized', detail);
          this.dispatchEvent(init);
          return;
        }
        if (message === 'PROCESSOR_END') {
          this.stop();
          this.percentagePlayed = 0;
          var endOfPlay = new CustomEvent('end', {
            detail: {
              timePlayed: this.currentTime,
              formattedTimePlayed: this.formattedTimePlayed,
              percentagePlayed: this.percentagePlayed
            }
          });
          this.dispatchEvent(endOfPlay);
          return;
        }
      }
    }]);
    return SoundTouchNode;
  }(AudioWorkletNode);
  return new SoundTouchNode(audioCtx, arrayBuffer, options);
};

export { createSoundTouchNode as default };
//# sourceMappingURL=soundtouch-audio-node.js.map
