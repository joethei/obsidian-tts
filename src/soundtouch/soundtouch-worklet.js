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

'use strict';

function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
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

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
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

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }

  return object;
}

function _get() {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);

      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(arguments.length < 3 ? target : receiver);
      }

      return desc.value;
    };
  }

  return _get.apply(this, arguments);
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var runtime = function (exports) {
  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined$1;
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    define({}, "");
  } catch (err) {
    define = function define(obj, key, value) {
      return obj[key] = value;
    };
  }
  function wrap(innerFn, outerFn, self, tryLocsList) {
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);
    generator._invoke = makeInvokeMethod(innerFn, self, context);
    return generator;
  }
  exports.wrap = wrap;
  function tryCatch(fn, obj, arg) {
    try {
      return {
        type: "normal",
        arg: fn.call(obj, arg)
      };
    } catch (err) {
      return {
        type: "throw",
        arg: err
      };
    }
  }
  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";
  var ContinueSentinel = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });
  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    IteratorPrototype = NativeIteratorPrototype;
  }
  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  define(Gp, "constructor", GeneratorFunctionPrototype);
  define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
  GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction");
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      define(prototype, method, function (arg) {
        return this._invoke(method, arg);
      });
    });
  }
  exports.isGeneratorFunction = function (genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor ? ctor === GeneratorFunction ||
    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
  };
  exports.mark = function (genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };
  exports.awrap = function (arg) {
    return {
      __await: arg
    };
  };
  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value && _typeof(value) === "object" && hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function (value) {
            invoke("next", value, resolve, reject);
          }, function (err) {
            invoke("throw", err, resolve, reject);
          });
        }
        return PromiseImpl.resolve(value).then(function (unwrapped) {
          result.value = unwrapped;
          resolve(result);
        }, function (error) {
          return invoke("throw", error, resolve, reject);
        });
      }
    }
    var previousPromise;
    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function (resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }
      return previousPromise =
      previousPromise ? previousPromise.then(callInvokeWithMethodAndArg,
      callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    }
    this._invoke = enqueue;
  }
  defineIteratorMethods(AsyncIterator.prototype);
  define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  });
  exports.AsyncIterator = AsyncIterator;
  exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
    return exports.isGeneratorFunction(outerFn) ? iter
    : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  };
  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;
    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }
      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }
        return doneResult();
      }
      context.method = method;
      context.arg = arg;
      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }
        if (context.method === "next") {
          context.sent = context._sent = context.arg;
        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }
          context.dispatchException(context.arg);
        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }
        state = GenStateExecuting;
        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          state = context.done ? GenStateCompleted : GenStateSuspendedYield;
          if (record.arg === ContinueSentinel) {
            continue;
          }
          return {
            value: record.arg,
            done: context.done
          };
        } else if (record.type === "throw") {
          state = GenStateCompleted;
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined$1) {
      context.delegate = null;
      if (context.method === "throw") {
        if (delegate.iterator["return"]) {
          context.method = "return";
          context.arg = undefined$1;
          maybeInvokeDelegate(delegate, context);
          if (context.method === "throw") {
            return ContinueSentinel;
          }
        }
        context.method = "throw";
        context.arg = new TypeError("The iterator does not provide a 'throw' method");
      }
      return ContinueSentinel;
    }
    var record = tryCatch(method, delegate.iterator, context.arg);
    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }
    var info = record.arg;
    if (!info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }
    if (info.done) {
      context[delegate.resultName] = info.value;
      context.next = delegate.nextLoc;
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined$1;
      }
    } else {
      return info;
    }
    context.delegate = null;
    return ContinueSentinel;
  }
  defineIteratorMethods(Gp);
  define(Gp, toStringTagSymbol, "Generator");
  define(Gp, iteratorSymbol, function () {
    return this;
  });
  define(Gp, "toString", function () {
    return "[object Generator]";
  });
  function pushTryEntry(locs) {
    var entry = {
      tryLoc: locs[0]
    };
    if (1 in locs) {
      entry.catchLoc = locs[1];
    }
    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }
    this.tryEntries.push(entry);
  }
  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }
  function Context(tryLocsList) {
    this.tryEntries = [{
      tryLoc: "root"
    }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }
  exports.keys = function (object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }
      next.done = true;
      return next;
    };
  };
  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }
      if (typeof iterable.next === "function") {
        return iterable;
      }
      if (!isNaN(iterable.length)) {
        var i = -1,
            next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }
          next.value = undefined$1;
          next.done = true;
          return next;
        };
        return next.next = next;
      }
    }
    return {
      next: doneResult
    };
  }
  exports.values = values;
  function doneResult() {
    return {
      value: undefined$1,
      done: true
    };
  }
  Context.prototype = {
    constructor: Context,
    reset: function reset(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = this._sent = undefined$1;
      this.done = false;
      this.delegate = null;
      this.method = "next";
      this.arg = undefined$1;
      this.tryEntries.forEach(resetTryEntry);
      if (!skipTempReset) {
        for (var name in this) {
          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
            this[name] = undefined$1;
          }
        }
      }
    },
    stop: function stop() {
      this.done = true;
      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }
      return this.rval;
    },
    dispatchException: function dispatchException(exception) {
      if (this.done) {
        throw exception;
      }
      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        if (caught) {
          context.method = "next";
          context.arg = undefined$1;
        }
        return !!caught;
      }
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;
        if (entry.tryLoc === "root") {
          return handle("end");
        }
        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");
          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }
          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },
    abrupt: function abrupt(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }
      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
        finallyEntry = null;
      }
      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;
      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }
      return this.complete(record);
    },
    complete: function complete(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }
      if (record.type === "break" || record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
      return ContinueSentinel;
    },
    finish: function finish(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },
    "catch": function _catch(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }
      throw new Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };
      if (this.method === "next") {
        this.arg = undefined$1;
      }
      return ContinueSentinel;
    }
  };
  return exports;
}(
(typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" ? module.exports : {});
try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  if ((typeof globalThis === "undefined" ? "undefined" : _typeof(globalThis)) === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}

var FifoSampleBuffer = function () {
  function FifoSampleBuffer() {
    _classCallCheck(this, FifoSampleBuffer);
    this._vector = new Float32Array();
    this._position = 0;
    this._frameCount = 0;
  }
  _createClass(FifoSampleBuffer, [{
    key: "vector",
    get: function get() {
      return this._vector;
    }
  }, {
    key: "position",
    get: function get() {
      return this._position;
    }
  }, {
    key: "startIndex",
    get: function get() {
      return this._position * 2;
    }
  }, {
    key: "frameCount",
    get: function get() {
      return this._frameCount;
    }
  }, {
    key: "endIndex",
    get: function get() {
      return (this._position + this._frameCount) * 2;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.receive(this._frameCount);
      this.rewind();
    }
  }, {
    key: "put",
    value: function put(numFrames) {
      this._frameCount += numFrames;
    }
  }, {
    key: "putSamples",
    value: function putSamples(samples, position) {
      var numFrames = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      position = position || 0;
      var sourceOffset = position * 2;
      if (!(numFrames >= 0)) {
        numFrames = (samples.length - sourceOffset) / 2;
      }
      var numSamples = numFrames * 2;
      this.ensureCapacity(numFrames + this._frameCount);
      var destOffset = this.endIndex;
      this.vector.set(samples.subarray(sourceOffset, sourceOffset + numSamples), destOffset);
      this._frameCount += numFrames;
    }
  }, {
    key: "putBuffer",
    value: function putBuffer(buffer, position) {
      var numFrames = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      position = position || 0;
      if (!(numFrames >= 0)) {
        numFrames = buffer.frameCount - position;
      }
      this.putSamples(buffer.vector, buffer.position + position, numFrames);
    }
  }, {
    key: "receive",
    value: function receive(numFrames) {
      if (!(numFrames >= 0) || numFrames > this._frameCount) {
        numFrames = this.frameCount;
      }
      this._frameCount -= numFrames;
      this._position += numFrames;
    }
  }, {
    key: "receiveSamples",
    value: function receiveSamples(output) {
      var numFrames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var numSamples = numFrames * 2;
      var sourceOffset = this.startIndex;
      output.set(this._vector.subarray(sourceOffset, sourceOffset + numSamples));
      this.receive(numFrames);
    }
  }, {
    key: "extract",
    value: function extract(output) {
      var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var numFrames = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var sourceOffset = this.startIndex + position * 2;
      var numSamples = numFrames * 2;
      output.set(this._vector.subarray(sourceOffset, sourceOffset + numSamples));
    }
  }, {
    key: "ensureCapacity",
    value: function ensureCapacity() {
      var numFrames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var minLength = parseInt(numFrames * 2);
      if (this._vector.length < minLength) {
        var newVector = new Float32Array(minLength);
        newVector.set(this._vector.subarray(this.startIndex, this.endIndex));
        this._vector = newVector;
        this._position = 0;
      } else {
        this.rewind();
      }
    }
  }, {
    key: "ensureAdditionalCapacity",
    value: function ensureAdditionalCapacity() {
      var numFrames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      this.ensureCapacity(this._frameCount + numFrames);
    }
  }, {
    key: "rewind",
    value: function rewind() {
      if (this._position > 0) {
        this._vector.set(this._vector.subarray(this.startIndex, this.endIndex));
        this._position = 0;
      }
    }
  }]);
  return FifoSampleBuffer;
}();
var AbstractFifoSamplePipe = function () {
  function AbstractFifoSamplePipe(createBuffers) {
    _classCallCheck(this, AbstractFifoSamplePipe);
    if (createBuffers) {
      this._inputBuffer = new FifoSampleBuffer();
      this._outputBuffer = new FifoSampleBuffer();
    } else {
      this._inputBuffer = this._outputBuffer = null;
    }
  }
  _createClass(AbstractFifoSamplePipe, [{
    key: "inputBuffer",
    get: function get() {
      return this._inputBuffer;
    },
    set: function set(inputBuffer) {
      this._inputBuffer = inputBuffer;
    }
  }, {
    key: "outputBuffer",
    get: function get() {
      return this._outputBuffer;
    },
    set: function set(outputBuffer) {
      this._outputBuffer = outputBuffer;
    }
  }, {
    key: "clear",
    value: function clear() {
      this._inputBuffer.clear();
      this._outputBuffer.clear();
    }
  }]);
  return AbstractFifoSamplePipe;
}();
var RateTransposer = function (_AbstractFifoSamplePi) {
  _inherits(RateTransposer, _AbstractFifoSamplePi);
  var _super = _createSuper(RateTransposer);
  function RateTransposer(createBuffers) {
    var _this;
    _classCallCheck(this, RateTransposer);
    _this = _super.call(this, createBuffers);
    _this.reset();
    _this._rate = 1;
    return _this;
  }
  _createClass(RateTransposer, [{
    key: "rate",
    set: function set(rate) {
      this._rate = rate;
    }
  }, {
    key: "reset",
    value: function reset() {
      this.slopeCount = 0;
      this.prevSampleL = 0;
      this.prevSampleR = 0;
    }
  }, {
    key: "clone",
    value: function clone() {
      var result = new RateTransposer();
      result.rate = this._rate;
      return result;
    }
  }, {
    key: "process",
    value: function process() {
      var numFrames = this._inputBuffer.frameCount;
      this._outputBuffer.ensureAdditionalCapacity(numFrames / this._rate + 1);
      var numFramesOutput = this.transpose(numFrames);
      this._inputBuffer.receive();
      this._outputBuffer.put(numFramesOutput);
    }
  }, {
    key: "transpose",
    value: function transpose() {
      var numFrames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      if (numFrames === 0) {
        return 0;
      }
      var src = this._inputBuffer.vector;
      var srcOffset = this._inputBuffer.startIndex;
      var dest = this._outputBuffer.vector;
      var destOffset = this._outputBuffer.endIndex;
      var used = 0;
      var i = 0;
      while (this.slopeCount < 1.0) {
        dest[destOffset + 2 * i] = (1.0 - this.slopeCount) * this.prevSampleL + this.slopeCount * src[srcOffset];
        dest[destOffset + 2 * i + 1] = (1.0 - this.slopeCount) * this.prevSampleR + this.slopeCount * src[srcOffset + 1];
        i = i + 1;
        this.slopeCount += this._rate;
      }
      this.slopeCount -= 1.0;
      if (numFrames !== 1) {
        out: while (true) {
          while (this.slopeCount > 1.0) {
            this.slopeCount -= 1.0;
            used = used + 1;
            if (used >= numFrames - 1) {
              break out;
            }
          }
          var srcIndex = srcOffset + 2 * used;
          dest[destOffset + 2 * i] = (1.0 - this.slopeCount) * src[srcIndex] + this.slopeCount * src[srcIndex + 2];
          dest[destOffset + 2 * i + 1] = (1.0 - this.slopeCount) * src[srcIndex + 1] + this.slopeCount * src[srcIndex + 3];
          i = i + 1;
          this.slopeCount += this._rate;
        }
      }
      this.prevSampleL = src[srcOffset + 2 * numFrames - 2];
      this.prevSampleR = src[srcOffset + 2 * numFrames - 1];
      return i;
    }
  }]);
  return RateTransposer;
}(AbstractFifoSamplePipe);
var FilterSupport = function () {
  function FilterSupport(pipe) {
    _classCallCheck(this, FilterSupport);
    this._pipe = pipe;
  }
  _createClass(FilterSupport, [{
    key: "pipe",
    get: function get() {
      return this._pipe;
    }
  }, {
    key: "inputBuffer",
    get: function get() {
      return this._pipe.inputBuffer;
    }
  }, {
    key: "outputBuffer",
    get: function get() {
      return this._pipe.outputBuffer;
    }
  }, {
    key: "fillInputBuffer",
    value: function fillInputBuffer() {
      throw new Error('fillInputBuffer() not overridden');
    }
  }, {
    key: "fillOutputBuffer",
    value: function fillOutputBuffer() {
      var numFrames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      while (this.outputBuffer.frameCount < numFrames) {
        var numInputFrames = 8192 * 2 - this.inputBuffer.frameCount;
        this.fillInputBuffer(numInputFrames);
        if (this.inputBuffer.frameCount < 8192 * 2) {
          break;
        }
        this._pipe.process();
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      this._pipe.clear();
    }
  }]);
  return FilterSupport;
}();
var noop = function noop() {
  return;
};
var SimpleFilter = function (_FilterSupport) {
  _inherits(SimpleFilter, _FilterSupport);
  var _super2 = _createSuper(SimpleFilter);
  function SimpleFilter(sourceSound, pipe) {
    var _this2;
    var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
    _classCallCheck(this, SimpleFilter);
    _this2 = _super2.call(this, pipe);
    _this2.callback = callback;
    _this2.sourceSound = sourceSound;
    _this2.historyBufferSize = 22050;
    _this2._sourcePosition = 0;
    _this2.outputBufferPosition = 0;
    _this2._position = 0;
    return _this2;
  }
  _createClass(SimpleFilter, [{
    key: "position",
    get: function get() {
      return this._position;
    },
    set: function set(position) {
      if (position > this._position) {
        throw new RangeError('New position may not be greater than current position');
      }
      var newOutputBufferPosition = this.outputBufferPosition - (this._position - position);
      if (newOutputBufferPosition < 0) {
        throw new RangeError('New position falls outside of history buffer');
      }
      this.outputBufferPosition = newOutputBufferPosition;
      this._position = position;
    }
  }, {
    key: "sourcePosition",
    get: function get() {
      return this._sourcePosition;
    },
    set: function set(sourcePosition) {
      this.clear();
      this._sourcePosition = sourcePosition;
    }
  }, {
    key: "onEnd",
    value: function onEnd() {
      this.callback();
    }
  }, {
    key: "fillInputBuffer",
    value: function fillInputBuffer() {
      var numFrames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var samples = new Float32Array(numFrames * 2);
      var numFramesExtracted = this.sourceSound.extract(samples, numFrames, this._sourcePosition);
      this._sourcePosition += numFramesExtracted;
      this.inputBuffer.putSamples(samples, 0, numFramesExtracted);
    }
  }, {
    key: "extract",
    value: function extract(target) {
      var numFrames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      this.fillOutputBuffer(this.outputBufferPosition + numFrames);
      var numFramesExtracted = Math.min(numFrames, this.outputBuffer.frameCount - this.outputBufferPosition);
      this.outputBuffer.extract(target, this.outputBufferPosition, numFramesExtracted);
      var currentFrames = this.outputBufferPosition + numFramesExtracted;
      this.outputBufferPosition = Math.min(this.historyBufferSize, currentFrames);
      this.outputBuffer.receive(Math.max(currentFrames - this.historyBufferSize, 0));
      this._position += numFramesExtracted;
      return numFramesExtracted;
    }
  }, {
    key: "handleSampleData",
    value: function handleSampleData(event) {
      this.extract(event.data, 4096);
    }
  }, {
    key: "clear",
    value: function clear() {
      _get(_getPrototypeOf(SimpleFilter.prototype), "clear", this).call(this);
      this.outputBufferPosition = 0;
    }
  }]);
  return SimpleFilter;
}(FilterSupport);
var USE_AUTO_SEQUENCE_LEN = 0;
var DEFAULT_SEQUENCE_MS = USE_AUTO_SEQUENCE_LEN;
var USE_AUTO_SEEKWINDOW_LEN = 0;
var DEFAULT_SEEKWINDOW_MS = USE_AUTO_SEEKWINDOW_LEN;
var DEFAULT_OVERLAP_MS = 8;
var _SCAN_OFFSETS = [[124, 186, 248, 310, 372, 434, 496, 558, 620, 682, 744, 806, 868, 930, 992, 1054, 1116, 1178, 1240, 1302, 1364, 1426, 1488, 0], [-100, -75, -50, -25, 25, 50, 75, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [-20, -15, -10, -5, 5, 10, 15, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [-4, -3, -2, -1, 1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
var AUTOSEQ_TEMPO_LOW = 0.5;
var AUTOSEQ_TEMPO_TOP = 2.0;
var AUTOSEQ_AT_MIN = 125.0;
var AUTOSEQ_AT_MAX = 50.0;
var AUTOSEQ_K = (AUTOSEQ_AT_MAX - AUTOSEQ_AT_MIN) / (AUTOSEQ_TEMPO_TOP - AUTOSEQ_TEMPO_LOW);
var AUTOSEQ_C = AUTOSEQ_AT_MIN - AUTOSEQ_K * AUTOSEQ_TEMPO_LOW;
var AUTOSEEK_AT_MIN = 25.0;
var AUTOSEEK_AT_MAX = 15.0;
var AUTOSEEK_K = (AUTOSEEK_AT_MAX - AUTOSEEK_AT_MIN) / (AUTOSEQ_TEMPO_TOP - AUTOSEQ_TEMPO_LOW);
var AUTOSEEK_C = AUTOSEEK_AT_MIN - AUTOSEEK_K * AUTOSEQ_TEMPO_LOW;
var Stretch = function (_AbstractFifoSamplePi2) {
  _inherits(Stretch, _AbstractFifoSamplePi2);
  var _super3 = _createSuper(Stretch);
  function Stretch(createBuffers) {
    var _this3;
    _classCallCheck(this, Stretch);
    _this3 = _super3.call(this, createBuffers);
    _this3._quickSeek = true;
    _this3.midBufferDirty = false;
    _this3.midBuffer = null;
    _this3.overlapLength = 0;
    _this3.autoSeqSetting = true;
    _this3.autoSeekSetting = true;
    _this3._tempo = 1;
    _this3.setParameters(44100, DEFAULT_SEQUENCE_MS, DEFAULT_SEEKWINDOW_MS, DEFAULT_OVERLAP_MS);
    return _this3;
  }
  _createClass(Stretch, [{
    key: "clear",
    value: function clear() {
      _get(_getPrototypeOf(Stretch.prototype), "clear", this).call(this);
      this.clearMidBuffer();
    }
  }, {
    key: "clearMidBuffer",
    value: function clearMidBuffer() {
      if (this.midBufferDirty) {
        this.midBufferDirty = false;
        this.midBuffer = null;
      }
    }
  }, {
    key: "setParameters",
    value: function setParameters(sampleRate, sequenceMs, seekWindowMs, overlapMs) {
      if (sampleRate > 0) {
        this.sampleRate = sampleRate;
      }
      if (overlapMs > 0) {
        this.overlapMs = overlapMs;
      }
      if (sequenceMs > 0) {
        this.sequenceMs = sequenceMs;
        this.autoSeqSetting = false;
      } else {
        this.autoSeqSetting = true;
      }
      if (seekWindowMs > 0) {
        this.seekWindowMs = seekWindowMs;
        this.autoSeekSetting = false;
      } else {
        this.autoSeekSetting = true;
      }
      this.calculateSequenceParameters();
      this.calculateOverlapLength(this.overlapMs);
      this.tempo = this._tempo;
    }
  }, {
    key: "tempo",
    get: function get() {
      return this._tempo;
    },
    set: function set(newTempo) {
      var intskip;
      this._tempo = newTempo;
      this.calculateSequenceParameters();
      this.nominalSkip = this._tempo * (this.seekWindowLength - this.overlapLength);
      this.skipFract = 0;
      intskip = Math.floor(this.nominalSkip + 0.5);
      this.sampleReq = Math.max(intskip + this.overlapLength, this.seekWindowLength) + this.seekLength;
    }
  }, {
    key: "inputChunkSize",
    get: function get() {
      return this.sampleReq;
    }
  }, {
    key: "outputChunkSize",
    get: function get() {
      return this.overlapLength + Math.max(0, this.seekWindowLength - 2 * this.overlapLength);
    }
  }, {
    key: "calculateOverlapLength",
    value: function calculateOverlapLength() {
      var overlapInMsec = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var newOvl;
      newOvl = this.sampleRate * overlapInMsec / 1000;
      newOvl = newOvl < 16 ? 16 : newOvl;
      newOvl -= newOvl % 8;
      this.overlapLength = newOvl;
      this.refMidBuffer = new Float32Array(this.overlapLength * 2);
      this.midBuffer = new Float32Array(this.overlapLength * 2);
    }
  }, {
    key: "checkLimits",
    value: function checkLimits(x, mi, ma) {
      return x < mi ? mi : x > ma ? ma : x;
    }
  }, {
    key: "calculateSequenceParameters",
    value: function calculateSequenceParameters() {
      var seq;
      var seek;
      if (this.autoSeqSetting) {
        seq = AUTOSEQ_C + AUTOSEQ_K * this._tempo;
        seq = this.checkLimits(seq, AUTOSEQ_AT_MAX, AUTOSEQ_AT_MIN);
        this.sequenceMs = Math.floor(seq + 0.5);
      }
      if (this.autoSeekSetting) {
        seek = AUTOSEEK_C + AUTOSEEK_K * this._tempo;
        seek = this.checkLimits(seek, AUTOSEEK_AT_MAX, AUTOSEEK_AT_MIN);
        this.seekWindowMs = Math.floor(seek + 0.5);
      }
      this.seekWindowLength = Math.floor(this.sampleRate * this.sequenceMs / 1000);
      this.seekLength = Math.floor(this.sampleRate * this.seekWindowMs / 1000);
    }
  }, {
    key: "quickSeek",
    set: function set(enable) {
      this._quickSeek = enable;
    }
  }, {
    key: "clone",
    value: function clone() {
      var result = new Stretch();
      result.tempo = this._tempo;
      result.setParameters(this.sampleRate, this.sequenceMs, this.seekWindowMs, this.overlapMs);
      return result;
    }
  }, {
    key: "seekBestOverlapPosition",
    value: function seekBestOverlapPosition() {
      return this._quickSeek ? this.seekBestOverlapPositionStereoQuick() : this.seekBestOverlapPositionStereo();
    }
  }, {
    key: "seekBestOverlapPositionStereo",
    value: function seekBestOverlapPositionStereo() {
      var bestOffset;
      var bestCorrelation;
      var correlation;
      var i = 0;
      this.preCalculateCorrelationReferenceStereo();
      bestOffset = 0;
      bestCorrelation = Number.MIN_VALUE;
      for (; i < this.seekLength; i = i + 1) {
        correlation = this.calculateCrossCorrelationStereo(2 * i, this.refMidBuffer);
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = i;
        }
      }
      return bestOffset;
    }
  }, {
    key: "seekBestOverlapPositionStereoQuick",
    value: function seekBestOverlapPositionStereoQuick() {
      var bestOffset;
      var bestCorrelation;
      var correlation;
      var scanCount = 0;
      var correlationOffset;
      var tempOffset;
      this.preCalculateCorrelationReferenceStereo();
      bestCorrelation = Number.MIN_VALUE;
      bestOffset = 0;
      correlationOffset = 0;
      tempOffset = 0;
      for (; scanCount < 4; scanCount = scanCount + 1) {
        var j = 0;
        while (_SCAN_OFFSETS[scanCount][j]) {
          tempOffset = correlationOffset + _SCAN_OFFSETS[scanCount][j];
          if (tempOffset >= this.seekLength) {
            break;
          }
          correlation = this.calculateCrossCorrelationStereo(2 * tempOffset, this.refMidBuffer);
          if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestOffset = tempOffset;
          }
          j = j + 1;
        }
        correlationOffset = bestOffset;
      }
      return bestOffset;
    }
  }, {
    key: "preCalculateCorrelationReferenceStereo",
    value: function preCalculateCorrelationReferenceStereo() {
      var i = 0;
      var context;
      var temp;
      for (; i < this.overlapLength; i = i + 1) {
        temp = i * (this.overlapLength - i);
        context = i * 2;
        this.refMidBuffer[context] = this.midBuffer[context] * temp;
        this.refMidBuffer[context + 1] = this.midBuffer[context + 1] * temp;
      }
    }
  }, {
    key: "calculateCrossCorrelationStereo",
    value: function calculateCrossCorrelationStereo(mixingPosition, compare) {
      var mixing = this._inputBuffer.vector;
      mixingPosition += this._inputBuffer.startIndex;
      var correlation = 0;
      var i = 2;
      var calcLength = 2 * this.overlapLength;
      var mixingOffset;
      for (; i < calcLength; i = i + 2) {
        mixingOffset = i + mixingPosition;
        correlation += mixing[mixingOffset] * compare[i] + mixing[mixingOffset + 1] * compare[i + 1];
      }
      return correlation;
    }
  }, {
    key: "overlap",
    value: function overlap(overlapPosition) {
      this.overlapStereo(2 * overlapPosition);
    }
  }, {
    key: "overlapStereo",
    value: function overlapStereo(inputPosition) {
      var input = this._inputBuffer.vector;
      inputPosition += this._inputBuffer.startIndex;
      var output = this._outputBuffer.vector;
      var outputPosition = this._outputBuffer.endIndex;
      var i = 0;
      var context;
      var tempFrame;
      var frameScale = 1 / this.overlapLength;
      var fi;
      var inputOffset;
      var outputOffset;
      for (; i < this.overlapLength; i = i + 1) {
        tempFrame = (this.overlapLength - i) * frameScale;
        fi = i * frameScale;
        context = 2 * i;
        inputOffset = context + inputPosition;
        outputOffset = context + outputPosition;
        output[outputOffset + 0] = input[inputOffset + 0] * fi + this.midBuffer[context + 0] * tempFrame;
        output[outputOffset + 1] = input[inputOffset + 1] * fi + this.midBuffer[context + 1] * tempFrame;
      }
    }
  }, {
    key: "process",
    value: function process() {
      var offset;
      var temp;
      var overlapSkip;
      if (this.midBuffer === null) {
        if (this._inputBuffer.frameCount < this.overlapLength) {
          return;
        }
        this.midBuffer = new Float32Array(this.overlapLength * 2);
        this._inputBuffer.receiveSamples(this.midBuffer, this.overlapLength);
      }
      while (this._inputBuffer.frameCount >= this.sampleReq) {
        offset = this.seekBestOverlapPosition();
        this._outputBuffer.ensureAdditionalCapacity(this.overlapLength);
        this.overlap(Math.floor(offset));
        this._outputBuffer.put(this.overlapLength);
        temp = this.seekWindowLength - 2 * this.overlapLength;
        if (temp > 0) {
          this._outputBuffer.putBuffer(this._inputBuffer, offset + this.overlapLength, temp);
        }
        var start = this._inputBuffer.startIndex + 2 * (offset + this.seekWindowLength - this.overlapLength);
        this.midBuffer.set(this._inputBuffer.vector.subarray(start, start + 2 * this.overlapLength));
        this.skipFract += this.nominalSkip;
        overlapSkip = Math.floor(this.skipFract);
        this.skipFract -= overlapSkip;
        this._inputBuffer.receive(overlapSkip);
      }
    }
  }]);
  return Stretch;
}(AbstractFifoSamplePipe);
var testFloatEqual = function testFloatEqual(a, b) {
  return (a > b ? a - b : b - a) > 1e-10;
};
var SoundTouch = function () {
  function SoundTouch() {
    _classCallCheck(this, SoundTouch);
    this.transposer = new RateTransposer(false);
    this.stretch = new Stretch(false);
    this._inputBuffer = new FifoSampleBuffer();
    this._intermediateBuffer = new FifoSampleBuffer();
    this._outputBuffer = new FifoSampleBuffer();
    this._rate = 0;
    this._tempo = 0;
    this.virtualPitch = 1.0;
    this.virtualRate = 1.0;
    this.virtualTempo = 1.0;
    this.calculateEffectiveRateAndTempo();
  }
  _createClass(SoundTouch, [{
    key: "clear",
    value: function clear() {
      this.transposer.clear();
      this.stretch.clear();
    }
  }, {
    key: "clone",
    value: function clone() {
      var result = new SoundTouch();
      result.rate = this.rate;
      result.tempo = this.tempo;
      return result;
    }
  }, {
    key: "rate",
    get: function get() {
      return this._rate;
    },
    set: function set(rate) {
      this.virtualRate = rate;
      this.calculateEffectiveRateAndTempo();
    }
  }, {
    key: "rateChange",
    set: function set(rateChange) {
      this._rate = 1.0 + 0.01 * rateChange;
    }
  }, {
    key: "tempo",
    get: function get() {
      return this._tempo;
    },
    set: function set(tempo) {
      this.virtualTempo = tempo;
      this.calculateEffectiveRateAndTempo();
    }
  }, {
    key: "tempoChange",
    set: function set(tempoChange) {
      this.tempo = 1.0 + 0.01 * tempoChange;
    }
  }, {
    key: "pitch",
    set: function set(pitch) {
      this.virtualPitch = pitch;
      this.calculateEffectiveRateAndTempo();
    }
  }, {
    key: "pitchOctaves",
    set: function set(pitchOctaves) {
      this.pitch = Math.exp(0.69314718056 * pitchOctaves);
      this.calculateEffectiveRateAndTempo();
    }
  }, {
    key: "pitchSemitones",
    set: function set(pitchSemitones) {
      this.pitchOctaves = pitchSemitones / 12.0;
    }
  }, {
    key: "inputBuffer",
    get: function get() {
      return this._inputBuffer;
    }
  }, {
    key: "outputBuffer",
    get: function get() {
      return this._outputBuffer;
    }
  }, {
    key: "calculateEffectiveRateAndTempo",
    value: function calculateEffectiveRateAndTempo() {
      var previousTempo = this._tempo;
      var previousRate = this._rate;
      this._tempo = this.virtualTempo / this.virtualPitch;
      this._rate = this.virtualRate * this.virtualPitch;
      if (testFloatEqual(this._tempo, previousTempo)) {
        this.stretch.tempo = this._tempo;
      }
      if (testFloatEqual(this._rate, previousRate)) {
        this.transposer.rate = this._rate;
      }
      if (this._rate > 1.0) {
        if (this._outputBuffer != this.transposer.outputBuffer) {
          this.stretch.inputBuffer = this._inputBuffer;
          this.stretch.outputBuffer = this._intermediateBuffer;
          this.transposer.inputBuffer = this._intermediateBuffer;
          this.transposer.outputBuffer = this._outputBuffer;
        }
      } else {
        if (this._outputBuffer != this.stretch.outputBuffer) {
          this.transposer.inputBuffer = this._inputBuffer;
          this.transposer.outputBuffer = this._intermediateBuffer;
          this.stretch.inputBuffer = this._intermediateBuffer;
          this.stretch.outputBuffer = this._outputBuffer;
        }
      }
    }
  }, {
    key: "process",
    value: function process() {
      if (this._rate > 1.0) {
        this.stretch.process();
        this.transposer.process();
      } else {
        this.transposer.process();
        this.stretch.process();
      }
    }
  }]);
  return SoundTouch;
}();
var WebAudioBufferSource = function () {
  function WebAudioBufferSource(buffer) {
    _classCallCheck(this, WebAudioBufferSource);
    this.buffer = buffer;
    this._position = 0;
  }
  _createClass(WebAudioBufferSource, [{
    key: "dualChannel",
    get: function get() {
      return this.buffer.numberOfChannels > 1;
    }
  }, {
    key: "position",
    get: function get() {
      return this._position;
    },
    set: function set(value) {
      this._position = value;
    }
  }, {
    key: "extract",
    value: function extract(target) {
      var numFrames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      this.position = position;
      var left = this.buffer.getChannelData(0);
      var right = this.dualChannel ? this.buffer.getChannelData(1) : this.buffer.getChannelData(0);
      var i = 0;
      for (; i < numFrames; i++) {
        target[i * 2] = left[i + position];
        target[i * 2 + 1] = right[i + position];
      }
      return Math.min(numFrames, left.length - position);
    }
  }]);
  return WebAudioBufferSource;
}();
var getWebAudioNode = function getWebAudioNode(context, filter) {
  var sourcePositionCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
  var bufferSize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 4096;
  var node = context.createScriptProcessor(bufferSize, 2, 2);
  var samples = new Float32Array(bufferSize * 2);
  node.onaudioprocess = function (event) {
    var left = event.outputBuffer.getChannelData(0);
    var right = event.outputBuffer.getChannelData(1);
    var framesExtracted = filter.extract(samples, bufferSize);
    sourcePositionCallback(filter.sourcePosition);
    if (framesExtracted === 0) {
      filter.onEnd();
    }
    var i = 0;
    for (; i < framesExtracted; i++) {
      left[i] = samples[i * 2];
      right[i] = samples[i * 2 + 1];
    }
  };
  return node;
};
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
var onUpdate = function onUpdate(sourcePosition) {
  var currentTimePlayed = this.timePlayed;
  var sampleRate = this.sampleRate;
  this.sourcePosition = sourcePosition;
  this.timePlayed = sourcePosition / sampleRate;
  if (currentTimePlayed !== this.timePlayed) {
    var timePlayed = new CustomEvent('play', {
      detail: {
        timePlayed: this.timePlayed,
        formattedTimePlayed: this.formattedTimePlayed,
        percentagePlayed: this.percentagePlayed
      }
    });
    this._node.dispatchEvent(timePlayed);
  }
};
(function () {
  function PitchShifter(context, buffer, bufferSize) {
    var _this4 = this;
    var onEnd = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : noop;
    _classCallCheck(this, PitchShifter);
    this._soundtouch = new SoundTouch();
    var source = new WebAudioBufferSource(buffer);
    this.timePlayed = 0;
    this.sourcePosition = 0;
    this._filter = new SimpleFilter(source, this._soundtouch, onEnd);
    this._node = getWebAudioNode(context, this._filter, function (sourcePostion) {
      return onUpdate.call(_this4, sourcePostion);
    }, bufferSize);
    this.tempo = 1;
    this.rate = 1;
    this.duration = buffer.duration;
    this.sampleRate = context.sampleRate;
    this.listeners = [];
  }
  _createClass(PitchShifter, [{
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
      return 100 * this._filter.sourcePosition / (this.duration * this.sampleRate);
    },
    set: function set(perc) {
      this._filter.sourcePosition = parseInt(perc * this.duration * this.sampleRate);
      this.sourcePosition = this._filter.sourcePosition;
      this.timePlayed = this.sourcePosition / this.sampleRate;
    }
  }, {
    key: "node",
    get: function get() {
      return this._node;
    }
  }, {
    key: "pitch",
    set: function set(pitch) {
      this._soundtouch.pitch = pitch;
    }
  }, {
    key: "pitchSemitones",
    set: function set(semitone) {
      this._soundtouch.pitchSemitones = semitone;
    }
  }, {
    key: "rate",
    set: function set(rate) {
      this._soundtouch.rate = rate;
    }
  }, {
    key: "tempo",
    set: function set(tempo) {
      this._soundtouch.tempo = tempo;
    }
  }, {
    key: "connect",
    value: function connect(toNode) {
      this._node.connect(toNode);
    }
  }, {
    key: "disconnect",
    value: function disconnect() {
      this._node.disconnect();
    }
  }, {
    key: "on",
    value: function on(eventName, cb) {
      this.listeners.push({
        name: eventName,
        cb: cb
      });
      this._node.addEventListener(eventName, function (event) {
        return cb(event.detail);
      });
    }
  }, {
    key: "off",
    value: function off() {
      var _this5 = this;
      var eventName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var listeners = this.listeners;
      if (eventName) {
        listeners = listeners.filter(function (e) {
          return e.name === eventName;
        });
      }
      listeners.forEach(function (e) {
        _this5._node.removeEventListener(e.name, function (event) {
          return e.cb(event.detail);
        });
      });
    }
  }]);
  return PitchShifter;
})();

var ProcessAudioBufferSource = function () {
  function ProcessAudioBufferSource(bufferProps, leftChannel, rightChannel) {
    _classCallCheck(this, ProcessAudioBufferSource);
    Object.assign(this, bufferProps);
    this.leftChannel = leftChannel;
    this.rightChannel = rightChannel;
    this._position = 0;
  }
  _createClass(ProcessAudioBufferSource, [{
    key: "position",
    get: function get() {
      return this._position;
    },
    set: function set(value) {
      this._position = value;
    }
  }, {
    key: "extract",
    value: function extract(target) {
      var numFrames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      this.position = position;
      var i = 0;
      for (; i < numFrames; i++) {
        target[i * 2] = this.leftChannel[i + position];
        target[i * 2 + 1] = this.rightChannel[i + position];
      }
      return numFrames;
    }
  }]);
  return ProcessAudioBufferSource;
}();

var SoundTouchWorklet = function (_AudioWorkletProcesso) {
  _inherits(SoundTouchWorklet, _AudioWorkletProcesso);
  var _super = _createSuper(SoundTouchWorklet);
  function SoundTouchWorklet(nodeOptions) {
    var _this;
    _classCallCheck(this, SoundTouchWorklet);
    _this = _super.call(this);
    _this._initialized = false;
    _this.bufferSize = 128;
    _this.port.onmessage = _this._messageProcessor.bind(_assertThisInitialized(_this));
    _this.port.postMessage({
      message: 'PROCESSOR_CONSTRUCTOR',
      detail: nodeOptions
    });
    return _this;
  }
  _createClass(SoundTouchWorklet, [{
    key: "_messageProcessor",
    value: function _messageProcessor(eventFromWorker) {
      var _eventFromWorker$data = eventFromWorker.data,
          message = _eventFromWorker$data.message,
          detail = _eventFromWorker$data.detail;
      if (message === 'INITIALIZE_PROCESSOR') {
        var _detail = _slicedToArray(detail, 3),
            bufferProps = _detail[0],
            leftChannel = _detail[1],
            rightChannel = _detail[2];
        this.bufferSource = new ProcessAudioBufferSource(bufferProps, leftChannel, rightChannel);
        this._samples = new Float32Array(this.bufferSize * 2);
        this._pipe = new SoundTouch();
        this._filter = new SimpleFilter(this.bufferSource, this._pipe);
        this.port.postMessage({
          message: 'PROCESSOR_READY'
        });
        this._initialized = true;
        return true;
      }
      if (message === 'SET_PIPE_PROP' && detail) {
        var name = detail.name,
            value = detail.value;
        this._pipe[name] = value;
        this.port.postMessage({
          message: 'PIPE_PROP_CHANGED',
          detail: "Updated ".concat(name, " to ").concat(this._pipe[name], "\ntypeof ").concat(_typeof(value))
        });
        return;
      }
      if (message === 'SET_FILTER_PROP' && detail) {
        var _name = detail.name,
            _value = detail.value;
        this._filter[_name] = _value;
        this.port.postMessage({
          message: 'FILTER_PROP_CHANGED',
          detail: "Updated ".concat(_name, " to ").concat(this._filter[_name], "\ntypeof ").concat(_typeof(_value))
        });
        return;
      }
      console.log('[PitchShifterWorkletProcessor] Unknown message: ', eventFromWorker);
    }
  }, {
    key: "_sendMessage",
    value: function _sendMessage(message) {
      var detail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      if (!message) {
        return;
      }
      this.port.postMessage({
        message: message,
        detail: detail
      });
    }
  }, {
    key: "process",
    value: function process(inputs, outputs) {
      if (!this._initialized || !inputs[0].length) {
        return true;
      }
      var left = outputs[0][0];
      var right = outputs[0].length > 1 ? outputs[0][1] : outputs[0][0];
      var samples = this._samples;
      if (!left || left && !left.length) {
        return false;
      }
      var framesExtracted = this._filter.extract(samples, inputs[0][0].length);
      if (isNaN(samples[0]) || !framesExtracted) {
        this._sendMessage('PROCESSOR_END');
        return false;
      }
      this._sendMessage('SOURCEPOSITION', this._filter.sourcePosition);
      var i = 0;
      for (; i < framesExtracted; i = i + 1) {
        left[i] = samples[i * 2];
        right[i] = samples[i * 2 + 1];
        if (isNaN(left[i]) || isNaN(right[i])) {
          left[i] = 0;
          right[i] = 0;
        }
      }
      return true;
    }
  }]);
  return SoundTouchWorklet;
}( _wrapNativeSuper(AudioWorkletProcessor));
registerProcessor('soundtouch-worklet', SoundTouchWorklet);
