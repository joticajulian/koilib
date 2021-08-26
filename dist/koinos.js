/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 820:
/***/ ((module) => {

"use strict";

// base-x encoding / decoding
// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
function base (ALPHABET) {
  if (ALPHABET.length >= 255) { throw new TypeError('Alphabet too long') }
  var BASE_MAP = new Uint8Array(256)
  for (var j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255
  }
  for (var i = 0; i < ALPHABET.length; i++) {
    var x = ALPHABET.charAt(i)
    var xc = x.charCodeAt(0)
    if (BASE_MAP[xc] !== 255) { throw new TypeError(x + ' is ambiguous') }
    BASE_MAP[xc] = i
  }
  var BASE = ALPHABET.length
  var LEADER = ALPHABET.charAt(0)
  var FACTOR = Math.log(BASE) / Math.log(256) // log(BASE) / log(256), rounded up
  var iFACTOR = Math.log(256) / Math.log(BASE) // log(256) / log(BASE), rounded up
  function encode (source) {
    if (source instanceof Uint8Array) {
    } else if (ArrayBuffer.isView(source)) {
      source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
    } else if (Array.isArray(source)) {
      source = Uint8Array.from(source)
    }
    if (!(source instanceof Uint8Array)) { throw new TypeError('Expected Uint8Array') }
    if (source.length === 0) { return '' }
        // Skip & count leading zeroes.
    var zeroes = 0
    var length = 0
    var pbegin = 0
    var pend = source.length
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++
      zeroes++
    }
        // Allocate enough space in big-endian base58 representation.
    var size = ((pend - pbegin) * iFACTOR + 1) >>> 0
    var b58 = new Uint8Array(size)
        // Process the bytes.
    while (pbegin !== pend) {
      var carry = source[pbegin]
            // Apply "b58 = b58 * 256 + ch".
      var i = 0
      for (var it1 = size - 1; (carry !== 0 || i < length) && (it1 !== -1); it1--, i++) {
        carry += (256 * b58[it1]) >>> 0
        b58[it1] = (carry % BASE) >>> 0
        carry = (carry / BASE) >>> 0
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i
      pbegin++
    }
        // Skip leading zeroes in base58 result.
    var it2 = size - length
    while (it2 !== size && b58[it2] === 0) {
      it2++
    }
        // Translate the result into a string.
    var str = LEADER.repeat(zeroes)
    for (; it2 < size; ++it2) { str += ALPHABET.charAt(b58[it2]) }
    return str
  }
  function decodeUnsafe (source) {
    if (typeof source !== 'string') { throw new TypeError('Expected String') }
    if (source.length === 0) { return new Uint8Array() }
    var psz = 0
        // Skip leading spaces.
    if (source[psz] === ' ') { return }
        // Skip and count leading '1's.
    var zeroes = 0
    var length = 0
    while (source[psz] === LEADER) {
      zeroes++
      psz++
    }
        // Allocate enough space in big-endian base256 representation.
    var size = (((source.length - psz) * FACTOR) + 1) >>> 0 // log(58) / log(256), rounded up.
    var b256 = new Uint8Array(size)
        // Process the characters.
    while (source[psz]) {
            // Decode character
      var carry = BASE_MAP[source.charCodeAt(psz)]
            // Invalid character
      if (carry === 255) { return }
      var i = 0
      for (var it3 = size - 1; (carry !== 0 || i < length) && (it3 !== -1); it3--, i++) {
        carry += (BASE * b256[it3]) >>> 0
        b256[it3] = (carry % 256) >>> 0
        carry = (carry / 256) >>> 0
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i
      psz++
    }
        // Skip trailing spaces.
    if (source[psz] === ' ') { return }
        // Skip leading zeroes in b256.
    var it4 = size - length
    while (it4 !== size && b256[it4] === 0) {
      it4++
    }
    var vch = new Uint8Array(zeroes + (size - it4))
    var j = zeroes
    while (it4 !== size) {
      vch[j++] = b256[it4++]
    }
    return vch
  }
  function decode (string) {
    var buffer = decodeUnsafe(string)
    if (buffer) { return buffer }
    throw new Error('Non-base' + BASE + ' character')
  }
  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  }
}
module.exports = base


/***/ }),

/***/ 669:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(609);

/***/ }),

/***/ 448:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);
var settle = __webpack_require__(26);
var cookies = __webpack_require__(372);
var buildURL = __webpack_require__(327);
var buildFullPath = __webpack_require__(97);
var parseHeaders = __webpack_require__(109);
var isURLSameOrigin = __webpack_require__(985);
var createError = __webpack_require__(61);

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    // Listen for ready state
    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};


/***/ }),

/***/ 609:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);
var bind = __webpack_require__(849);
var Axios = __webpack_require__(321);
var mergeConfig = __webpack_require__(185);
var defaults = __webpack_require__(655);

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = __webpack_require__(263);
axios.CancelToken = __webpack_require__(972);
axios.isCancel = __webpack_require__(502);

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = __webpack_require__(713);

// Expose isAxiosError
axios.isAxiosError = __webpack_require__(268);

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;


/***/ }),

/***/ 263:
/***/ ((module) => {

"use strict";


/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;


/***/ }),

/***/ 972:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var Cancel = __webpack_require__(263);

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;


/***/ }),

/***/ 502:
/***/ ((module) => {

"use strict";


module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};


/***/ }),

/***/ 321:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);
var buildURL = __webpack_require__(327);
var InterceptorManager = __webpack_require__(782);
var dispatchRequest = __webpack_require__(572);
var mergeConfig = __webpack_require__(185);

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;


/***/ }),

/***/ 782:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;


/***/ }),

/***/ 97:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isAbsoluteURL = __webpack_require__(793);
var combineURLs = __webpack_require__(303);

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};


/***/ }),

/***/ 61:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var enhanceError = __webpack_require__(481);

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};


/***/ }),

/***/ 572:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);
var transformData = __webpack_require__(527);
var isCancel = __webpack_require__(502);
var defaults = __webpack_require__(655);

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};


/***/ }),

/***/ 481:
/***/ ((module) => {

"use strict";


/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };
  return error;
};


/***/ }),

/***/ 185:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  var valueFromConfig2Keys = ['url', 'method', 'data'];
  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
  var defaultToConfig2Keys = [
    'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
    'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
    'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
  ];
  var directMergeKeys = ['validateStatus'];

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  }

  utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    }
  });

  utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

  utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });

  utils.forEach(directMergeKeys, function merge(prop) {
    if (prop in config2) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });

  var axiosKeys = valueFromConfig2Keys
    .concat(mergeDeepPropertiesKeys)
    .concat(defaultToConfig2Keys)
    .concat(directMergeKeys);

  var otherKeys = Object
    .keys(config1)
    .concat(Object.keys(config2))
    .filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1;
    });

  utils.forEach(otherKeys, mergeDeepProperties);

  return config;
};


/***/ }),

/***/ 26:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var createError = __webpack_require__(61);

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};


/***/ }),

/***/ 527:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};


/***/ }),

/***/ 655:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);
var normalizeHeaderName = __webpack_require__(16);

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = __webpack_require__(448);
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = __webpack_require__(448);
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;


/***/ }),

/***/ 849:
/***/ ((module) => {

"use strict";


module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};


/***/ }),

/***/ 327:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};


/***/ }),

/***/ 303:
/***/ ((module) => {

"use strict";


/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};


/***/ }),

/***/ 372:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);


/***/ }),

/***/ 793:
/***/ ((module) => {

"use strict";


/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};


/***/ }),

/***/ 268:
/***/ ((module) => {

"use strict";


/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return (typeof payload === 'object') && (payload.isAxiosError === true);
};


/***/ }),

/***/ 985:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);


/***/ }),

/***/ 16:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};


/***/ }),

/***/ 109:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(867);

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};


/***/ }),

/***/ 713:
/***/ ((module) => {

"use strict";


/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};


/***/ }),

/***/ 867:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(849);

/*global toString:true*/

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (toString.call(val) !== '[object Object]') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM
};


/***/ }),

/***/ 23:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 0.9.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
  'use strict';

  var ERROR = 'input is invalid type';
  var WINDOW = typeof window === 'object';
  var root = WINDOW ? window : {};
  if (root.JS_SHA256_NO_WINDOW) {
    WINDOW = false;
  }
  var WEB_WORKER = !WINDOW && typeof self === 'object';
  var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = __webpack_require__.g;
  } else if (WEB_WORKER) {
    root = self;
  }
  var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && "object" === 'object' && module.exports;
  var AMD =  true && __webpack_require__.amdO;
  var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];

  var blocks = [];

  if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
    Array.isArray = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
  }

  if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
    ArrayBuffer.isView = function (obj) {
      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
    };
  }

  var createOutputMethod = function (outputType, is224) {
    return function (message) {
      return new Sha256(is224, true).update(message)[outputType]();
    };
  };

  var createMethod = function (is224) {
    var method = createOutputMethod('hex', is224);
    if (NODE_JS) {
      method = nodeWrap(method, is224);
    }
    method.create = function () {
      return new Sha256(is224);
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type, is224);
    }
    return method;
  };

  var nodeWrap = function (method, is224) {
    var crypto = eval("require('crypto')");
    var Buffer = eval("require('buffer').Buffer");
    var algorithm = is224 ? 'sha224' : 'sha256';
    var nodeMethod = function (message) {
      if (typeof message === 'string') {
        return crypto.createHash(algorithm).update(message, 'utf8').digest('hex');
      } else {
        if (message === null || message === undefined) {
          throw new Error(ERROR);
        } else if (message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        }
      }
      if (Array.isArray(message) || ArrayBuffer.isView(message) ||
        message.constructor === Buffer) {
        return crypto.createHash(algorithm).update(new Buffer(message)).digest('hex');
      } else {
        return method(message);
      }
    };
    return nodeMethod;
  };

  var createHmacOutputMethod = function (outputType, is224) {
    return function (key, message) {
      return new HmacSha256(key, is224, true).update(message)[outputType]();
    };
  };

  var createHmacMethod = function (is224) {
    var method = createHmacOutputMethod('hex', is224);
    method.create = function (key) {
      return new HmacSha256(key, is224);
    };
    method.update = function (key, message) {
      return method.create(key).update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createHmacOutputMethod(type, is224);
    }
    return method;
  };

  function Sha256(is224, sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
    } else {
      this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    if (is224) {
      this.h0 = 0xc1059ed8;
      this.h1 = 0x367cd507;
      this.h2 = 0x3070dd17;
      this.h3 = 0xf70e5939;
      this.h4 = 0xffc00b31;
      this.h5 = 0x68581511;
      this.h6 = 0x64f98fa7;
      this.h7 = 0xbefa4fa4;
    } else { // 256
      this.h0 = 0x6a09e667;
      this.h1 = 0xbb67ae85;
      this.h2 = 0x3c6ef372;
      this.h3 = 0xa54ff53a;
      this.h4 = 0x510e527f;
      this.h5 = 0x9b05688c;
      this.h6 = 0x1f83d9ab;
      this.h7 = 0x5be0cd19;
    }

    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
    this.is224 = is224;
  }

  Sha256.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }
    var notString, type = typeof message;
    if (type !== 'string') {
      if (type === 'object') {
        if (message === null) {
          throw new Error(ERROR);
        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        } else if (!Array.isArray(message)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
            throw new Error(ERROR);
          }
        }
      } else {
        throw new Error(ERROR);
      }
      notString = true;
    }
    var code, index = 0, i, length = message.length, blocks = this.blocks;

    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        blocks[16] = blocks[1] = blocks[2] = blocks[3] =
          blocks[4] = blocks[5] = blocks[6] = blocks[7] =
          blocks[8] = blocks[9] = blocks[10] = blocks[11] =
          blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }

      if (notString) {
        for (i = this.start; index < length && i < 64; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < 64; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          }
        }
      }

      this.lastByteIndex = i;
      this.bytes += i - this.start;
      if (i >= 64) {
        this.block = blocks[16];
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };

  Sha256.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks, i = this.lastByteIndex;
    blocks[16] = this.block;
    blocks[i >> 2] |= EXTRA[i & 3];
    this.block = blocks[16];
    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }
      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    blocks[15] = this.bytes << 3;
    this.hash();
  };

  Sha256.prototype.hash = function () {
    var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4, f = this.h5, g = this.h6,
      h = this.h7, blocks = this.blocks, j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;

    for (j = 16; j < 64; ++j) {
      // rightrotate
      t1 = blocks[j - 15];
      s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
      t1 = blocks[j - 2];
      s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
      blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
    }

    bc = b & c;
    for (j = 0; j < 64; j += 4) {
      if (this.first) {
        if (this.is224) {
          ab = 300032;
          t1 = blocks[0] - 1413257819;
          h = t1 - 150054599 << 0;
          d = t1 + 24177077 << 0;
        } else {
          ab = 704751109;
          t1 = blocks[0] - 210244248;
          h = t1 - 1521486534 << 0;
          d = t1 + 143694565 << 0;
        }
        this.first = false;
      } else {
        s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        ab = a & b;
        maj = ab ^ (a & c) ^ bc;
        ch = (e & f) ^ (~e & g);
        t1 = h + s1 + ch + K[j] + blocks[j];
        t2 = s0 + maj;
        h = d + t1 << 0;
        d = t1 + t2 << 0;
      }
      s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
      s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
      da = d & a;
      maj = da ^ (d & b) ^ ab;
      ch = (h & e) ^ (~h & f);
      t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
      t2 = s0 + maj;
      g = c + t1 << 0;
      c = t1 + t2 << 0;
      s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
      s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
      cd = c & d;
      maj = cd ^ (c & a) ^ da;
      ch = (g & h) ^ (~g & e);
      t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
      t2 = s0 + maj;
      f = b + t1 << 0;
      b = t1 + t2 << 0;
      s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
      s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
      bc = b & c;
      maj = bc ^ (b & d) ^ cd;
      ch = (f & g) ^ (~f & h);
      t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
      t2 = s0 + maj;
      e = a + t1 << 0;
      a = t1 + t2 << 0;
    }

    this.h0 = this.h0 + a << 0;
    this.h1 = this.h1 + b << 0;
    this.h2 = this.h2 + c << 0;
    this.h3 = this.h3 + d << 0;
    this.h4 = this.h4 + e << 0;
    this.h5 = this.h5 + f << 0;
    this.h6 = this.h6 + g << 0;
    this.h7 = this.h7 + h << 0;
  };

  Sha256.prototype.hex = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
      h6 = this.h6, h7 = this.h7;

    var hex = HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
      HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
      HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
      HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
      HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
      HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
      HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
      HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
      HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
      HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
      HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
      HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
      HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
      HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
      HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
      HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
      HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
      HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
      HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
      HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
      HEX_CHARS[(h5 >> 28) & 0x0F] + HEX_CHARS[(h5 >> 24) & 0x0F] +
      HEX_CHARS[(h5 >> 20) & 0x0F] + HEX_CHARS[(h5 >> 16) & 0x0F] +
      HEX_CHARS[(h5 >> 12) & 0x0F] + HEX_CHARS[(h5 >> 8) & 0x0F] +
      HEX_CHARS[(h5 >> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
      HEX_CHARS[(h6 >> 28) & 0x0F] + HEX_CHARS[(h6 >> 24) & 0x0F] +
      HEX_CHARS[(h6 >> 20) & 0x0F] + HEX_CHARS[(h6 >> 16) & 0x0F] +
      HEX_CHARS[(h6 >> 12) & 0x0F] + HEX_CHARS[(h6 >> 8) & 0x0F] +
      HEX_CHARS[(h6 >> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
    if (!this.is224) {
      hex += HEX_CHARS[(h7 >> 28) & 0x0F] + HEX_CHARS[(h7 >> 24) & 0x0F] +
        HEX_CHARS[(h7 >> 20) & 0x0F] + HEX_CHARS[(h7 >> 16) & 0x0F] +
        HEX_CHARS[(h7 >> 12) & 0x0F] + HEX_CHARS[(h7 >> 8) & 0x0F] +
        HEX_CHARS[(h7 >> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
    }
    return hex;
  };

  Sha256.prototype.toString = Sha256.prototype.hex;

  Sha256.prototype.digest = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
      h6 = this.h6, h7 = this.h7;

    var arr = [
      (h0 >> 24) & 0xFF, (h0 >> 16) & 0xFF, (h0 >> 8) & 0xFF, h0 & 0xFF,
      (h1 >> 24) & 0xFF, (h1 >> 16) & 0xFF, (h1 >> 8) & 0xFF, h1 & 0xFF,
      (h2 >> 24) & 0xFF, (h2 >> 16) & 0xFF, (h2 >> 8) & 0xFF, h2 & 0xFF,
      (h3 >> 24) & 0xFF, (h3 >> 16) & 0xFF, (h3 >> 8) & 0xFF, h3 & 0xFF,
      (h4 >> 24) & 0xFF, (h4 >> 16) & 0xFF, (h4 >> 8) & 0xFF, h4 & 0xFF,
      (h5 >> 24) & 0xFF, (h5 >> 16) & 0xFF, (h5 >> 8) & 0xFF, h5 & 0xFF,
      (h6 >> 24) & 0xFF, (h6 >> 16) & 0xFF, (h6 >> 8) & 0xFF, h6 & 0xFF
    ];
    if (!this.is224) {
      arr.push((h7 >> 24) & 0xFF, (h7 >> 16) & 0xFF, (h7 >> 8) & 0xFF, h7 & 0xFF);
    }
    return arr;
  };

  Sha256.prototype.array = Sha256.prototype.digest;

  Sha256.prototype.arrayBuffer = function () {
    this.finalize();

    var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
    var dataView = new DataView(buffer);
    dataView.setUint32(0, this.h0);
    dataView.setUint32(4, this.h1);
    dataView.setUint32(8, this.h2);
    dataView.setUint32(12, this.h3);
    dataView.setUint32(16, this.h4);
    dataView.setUint32(20, this.h5);
    dataView.setUint32(24, this.h6);
    if (!this.is224) {
      dataView.setUint32(28, this.h7);
    }
    return buffer;
  };

  function HmacSha256(key, is224, sharedMemory) {
    var i, type = typeof key;
    if (type === 'string') {
      var bytes = [], length = key.length, index = 0, code;
      for (i = 0; i < length; ++i) {
        code = key.charCodeAt(i);
        if (code < 0x80) {
          bytes[index++] = code;
        } else if (code < 0x800) {
          bytes[index++] = (0xc0 | (code >> 6));
          bytes[index++] = (0x80 | (code & 0x3f));
        } else if (code < 0xd800 || code >= 0xe000) {
          bytes[index++] = (0xe0 | (code >> 12));
          bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
          bytes[index++] = (0x80 | (code & 0x3f));
        } else {
          code = 0x10000 + (((code & 0x3ff) << 10) | (key.charCodeAt(++i) & 0x3ff));
          bytes[index++] = (0xf0 | (code >> 18));
          bytes[index++] = (0x80 | ((code >> 12) & 0x3f));
          bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
          bytes[index++] = (0x80 | (code & 0x3f));
        }
      }
      key = bytes;
    } else {
      if (type === 'object') {
        if (key === null) {
          throw new Error(ERROR);
        } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
          key = new Uint8Array(key);
        } else if (!Array.isArray(key)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
            throw new Error(ERROR);
          }
        }
      } else {
        throw new Error(ERROR);
      }
    }

    if (key.length > 64) {
      key = (new Sha256(is224, true)).update(key).array();
    }

    var oKeyPad = [], iKeyPad = [];
    for (i = 0; i < 64; ++i) {
      var b = key[i] || 0;
      oKeyPad[i] = 0x5c ^ b;
      iKeyPad[i] = 0x36 ^ b;
    }

    Sha256.call(this, is224, sharedMemory);

    this.update(iKeyPad);
    this.oKeyPad = oKeyPad;
    this.inner = true;
    this.sharedMemory = sharedMemory;
  }
  HmacSha256.prototype = new Sha256();

  HmacSha256.prototype.finalize = function () {
    Sha256.prototype.finalize.call(this);
    if (this.inner) {
      this.inner = false;
      var innerHash = this.array();
      Sha256.call(this, this.is224, this.sharedMemory);
      this.update(this.oKeyPad);
      this.update(innerHash);
      Sha256.prototype.finalize.call(this);
    }
  };

  var exports = createMethod();
  exports.sha256 = exports;
  exports.sha224 = createMethod(true);
  exports.sha256.hmac = createHmacMethod();
  exports.sha224.hmac = createHmacMethod(true);

  if (COMMON_JS) {
    module.exports = exports;
  } else {
    root.sha256 = exports.sha256;
    root.sha224 = exports.sha224;
    if (AMD) {
      !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
        return exports;
      }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    }
  }
})();


/***/ }),

/***/ 556:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { encodeText } = __webpack_require__(413)

/** @typedef {import('./types').CodecFactory} CodecFactory */
/** @typedef {import("./types").BaseName} BaseName */
/** @typedef {import("./types").BaseCode} BaseCode */

/**
 * Class to encode/decode in the supported Bases
 *
 */
class Base {
  /**
   * @param {BaseName} name
   * @param {BaseCode} code
   * @param {CodecFactory} factory
   * @param {string} alphabet
   */
  constructor (name, code, factory, alphabet) {
    this.name = name
    this.code = code
    this.codeBuf = encodeText(this.code)
    this.alphabet = alphabet
    this.codec = factory(alphabet)
  }

  /**
   * @param {Uint8Array} buf
   * @returns {string}
   */
  encode (buf) {
    return this.codec.encode(buf)
  }

  /**
   * @param {string} string
   * @returns {Uint8Array}
   */
  decode (string) {
    for (const char of string) {
      if (this.alphabet && this.alphabet.indexOf(char) < 0) {
        throw new Error(`invalid character '${char}' in '${string}'`)
      }
    }
    return this.codec.decode(string)
  }
}

module.exports = Base


/***/ }),

/***/ 77:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const baseX = __webpack_require__(820)
const Base = __webpack_require__(556)
const { rfc4648 } = __webpack_require__(727)
const { decodeText, encodeText } = __webpack_require__(413)

/** @typedef {import('./types').CodecFactory} CodecFactory */
/** @typedef {import('./types').Codec} Codec */
/** @typedef {import('./types').BaseName} BaseName */
/** @typedef {import('./types').BaseCode} BaseCode */

/** @type {CodecFactory} */
const identity = () => {
  return {
    encode: decodeText,
    decode: encodeText
  }
}

/**
 *
 * name, code, implementation, alphabet
 *
 * @type {Array<[BaseName, BaseCode, CodecFactory, string]>}
 */
const constants = [
  ['identity', '\x00', identity, ''],
  ['base2', '0', rfc4648(1), '01'],
  ['base8', '7', rfc4648(3), '01234567'],
  ['base10', '9', baseX, '0123456789'],
  ['base16', 'f', rfc4648(4), '0123456789abcdef'],
  ['base16upper', 'F', rfc4648(4), '0123456789ABCDEF'],
  ['base32hex', 'v', rfc4648(5), '0123456789abcdefghijklmnopqrstuv'],
  ['base32hexupper', 'V', rfc4648(5), '0123456789ABCDEFGHIJKLMNOPQRSTUV'],
  ['base32hexpad', 't', rfc4648(5), '0123456789abcdefghijklmnopqrstuv='],
  ['base32hexpadupper', 'T', rfc4648(5), '0123456789ABCDEFGHIJKLMNOPQRSTUV='],
  ['base32', 'b', rfc4648(5), 'abcdefghijklmnopqrstuvwxyz234567'],
  ['base32upper', 'B', rfc4648(5), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'],
  ['base32pad', 'c', rfc4648(5), 'abcdefghijklmnopqrstuvwxyz234567='],
  ['base32padupper', 'C', rfc4648(5), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567='],
  ['base32z', 'h', rfc4648(5), 'ybndrfg8ejkmcpqxot1uwisza345h769'],
  ['base36', 'k', baseX, '0123456789abcdefghijklmnopqrstuvwxyz'],
  ['base36upper', 'K', baseX, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  ['base58btc', 'z', baseX, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'],
  ['base58flickr', 'Z', baseX, '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'],
  ['base64', 'm', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'],
  ['base64pad', 'M', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='],
  ['base64url', 'u', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'],
  ['base64urlpad', 'U', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=']
]

/** @type {Record<BaseName,Base>} */
const names = constants.reduce((prev, tupple) => {
  prev[tupple[0]] = new Base(tupple[0], tupple[1], tupple[2], tupple[3])
  return prev
}, /** @type {Record<BaseName,Base>} */({}))

/** @type {Record<BaseCode,Base>} */
const codes = constants.reduce((prev, tupple) => {
  prev[tupple[1]] = names[tupple[0]]
  return prev
}, /** @type {Record<BaseCode,Base>} */({}))

module.exports = {
  names,
  codes
}


/***/ }),

/***/ 957:
/***/ ((module, exports, __webpack_require__) => {

"use strict";
/**
 * Implementation of the [multibase](https://github.com/multiformats/multibase) specification.
 *
 */


const constants = __webpack_require__(77)
const { encodeText, decodeText, concat } = __webpack_require__(413)

/** @typedef {import('./base')} Base */
/** @typedef {import("./types").BaseNameOrCode} BaseNameOrCode */
/** @typedef {import("./types").BaseCode} BaseCode */
/** @typedef {import("./types").BaseName} BaseName */

/**
 * Create a new Uint8Array with the multibase varint+code.
 *
 * @param {BaseNameOrCode} nameOrCode - The multibase name or code number.
 * @param {Uint8Array} buf - The data to be prefixed with multibase.
 * @returns {Uint8Array}
 * @throws {Error} Will throw if the encoding is not supported
 */
function multibase (nameOrCode, buf) {
  if (!buf) {
    throw new Error('requires an encoded Uint8Array')
  }
  const { name, codeBuf } = encoding(nameOrCode)
  validEncode(name, buf)

  return concat([codeBuf, buf], codeBuf.length + buf.length)
}

/**
 * Encode data with the specified base and add the multibase prefix.
 *
 * @param {BaseNameOrCode} nameOrCode - The multibase name or code number.
 * @param {Uint8Array} buf - The data to be encoded.
 * @returns {Uint8Array}
 * @throws {Error} Will throw if the encoding is not supported
 *
 */
function encode (nameOrCode, buf) {
  const enc = encoding(nameOrCode)
  const data = encodeText(enc.encode(buf))

  return concat([enc.codeBuf, data], enc.codeBuf.length + data.length)
}

/**
 * Takes a Uint8Array or string encoded with multibase header, decodes it and
 * returns the decoded buffer
 *
 * @param {Uint8Array|string} data
 * @returns {Uint8Array}
 * @throws {Error} Will throw if the encoding is not supported
 *
 */
function decode (data) {
  if (data instanceof Uint8Array) {
    data = decodeText(data)
  }
  const prefix = data[0]

  // Make all encodings case-insensitive except the ones that include upper and lower chars in the alphabet
  if (['f', 'F', 'v', 'V', 't', 'T', 'b', 'B', 'c', 'C', 'h', 'k', 'K'].includes(prefix)) {
    data = data.toLowerCase()
  }
  const enc = encoding(/** @type {BaseCode} */(data[0]))
  return enc.decode(data.substring(1))
}

/**
 * Is the given data multibase encoded?
 *
 * @param {Uint8Array|string} data
 */
function isEncoded (data) {
  if (data instanceof Uint8Array) {
    data = decodeText(data)
  }

  // Ensure bufOrString is a string
  if (Object.prototype.toString.call(data) !== '[object String]') {
    return false
  }

  try {
    const enc = encoding(/** @type {BaseCode} */(data[0]))
    return enc.name
  } catch (err) {
    return false
  }
}

/**
 * Validate encoded data
 *
 * @param {BaseNameOrCode} name
 * @param {Uint8Array} buf
 * @returns {void}
 * @throws {Error} Will throw if the encoding is not supported
 */
function validEncode (name, buf) {
  const enc = encoding(name)
  enc.decode(decodeText(buf))
}

/**
 * Get the encoding by name or code
 *
 * @param {BaseNameOrCode} nameOrCode
 * @returns {Base}
 * @throws {Error} Will throw if the encoding is not supported
 */
function encoding (nameOrCode) {
  if (Object.prototype.hasOwnProperty.call(constants.names, /** @type {BaseName} */(nameOrCode))) {
    return constants.names[/** @type {BaseName} */(nameOrCode)]
  } else if (Object.prototype.hasOwnProperty.call(constants.codes, /** @type {BaseCode} */(nameOrCode))) {
    return constants.codes[/** @type {BaseCode} */(nameOrCode)]
  } else {
    throw new Error(`Unsupported encoding: ${nameOrCode}`)
  }
}

/**
 * Get encoding from data
 *
 * @param {string|Uint8Array} data
 * @returns {Base}
 * @throws {Error} Will throw if the encoding is not supported
 */
function encodingFromData (data) {
  if (data instanceof Uint8Array) {
    data = decodeText(data)
  }

  return encoding(/** @type {BaseCode} */(data[0]))
}

exports = module.exports = multibase
exports.encode = encode
exports.decode = decode
exports.isEncoded = isEncoded
exports.encoding = encoding
exports.encodingFromData = encodingFromData
const names = Object.freeze(constants.names)
const codes = Object.freeze(constants.codes)
exports.names = names
exports.codes = codes


/***/ }),

/***/ 727:
/***/ ((module) => {

"use strict";


/** @typedef {import('./types').CodecFactory} CodecFactory */

/**
 * @param {string} string
 * @param {string} alphabet
 * @param {number} bitsPerChar
 * @returns {Uint8Array}
 */
const decode = (string, alphabet, bitsPerChar) => {
  // Build the character lookup table:
  /** @type {Record<string, number>} */
  const codes = {}
  for (let i = 0; i < alphabet.length; ++i) {
    codes[alphabet[i]] = i
  }

  // Count the padding bytes:
  let end = string.length
  while (string[end - 1] === '=') {
    --end
  }

  // Allocate the output:
  const out = new Uint8Array((end * bitsPerChar / 8) | 0)

  // Parse the data:
  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  let written = 0 // Next byte to write
  for (let i = 0; i < end; ++i) {
    // Read one character from the string:
    const value = codes[string[i]]
    if (value === undefined) {
      throw new SyntaxError('Invalid character ' + string[i])
    }

    // Append the bits to the buffer:
    buffer = (buffer << bitsPerChar) | value
    bits += bitsPerChar

    // Write out some bits if the buffer has a byte's worth:
    if (bits >= 8) {
      bits -= 8
      out[written++] = 0xff & (buffer >> bits)
    }
  }

  // Verify that we have received just enough bits:
  if (bits >= bitsPerChar || 0xff & (buffer << (8 - bits))) {
    throw new SyntaxError('Unexpected end of data')
  }

  return out
}

/**
 * @param {Uint8Array} data
 * @param {string} alphabet
 * @param {number} bitsPerChar
 * @returns {string}
 */
const encode = (data, alphabet, bitsPerChar) => {
  const pad = alphabet[alphabet.length - 1] === '='
  const mask = (1 << bitsPerChar) - 1
  let out = ''

  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  for (let i = 0; i < data.length; ++i) {
    // Slurp data into the buffer:
    buffer = (buffer << 8) | data[i]
    bits += 8

    // Write out as much as we can:
    while (bits > bitsPerChar) {
      bits -= bitsPerChar
      out += alphabet[mask & (buffer >> bits)]
    }
  }

  // Partial character:
  if (bits) {
    out += alphabet[mask & (buffer << (bitsPerChar - bits))]
  }

  // Add padding characters until we hit a byte boundary:
  if (pad) {
    while ((out.length * bitsPerChar) & 7) {
      out += '='
    }
  }

  return out
}

/**
 * RFC4648 Factory
 *
 * @param {number} bitsPerChar
 * @returns {CodecFactory}
 */
const rfc4648 = (bitsPerChar) => (alphabet) => {
  return {
    /**
     * @param {Uint8Array} input
     * @returns {string}
     */
    encode (input) {
      return encode(input, alphabet, bitsPerChar)
    },
    /**
     * @param {string} input
     * @returns {Uint8Array}
     */
    decode (input) {
      return decode(input, alphabet, bitsPerChar)
    }
  }
}

module.exports = { rfc4648 }


/***/ }),

/***/ 413:
/***/ ((module) => {

"use strict";


const textDecoder = new TextDecoder()
/**
 * @param {ArrayBufferView|ArrayBuffer} bytes
 * @returns {string}
 */
const decodeText = (bytes) => textDecoder.decode(bytes)

const textEncoder = new TextEncoder()
/**
 * @param {string} text
 * @returns {Uint8Array}
 */
const encodeText = (text) => textEncoder.encode(text)

/**
 * Returns a new Uint8Array created by concatenating the passed Arrays
 *
 * @param {Array<ArrayLike<number>>} arrs
 * @param {number} length
 * @returns {Uint8Array}
 */
function concat (arrs, length) {
  const output = new Uint8Array(length)
  let offset = 0

  for (const arr of arrs) {
    output.set(arr, offset)
    offset += arr.length
  }

  return output
}

module.exports = { decodeText, encodeText, concat }


/***/ }),

/***/ 389:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/*! noble-ripemd160 - MIT License (c) Paul Miller (paulmillr.com) */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RIPEMD160 = void 0;
const rl = Uint8Array.from([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
    3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
    1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
    4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
]);
const rr = Uint8Array.from([
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
    6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
    15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
    8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
    12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
]);
const sl = Uint8Array.from([
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
    7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
    11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
    11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
    9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
]);
const sr = Uint8Array.from([
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
    9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
    9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
    15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
    8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
]);
const Kl = Uint32Array.from([0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]);
const Kr = Uint32Array.from([0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]);
function rotl(x, n) {
    return (x << n) | (x >>> (32 - n));
}
function f(group, x, y, z) {
    if (group === 0)
        return x ^ y ^ z;
    else if (group === 1)
        return (x & y) | (~x & z);
    else if (group === 2)
        return (x | ~y) ^ z;
    else if (group === 3)
        return (x & z) | (y & ~z);
    else
        return x ^ (y | ~z);
}
class RIPEMD160 {
    h0 = 0x67452301 | 0;
    h1 = 0xefcdab89 | 0;
    h2 = 0x98badcfe | 0;
    h3 = 0x10325476 | 0;
    h4 = 0xc3d2e1f0 | 0;
    block = new Uint8Array(64);
    blockSize = 64;
    offset = 0;
    length = new Uint32Array(4);
    finalized = false;
    view;
    constructor() {
        this.view = new DataView(this.block.buffer);
    }
    update(data) {
        if (this.finalized)
            throw new Error('Digest already called');
        const block = this.block;
        let offset = 0;
        while (this.offset + data.length - offset >= this.blockSize) {
            for (let i = this.offset; i < this.blockSize;)
                block[i++] = data[offset++];
            this.compress();
            this.offset = 0;
        }
        while (offset < data.length)
            block[this.offset++] = data[offset++];
        for (let j = 0, carry = data.length * 8; carry > 0; j++) {
            let len = this.length[j];
            len += carry;
            carry = (len / 0x0100000000) | 0;
            if (carry > 0)
                len -= 0x0100000000 * carry;
            this.length[j] = len;
        }
        return this;
    }
    compress() {
        const wordBlocks = new Uint32Array(16);
        for (let i = 0; i < 16; i++) {
            wordBlocks[i] = this.view.getInt32(i * 4, true);
        }
        let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
        for (let group = 0; group < 5; group++) {
            const rGroup = 4 - group;
            const hbl = Kl[group];
            const hbr = Kr[group];
            for (let i = 0; i < 16; i++) {
                const j = 16 * group + i;
                const tl = (rotl(al + f(group, bl, cl, dl) + wordBlocks[rl[j]] + hbl, sl[j]) + el) | 0;
                al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
            }
            for (let i = 0; i < 16; i++) {
                const j = 16 * group + i;
                const tr = (rotl(ar + f(rGroup, br, cr, dr) + wordBlocks[rr[j]] + hbr, sr[j]) + er) | 0;
                ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr;
            }
        }
        const t = (this.h1 + cl + dr) | 0;
        this.h1 = (this.h2 + dl + er) | 0;
        this.h2 = (this.h3 + el + ar) | 0;
        this.h3 = (this.h4 + al + br) | 0;
        this.h4 = (this.h0 + bl + cr) | 0;
        this.h0 = t;
    }
    digest() {
        if (this.finalized)
            throw new Error('Digest already called');
        this.finalized = true;
        this.block[this.offset++] = 0x80;
        if (this.offset > 56) {
            this.block.fill(0, this.offset, 64);
            this.compress();
            this.offset = 0;
        }
        this.block.fill(0, this.offset, 56);
        this.view.setUint32(56, this.length[0], true);
        this.view.setUint32(60, this.length[1], true);
        this.compress();
        const res = new DataView(new ArrayBuffer(20));
        res.setInt32(0, this.h0, true);
        res.setInt32(4, this.h1, true);
        res.setInt32(8, this.h2, true);
        res.setInt32(12, this.h3, true);
        res.setInt32(16, this.h4, true);
        this.block.fill(0);
        this.offset = 0;
        for (let i = 0; i < 4; i++) {
            this.length[i] = 0;
        }
        return new Uint8Array(res.buffer);
    }
}
exports.RIPEMD160 = RIPEMD160;
function toHex(uint8a) {
    return Array.from(uint8a)
        .map((c) => c.toString(16).padStart(2, '0'))
        .join('');
}
function utf8ToBytes(str) {
    return new TextEncoder().encode(str);
}
function ripemd160(message) {
    const hasher = new RIPEMD160();
    hasher.update(message instanceof Uint8Array ? message : utf8ToBytes(message));
    const hash = hasher.digest();
    return typeof message === 'string' ? toHex(hash) : hash;
}
exports.default = ripemd160;


/***/ }),

/***/ 795:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/*! noble-secp256k1 - MIT License (c) Paul Miller (paulmillr.com) */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.utils = exports.schnorr = exports.verify = exports._syncSign = exports.sign = exports.getSharedSecret = exports.recoverPublicKey = exports.getPublicKey = exports.SignResult = exports.Signature = exports.Point = exports.CURVE = void 0;
const CURVE = {
    a: 0n,
    b: 7n,
    P: 2n ** 256n - 2n ** 32n - 977n,
    n: 2n ** 256n - 432420386565659656852420866394968145599n,
    h: 1n,
    Gx: 55066263022277343669578718895168534326250603453777594175500187360389116729240n,
    Gy: 32670510020758816978083085130507043184471273380659243275938904335757337482424n,
    beta: 0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501een,
};
exports.CURVE = CURVE;
function weistrass(x) {
    const { a, b } = CURVE;
    return mod(x ** 3n + a * x + b);
}
const USE_ENDOMORPHISM = CURVE.a === 0n;
class JacobianPoint {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static fromAffine(p) {
        if (!(p instanceof Point)) {
            throw new TypeError('JacobianPoint#fromAffine: expected Point');
        }
        return new JacobianPoint(p.x, p.y, 1n);
    }
    static toAffineBatch(points) {
        const toInv = invertBatch(points.map((p) => p.z));
        return points.map((p, i) => p.toAffine(toInv[i]));
    }
    static normalizeZ(points) {
        return JacobianPoint.toAffineBatch(points).map(JacobianPoint.fromAffine);
    }
    equals(other) {
        const a = this;
        const b = other;
        const az2 = mod(a.z * a.z);
        const az3 = mod(a.z * az2);
        const bz2 = mod(b.z * b.z);
        const bz3 = mod(b.z * bz2);
        return mod(a.x * bz2) === mod(az2 * b.x) && mod(a.y * bz3) === mod(az3 * b.y);
    }
    negate() {
        return new JacobianPoint(this.x, mod(-this.y), this.z);
    }
    double() {
        const X1 = this.x;
        const Y1 = this.y;
        const Z1 = this.z;
        const A = mod(X1 ** 2n);
        const B = mod(Y1 ** 2n);
        const C = mod(B ** 2n);
        const D = mod(2n * (mod(mod((X1 + B) ** 2n)) - A - C));
        const E = mod(3n * A);
        const F = mod(E ** 2n);
        const X3 = mod(F - 2n * D);
        const Y3 = mod(E * (D - X3) - 8n * C);
        const Z3 = mod(2n * Y1 * Z1);
        return new JacobianPoint(X3, Y3, Z3);
    }
    add(other) {
        if (!(other instanceof JacobianPoint)) {
            throw new TypeError('JacobianPoint#add: expected JacobianPoint');
        }
        const X1 = this.x;
        const Y1 = this.y;
        const Z1 = this.z;
        const X2 = other.x;
        const Y2 = other.y;
        const Z2 = other.z;
        if (X2 === 0n || Y2 === 0n)
            return this;
        if (X1 === 0n || Y1 === 0n)
            return other;
        const Z1Z1 = mod(Z1 ** 2n);
        const Z2Z2 = mod(Z2 ** 2n);
        const U1 = mod(X1 * Z2Z2);
        const U2 = mod(X2 * Z1Z1);
        const S1 = mod(Y1 * Z2 * Z2Z2);
        const S2 = mod(mod(Y2 * Z1) * Z1Z1);
        const H = mod(U2 - U1);
        const r = mod(S2 - S1);
        if (H === 0n) {
            if (r === 0n) {
                return this.double();
            }
            else {
                return JacobianPoint.ZERO;
            }
        }
        const HH = mod(H ** 2n);
        const HHH = mod(H * HH);
        const V = mod(U1 * HH);
        const X3 = mod(r ** 2n - HHH - 2n * V);
        const Y3 = mod(r * (V - X3) - S1 * HHH);
        const Z3 = mod(Z1 * Z2 * H);
        return new JacobianPoint(X3, Y3, Z3);
    }
    subtract(other) {
        return this.add(other.negate());
    }
    multiplyUnsafe(scalar) {
        if (!isValidScalar(scalar))
            throw new TypeError('Point#multiply: expected valid scalar');
        let n = mod(BigInt(scalar), CURVE.n);
        if (!USE_ENDOMORPHISM) {
            let p = JacobianPoint.ZERO;
            let d = this;
            while (n > 0n) {
                if (n & 1n)
                    p = p.add(d);
                d = d.double();
                n >>= 1n;
            }
            return p;
        }
        let [k1neg, k1, k2neg, k2] = splitScalarEndo(n);
        let k1p = JacobianPoint.ZERO;
        let k2p = JacobianPoint.ZERO;
        let d = this;
        while (k1 > 0n || k2 > 0n) {
            if (k1 & 1n)
                k1p = k1p.add(d);
            if (k2 & 1n)
                k2p = k2p.add(d);
            d = d.double();
            k1 >>= 1n;
            k2 >>= 1n;
        }
        if (k1neg)
            k1p = k1p.negate();
        if (k2neg)
            k2p = k2p.negate();
        k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
        return k1p.add(k2p);
    }
    precomputeWindow(W) {
        const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1;
        let points = [];
        let p = this;
        let base = p;
        for (let window = 0; window < windows; window++) {
            base = p;
            points.push(base);
            for (let i = 1; i < 2 ** (W - 1); i++) {
                base = base.add(p);
                points.push(base);
            }
            p = base.double();
        }
        return points;
    }
    wNAF(n, affinePoint) {
        if (!affinePoint && this.equals(JacobianPoint.BASE))
            affinePoint = Point.BASE;
        const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1;
        if (256 % W) {
            throw new Error('Point#wNAF: Invalid precomputation window, must be power of 2');
        }
        let precomputes = affinePoint && pointPrecomputes.get(affinePoint);
        if (!precomputes) {
            precomputes = this.precomputeWindow(W);
            if (affinePoint && W !== 1) {
                precomputes = JacobianPoint.normalizeZ(precomputes);
                pointPrecomputes.set(affinePoint, precomputes);
            }
        }
        let p = JacobianPoint.ZERO;
        let f = JacobianPoint.ZERO;
        const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1;
        const windowSize = 2 ** (W - 1);
        const mask = BigInt(2 ** W - 1);
        const maxNumber = 2 ** W;
        const shiftBy = BigInt(W);
        for (let window = 0; window < windows; window++) {
            const offset = window * windowSize;
            let wbits = Number(n & mask);
            n >>= shiftBy;
            if (wbits > windowSize) {
                wbits -= maxNumber;
                n += 1n;
            }
            if (wbits === 0) {
                f = f.add(window % 2 ? precomputes[offset].negate() : precomputes[offset]);
            }
            else {
                const cached = precomputes[offset + Math.abs(wbits) - 1];
                p = p.add(wbits < 0 ? cached.negate() : cached);
            }
        }
        return [p, f];
    }
    multiply(scalar, affinePoint) {
        if (!isValidScalar(scalar))
            throw new TypeError('Point#multiply: expected valid scalar');
        let n = mod(BigInt(scalar), CURVE.n);
        let point;
        let fake;
        if (USE_ENDOMORPHISM) {
            const [k1neg, k1, k2neg, k2] = splitScalarEndo(n);
            let k1p, k2p, f1p, f2p;
            [k1p, f1p] = this.wNAF(k1, affinePoint);
            [k2p, f2p] = this.wNAF(k2, affinePoint);
            if (k1neg)
                k1p = k1p.negate();
            if (k2neg)
                k2p = k2p.negate();
            k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
            [point, fake] = [k1p.add(k2p), f1p.add(f2p)];
        }
        else {
            [point, fake] = this.wNAF(n, affinePoint);
        }
        return JacobianPoint.normalizeZ([point, fake])[0];
    }
    toAffine(invZ = invert(this.z)) {
        const invZ2 = invZ ** 2n;
        const x = mod(this.x * invZ2);
        const y = mod(this.y * invZ2 * invZ);
        return new Point(x, y);
    }
}
JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, 1n);
JacobianPoint.ZERO = new JacobianPoint(0n, 1n, 0n);
const pointPrecomputes = new WeakMap();
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        pointPrecomputes.delete(this);
    }
    static fromCompressedHex(bytes) {
        const isShort = bytes.length === 32;
        const x = bytesToNumber(isShort ? bytes : bytes.slice(1));
        const y2 = weistrass(x);
        let y = sqrtMod(y2);
        const isYOdd = (y & 1n) === 1n;
        if (isShort) {
            if (isYOdd)
                y = mod(-y);
        }
        else {
            const isFirstByteOdd = (bytes[0] & 1) === 1;
            if (isFirstByteOdd !== isYOdd)
                y = mod(-y);
        }
        const point = new Point(x, y);
        point.assertValidity();
        return point;
    }
    static fromUncompressedHex(bytes) {
        const x = bytesToNumber(bytes.slice(1, 33));
        const y = bytesToNumber(bytes.slice(33));
        const point = new Point(x, y);
        point.assertValidity();
        return point;
    }
    static fromHex(hex) {
        const bytes = ensureBytes(hex);
        const header = bytes[0];
        if (bytes.length === 32 || (bytes.length === 33 && (header === 0x02 || header === 0x03))) {
            return this.fromCompressedHex(bytes);
        }
        if (bytes.length === 65 && header === 0x04)
            return this.fromUncompressedHex(bytes);
        throw new Error(`Point.fromHex: received invalid point. Expected 32-33 compressed bytes or 65 uncompressed bytes, not ${bytes.length}`);
    }
    static fromPrivateKey(privateKey) {
        return Point.BASE.multiply(normalizePrivateKey(privateKey));
    }
    static fromSignature(msgHash, signature, recovery) {
        let h = msgHash instanceof Uint8Array ? bytesToNumber(msgHash) : hexToNumber(msgHash);
        const sig = normalizeSignature(signature);
        sig.assertValidity();
        const { r, s } = sig;
        if (recovery !== 0 && recovery !== 1) {
            throw new Error('Cannot recover signature: invalid yParity bit');
        }
        const prefix = 2 + (recovery & 1);
        const P_ = Point.fromHex(`0${prefix}${pad64(r)}`);
        const sP = JacobianPoint.fromAffine(P_).multiplyUnsafe(s);
        const hG = JacobianPoint.BASE.multiply(h);
        const rinv = invert(r, CURVE.n);
        const Q = sP.subtract(hG).multiplyUnsafe(rinv);
        const point = Q.toAffine();
        point.assertValidity();
        return point;
    }
    toRawBytes(isCompressed = false) {
        return hexToBytes(this.toHex(isCompressed));
    }
    toHex(isCompressed = false) {
        const x = pad64(this.x);
        if (isCompressed) {
            return `${this.y & 1n ? '03' : '02'}${x}`;
        }
        else {
            return `04${x}${pad64(this.y)}`;
        }
    }
    toHexX() {
        return this.toHex(true).slice(2);
    }
    toRawX() {
        return this.toRawBytes(true).slice(1);
    }
    assertValidity() {
        const msg = 'Point is not on elliptic curve';
        const { P } = CURVE;
        const { x, y } = this;
        if (x === 0n || y === 0n || x >= P || y >= P)
            throw new Error(msg);
        const left = mod(y * y);
        const right = weistrass(x);
        if ((left - right) % P !== 0n)
            throw new Error(msg);
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    negate() {
        return new Point(this.x, mod(-this.y));
    }
    double() {
        return JacobianPoint.fromAffine(this).double().toAffine();
    }
    add(other) {
        return JacobianPoint.fromAffine(this).add(JacobianPoint.fromAffine(other)).toAffine();
    }
    subtract(other) {
        return this.add(other.negate());
    }
    multiply(scalar) {
        return JacobianPoint.fromAffine(this).multiply(scalar, this).toAffine();
    }
}
exports.Point = Point;
Point.BASE = new Point(CURVE.Gx, CURVE.Gy);
Point.ZERO = new Point(0n, 0n);
function sliceDer(s) {
    return Number.parseInt(s[0], 16) >= 8 ? '00' + s : s;
}
class Signature {
    constructor(r, s) {
        this.r = r;
        this.s = s;
    }
    static fromHex(hex) {
        if (typeof hex !== 'string' && !(hex instanceof Uint8Array)) {
            throw new TypeError(`Signature.fromHex: Expected string or Uint8Array`);
        }
        const str = hex instanceof Uint8Array ? bytesToHex(hex) : hex;
        const length = parseByte(str.slice(2, 4));
        if (str.slice(0, 2) !== '30' || length !== str.length - 4 || str.slice(4, 6) !== '02') {
            throw new Error('Signature.fromHex: Invalid signature');
        }
        const rLen = parseByte(str.slice(6, 8));
        const rEnd = 8 + rLen;
        const rr = str.slice(8, rEnd);
        if (rr.startsWith('00') && parseByte(rr.slice(2, 4)) <= 0x7f) {
            throw new Error('Signature.fromHex: Invalid r with trailing length');
        }
        const r = hexToNumber(rr);
        const separator = str.slice(rEnd, rEnd + 2);
        if (separator !== '02') {
            throw new Error('Signature.fromHex: Invalid r-s separator');
        }
        const sLen = parseByte(str.slice(rEnd + 2, rEnd + 4));
        const diff = length - sLen - rLen - 10;
        if (diff > 0 || diff === -4) {
            throw new Error(`Signature.fromHex: Invalid total length`);
        }
        if (sLen > length - rLen - 4) {
            throw new Error(`Signature.fromHex: Invalid s`);
        }
        const sStart = rEnd + 4;
        const ss = str.slice(sStart, sStart + sLen);
        if (ss.startsWith('00') && parseByte(ss.slice(2, 4)) <= 0x7f) {
            throw new Error(`Signature.fromHex: Invalid s with trailing length`);
        }
        const s = hexToNumber(ss);
        return new Signature(r, s);
    }
    assertValidity() {
        const { r, s } = this;
        if (!isWithinCurveOrder(r))
            throw new Error('Invalid Signature: r must be 0 < r < n');
        if (!isWithinCurveOrder(s))
            throw new Error('Invalid Signature: s must be 0 < s < n');
    }
    toRawBytes(isCompressed = false) {
        return hexToBytes(this.toHex(isCompressed));
    }
    toHex(isCompressed = false) {
        const sHex = sliceDer(numberToHex(this.s));
        if (isCompressed)
            return sHex;
        const rHex = sliceDer(numberToHex(this.r));
        const rLen = numberToHex(rHex.length / 2);
        const sLen = numberToHex(sHex.length / 2);
        const length = numberToHex(rHex.length / 2 + sHex.length / 2 + 4);
        return `30${length}02${rLen}${rHex}02${sLen}${sHex}`;
    }
}
exports.Signature = Signature;
exports.SignResult = Signature;
function concatBytes(...arrays) {
    if (arrays.length === 1)
        return arrays[0];
    const length = arrays.reduce((a, arr) => a + arr.length, 0);
    const result = new Uint8Array(length);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
    }
    return result;
}
function bytesToHex(uint8a) {
    let hex = '';
    for (let i = 0; i < uint8a.length; i++) {
        hex += uint8a[i].toString(16).padStart(2, '0');
    }
    return hex;
}
function pad64(num) {
    return num.toString(16).padStart(64, '0');
}
function pad32b(num) {
    return hexToBytes(pad64(num));
}
function numberToHex(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
}
function hexToNumber(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToNumber: expected string, got ' + typeof hex);
    }
    return BigInt(`0x${hex}`);
}
function hexToBytes(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
    }
    if (hex.length % 2)
        throw new Error('hexToBytes: received invalid unpadded hex');
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        array[i] = Number.parseInt(hex.slice(j, j + 2), 16);
    }
    return array;
}
function ensureBytes(hex) {
    return hex instanceof Uint8Array ? hex : hexToBytes(hex);
}
function bytesToNumber(bytes) {
    return hexToNumber(bytesToHex(bytes));
}
function parseByte(str) {
    return Number.parseInt(str, 16) * 2;
}
function isValidScalar(num) {
    if (typeof num === 'bigint' && num > 0n)
        return true;
    if (typeof num === 'number' && num > 0 && Number.isSafeInteger(num))
        return true;
    return false;
}
function mod(a, b = CURVE.P) {
    const result = a % b;
    return result >= 0 ? result : b + result;
}
function pow2(x, power) {
    const { P } = CURVE;
    let res = x;
    while (power-- > 0n) {
        res *= res;
        res %= P;
    }
    return res;
}
function sqrtMod(x) {
    const { P } = CURVE;
    const b2 = (x * x * x) % P;
    const b3 = (b2 * b2 * x) % P;
    const b6 = (pow2(b3, 3n) * b3) % P;
    const b9 = (pow2(b6, 3n) * b3) % P;
    const b11 = (pow2(b9, 2n) * b2) % P;
    const b22 = (pow2(b11, 11n) * b11) % P;
    const b44 = (pow2(b22, 22n) * b22) % P;
    const b88 = (pow2(b44, 44n) * b44) % P;
    const b176 = (pow2(b88, 88n) * b88) % P;
    const b220 = (pow2(b176, 44n) * b44) % P;
    const b223 = (pow2(b220, 3n) * b3) % P;
    const t1 = (pow2(b223, 23n) * b22) % P;
    const t2 = (pow2(t1, 6n) * b2) % P;
    return pow2(t2, 2n);
}
function invert(number, modulo = CURVE.P) {
    if (number === 0n || modulo <= 0n) {
        throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
    }
    let a = mod(number, modulo);
    let b = modulo;
    let [x, y, u, v] = [0n, 1n, 1n, 0n];
    while (a !== 0n) {
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        const n = y - v * q;
        [b, a] = [a, r];
        [x, y] = [u, v];
        [u, v] = [m, n];
    }
    const gcd = b;
    if (gcd !== 1n)
        throw new Error('invert: does not exist');
    return mod(x, modulo);
}
function invertBatch(nums, n = CURVE.P) {
    const len = nums.length;
    const scratch = new Array(len);
    let acc = 1n;
    for (let i = 0; i < len; i++) {
        if (nums[i] === 0n)
            continue;
        scratch[i] = acc;
        acc = mod(acc * nums[i], n);
    }
    acc = invert(acc, n);
    for (let i = len - 1; i >= 0; i--) {
        if (nums[i] === 0n)
            continue;
        const tmp = mod(acc * nums[i], n);
        nums[i] = mod(acc * scratch[i], n);
        acc = tmp;
    }
    return nums;
}
const divNearest = (a, b) => (a + b / 2n) / b;
const POW_2_128 = 2n ** 128n;
function splitScalarEndo(k) {
    const { n } = CURVE;
    const a1 = 0x3086d221a7d46bcde86c90e49284eb15n;
    const b1 = -0xe4437ed6010e88286f547fa90abfe4c3n;
    const a2 = 0x114ca50f7a8e2f3f657c1108d9d44cfd8n;
    const b2 = a1;
    const c1 = divNearest(b2 * k, n);
    const c2 = divNearest(-b1 * k, n);
    let k1 = mod(k - c1 * a1 - c2 * a2, n);
    let k2 = mod(-c1 * b1 - c2 * b2, n);
    const k1neg = k1 > POW_2_128;
    const k2neg = k2 > POW_2_128;
    if (k1neg)
        k1 = n - k1;
    if (k2neg)
        k2 = n - k2;
    if (k1 > POW_2_128 || k2 > POW_2_128)
        throw new Error('splitScalarEndo: Endomorphism failed');
    return [k1neg, k1, k2neg, k2];
}
function truncateHash(hash) {
    if (typeof hash !== 'string')
        hash = bytesToHex(hash);
    let msg = hexToNumber(hash || '0');
    const byteLength = hash.length / 2;
    const delta = byteLength * 8 - 256;
    if (delta > 0) {
        msg = msg >> BigInt(delta);
    }
    if (msg >= CURVE.n) {
        msg -= CURVE.n;
    }
    return msg;
}
function _abc6979(msgHash, privateKey) {
    if (msgHash == null)
        throw new Error(`sign: expected valid msgHash, not "${msgHash}"`);
    const num = typeof msgHash === 'string' ? hexToNumber(msgHash) : bytesToNumber(msgHash);
    const h1 = pad32b(num);
    const h1n = bytesToNumber(h1);
    const x = pad32b(privateKey);
    let v = new Uint8Array(32).fill(1);
    let k = new Uint8Array(32).fill(0);
    const b0 = Uint8Array.from([0x00]);
    const b1 = Uint8Array.from([0x01]);
    return [h1, h1n, x, v, k, b0, b1];
}
async function getQRSrfc6979(msgHash, privateKey) {
    const privKey = normalizePrivateKey(privateKey);
    let [h1, h1n, x, v, k, b0, b1] = _abc6979(msgHash, privKey);
    const hmac = exports.utils.hmacSha256;
    k = await hmac(k, v, b0, x, h1);
    v = await hmac(k, v);
    k = await hmac(k, v, b1, x, h1);
    v = await hmac(k, v);
    for (let i = 0; i < 1000; i++) {
        v = await hmac(k, v);
        let qrs = calcQRSFromK(v, h1n, privKey);
        if (qrs)
            return qrs;
        k = await hmac(k, v, b0);
        v = await hmac(k, v);
    }
    throw new TypeError('secp256k1: Tried 1,000 k values for sign(), all were invalid');
}
function getQRSrfc6979Sync(msgHash, privateKey) {
    const privKey = normalizePrivateKey(privateKey);
    let [h1, h1n, x, v, k, b0, b1] = _abc6979(msgHash, privKey);
    const hmac = exports.utils.hmacSha256;
    k = hmac(k, v, b0, x, h1);
    if (k instanceof Promise)
        throw new Error('To use sync sign(), ensure utils.hmacSha256 is sync');
    v = hmac(k, v);
    k = hmac(k, v, b1, x, h1);
    v = hmac(k, v);
    for (let i = 0; i < 1000; i++) {
        v = hmac(k, v);
        let qrs = calcQRSFromK(v, h1n, privKey);
        if (qrs)
            return qrs;
        k = hmac(k, v, b0);
        v = hmac(k, v);
    }
    throw new TypeError('secp256k1: Tried 1,000 k values for sign(), all were invalid');
}
function isWithinCurveOrder(num) {
    return 0 < num && num < CURVE.n;
}
function calcQRSFromK(v, msg, priv) {
    const k = bytesToNumber(v);
    if (!isWithinCurveOrder(k))
        return;
    const max = CURVE.n;
    const q = Point.BASE.multiply(k);
    const r = mod(q.x, max);
    const s = mod(invert(k, max) * (msg + r * priv), max);
    if (r === 0n || s === 0n)
        return;
    return [q, r, s];
}
function normalizePrivateKey(key) {
    let num;
    if (typeof key === 'bigint') {
        num = key;
    }
    else if (typeof key === 'number' && Number.isSafeInteger(key) && key > 0) {
        num = BigInt(key);
    }
    else if (typeof key === 'string') {
        if (key.length !== 64)
            throw new Error('Expected 32 bytes of private key');
        num = hexToNumber(key);
    }
    else if (key instanceof Uint8Array) {
        if (key.length !== 32)
            throw new Error('Expected 32 bytes of private key');
        num = bytesToNumber(key);
    }
    else {
        throw new TypeError('Expected valid private key');
    }
    if (!isWithinCurveOrder(num))
        throw new Error('Expected private key: 0 < key < n');
    return num;
}
function normalizePublicKey(publicKey) {
    return publicKey instanceof Point ? publicKey : Point.fromHex(publicKey);
}
function normalizeSignature(signature) {
    return signature instanceof Signature ? signature : Signature.fromHex(signature);
}
function getPublicKey(privateKey, isCompressed = false) {
    const point = Point.fromPrivateKey(privateKey);
    if (typeof privateKey === 'string') {
        return point.toHex(isCompressed);
    }
    return point.toRawBytes(isCompressed);
}
exports.getPublicKey = getPublicKey;
function recoverPublicKey(msgHash, signature, recovery) {
    const point = Point.fromSignature(msgHash, signature, recovery);
    return typeof msgHash === 'string' ? point.toHex() : point.toRawBytes();
}
exports.recoverPublicKey = recoverPublicKey;
function isPub(item) {
    const arr = item instanceof Uint8Array;
    const str = typeof item === 'string';
    const len = (arr || str) && item.length;
    if (arr)
        return len === 33 || len === 65;
    if (str)
        return len === 66 || len === 130;
    if (item instanceof Point)
        return true;
    return false;
}
function getSharedSecret(privateA, publicB, isCompressed = false) {
    if (isPub(privateA))
        throw new TypeError('getSharedSecret: first arg must be private key');
    if (!isPub(publicB))
        throw new TypeError('getSharedSecret: second arg must be public key');
    const b = normalizePublicKey(publicB);
    b.assertValidity();
    const shared = b.multiply(normalizePrivateKey(privateA));
    return typeof privateA === 'string'
        ? shared.toHex(isCompressed)
        : shared.toRawBytes(isCompressed);
}
exports.getSharedSecret = getSharedSecret;
function QRSToSig(qrs, opts, str = false) {
    const [q, r, s] = qrs;
    let { canonical, recovered } = opts;
    let recovery = (q.x === r ? 0 : 2) | Number(q.y & 1n);
    let adjustedS = s;
    const HIGH_NUMBER = CURVE.n >> 1n;
    if (s > HIGH_NUMBER && canonical) {
        adjustedS = CURVE.n - s;
        recovery ^= 1;
    }
    const sig = new Signature(r, adjustedS);
    const hashed = str ? sig.toHex() : sig.toRawBytes();
    return recovered ? [hashed, recovery] : hashed;
}
async function sign(msgHash, privKey, opts = {}) {
    return QRSToSig(await getQRSrfc6979(msgHash, privKey), opts, typeof msgHash === 'string');
}
exports.sign = sign;
function _syncSign(msgHash, privKey, opts = {}) {
    return QRSToSig(getQRSrfc6979Sync(msgHash, privKey), opts, typeof msgHash === 'string');
}
exports._syncSign = _syncSign;
function verify(signature, msgHash, publicKey) {
    const { n } = CURVE;
    const sig = normalizeSignature(signature);
    try {
        sig.assertValidity();
    }
    catch (error) {
        return false;
    }
    const { r, s } = sig;
    const h = truncateHash(msgHash);
    if (h === 0n)
        return false;
    const pubKey = JacobianPoint.fromAffine(normalizePublicKey(publicKey));
    const s1 = invert(s, n);
    const u1 = mod(h * s1, n);
    const u2 = mod(r * s1, n);
    const Ghs1 = JacobianPoint.BASE.multiply(u1);
    const Prs1 = pubKey.multiplyUnsafe(u2);
    const R = Ghs1.add(Prs1).toAffine();
    const v = mod(R.x, n);
    return v === r;
}
exports.verify = verify;
async function taggedHash(tag, ...messages) {
    const tagB = new Uint8Array(tag.split('').map((c) => c.charCodeAt(0)));
    const tagH = await exports.utils.sha256(tagB);
    const h = await exports.utils.sha256(concatBytes(tagH, tagH, ...messages));
    return bytesToNumber(h);
}
async function createChallenge(x, P, message) {
    const rx = pad32b(x);
    const t = await taggedHash('BIP0340/challenge', rx, P.toRawX(), message);
    return mod(t, CURVE.n);
}
function hasEvenY(point) {
    return mod(point.y, 2n) === 0n;
}
class SchnorrSignature {
    constructor(r, s) {
        this.r = r;
        this.s = s;
        if (r === 0n || s === 0n || r >= CURVE.P || s >= CURVE.n)
            throw new Error('Invalid signature');
    }
    static fromHex(hex) {
        const bytes = ensureBytes(hex);
        if (bytes.length !== 64) {
            throw new TypeError(`SchnorrSignature.fromHex: expected 64 bytes, not ${bytes.length}`);
        }
        const r = bytesToNumber(bytes.slice(0, 32));
        const s = bytesToNumber(bytes.slice(32));
        return new SchnorrSignature(r, s);
    }
    toHex() {
        return pad64(this.r) + pad64(this.s);
    }
    toRawBytes() {
        return hexToBytes(this.toHex());
    }
}
function schnorrGetPublicKey(privateKey) {
    const P = Point.fromPrivateKey(privateKey);
    return typeof privateKey === 'string' ? P.toHexX() : P.toRawX();
}
async function schnorrSign(msgHash, privateKey, auxRand = exports.utils.randomBytes()) {
    if (msgHash == null)
        throw new TypeError(`sign: Expected valid message, not "${msgHash}"`);
    if (!privateKey)
        privateKey = 0n;
    const { n } = CURVE;
    const m = ensureBytes(msgHash);
    const d0 = normalizePrivateKey(privateKey);
    const rand = ensureBytes(auxRand);
    if (rand.length !== 32)
        throw new TypeError('sign: Expected 32 bytes of aux randomness');
    const P = Point.fromPrivateKey(d0);
    const d = hasEvenY(P) ? d0 : n - d0;
    const t0h = await taggedHash('BIP0340/aux', rand);
    const t = d ^ t0h;
    const k0h = await taggedHash('BIP0340/nonce', pad32b(t), P.toRawX(), m);
    const k0 = mod(k0h, n);
    if (k0 === 0n)
        throw new Error('sign: Creation of signature failed. k is zero');
    const R = Point.fromPrivateKey(k0);
    const k = hasEvenY(R) ? k0 : n - k0;
    const e = await createChallenge(R.x, P, m);
    const sig = new SchnorrSignature(R.x, mod(k + e * d, n));
    const isValid = await schnorrVerify(sig.toRawBytes(), m, P.toRawX());
    if (!isValid)
        throw new Error('sign: Invalid signature produced');
    return typeof msgHash === 'string' ? sig.toHex() : sig.toRawBytes();
}
async function schnorrVerify(signature, msgHash, publicKey) {
    const sig = signature instanceof SchnorrSignature ? signature : SchnorrSignature.fromHex(signature);
    const m = typeof msgHash === 'string' ? hexToBytes(msgHash) : msgHash;
    const P = normalizePublicKey(publicKey);
    const e = await createChallenge(sig.r, P, m);
    const sG = Point.fromPrivateKey(sig.s);
    const eP = P.multiply(e);
    const R = sG.subtract(eP);
    if (R.equals(Point.BASE) || !hasEvenY(R) || R.x !== sig.r)
        return false;
    return true;
}
exports.schnorr = {
    Signature: SchnorrSignature,
    getPublicKey: schnorrGetPublicKey,
    sign: schnorrSign,
    verify: schnorrVerify,
};
Point.BASE._setWindowSize(8);
exports.utils = {
    isValidPrivateKey(privateKey) {
        try {
            normalizePrivateKey(privateKey);
            return true;
        }
        catch (error) {
            return false;
        }
    },
    randomBytes: (bytesLength = 32) => {
        if (typeof self == 'object' && 'crypto' in self) {
            return self.crypto.getRandomValues(new Uint8Array(bytesLength));
        }
        else if (typeof process === 'object' && 'node' in process.versions) {
            const { randomBytes } = __webpack_require__(370);
            return new Uint8Array(randomBytes(bytesLength).buffer);
        }
        else {
            throw new Error("The environment doesn't have randomBytes function");
        }
    },
    randomPrivateKey: () => {
        let i = 8;
        while (i--) {
            const b32 = exports.utils.randomBytes(32);
            const num = bytesToNumber(b32);
            if (num > 1n && num < CURVE.n)
                return b32;
        }
        throw new Error('Valid private key was not found in 8 iterations. PRNG is broken');
    },
    sha256: async (message) => {
        if (typeof self == 'object' && 'crypto' in self) {
            const buffer = await self.crypto.subtle.digest('SHA-256', message.buffer);
            return new Uint8Array(buffer);
        }
        else if (typeof process === 'object' && 'node' in process.versions) {
            const { createHash } = __webpack_require__(370);
            return Uint8Array.from(createHash('sha256').update(message).digest());
        }
        else {
            throw new Error("The environment doesn't have sha256 function");
        }
    },
    hmacSha256: async (key, ...messages) => {
        if (typeof self == 'object' && 'crypto' in self) {
            const ckey = await self.crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign']);
            const message = concatBytes(...messages);
            const buffer = await self.crypto.subtle.sign('HMAC', ckey, message);
            return new Uint8Array(buffer);
        }
        else if (typeof process === 'object' && 'node' in process.versions) {
            const { createHmac } = __webpack_require__(370);
            const hash = createHmac('sha256', key);
            for (let message of messages) {
                hash.update(message);
            }
            return Uint8Array.from(hash.digest());
        }
        else {
            throw new Error("The environment doesn't have hmac-sha256 function");
        }
    },
    precompute(windowSize = 8, point = Point.BASE) {
        const cached = point === Point.BASE ? point : new Point(point.x, point.y);
        cached._setWindowSize(windowSize);
        cached.multiply(3n);
        return cached;
    },
};


/***/ }),

/***/ 822:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Contract = void 0;
const abi_1 = __webpack_require__(285);
const serializer_1 = __webpack_require__(825);
const VariableBlob_1 = __importDefault(__webpack_require__(737));
/**
 * The contract class contains the contract ID and contrac entries
 * definition needed to encode/decode operations during the
 * interaction with the user and the communication with the RPC node.
 *
 * Operations are encoded to communicate with the RPC node. However,
 * this format is not human readable as the data is serialized and
 * encoded in Base64 format. When decoding operations, they can be
 * read by the user (see [[EncodedOperation]] and [[DecodedOperation]]).
 *
 * @example
 *
 * ```ts
 * const contract = new Contract({
 *   id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 *   entries: {
 *     transfer: {
 *       id: 0x62efa292,
 *       inputs: {
 *         type: [
 *           {
 *             name: "from",
 *             type: "string",
 *           },
 *           {
 *             name: "to",
 *             type: "string",
 *           },
 *           {
 *             name: "value",
 *             type: "uint64",
 *           },
 *         ],
 *       },
 *     },
 *     balance_of: {
 *       id: 0x15619248,
 *       inputs: { type: "string" },
 *       outputs: { type: "uint64" },
 *     },
 *   },
 * });
 *
 * const opEncoded = contract.encodeOperation({
 *   name: "transfer",
 *   args: {
 *     from: "alice",
 *     to: "bob",
 *     value: BigInt(1000),
 *   },
 * });
 *
 * console.log(opEncoded);
 * // {
 * //   type: "koinos::protocol::call_contract_operation",
 * //   value: {
 * //     contract_id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 * //     entry_point: 0x62efa292,
 * //     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
 * //   }
 * // }
 *
 * const opDecoded = contract.decodeOperation(opEncoded);
 * console.log(opDecoded);
 * // {
 * //   name: "transfer",
 * //   args: {
 * //     from: "alice",
 * //     to: "bob",
 * //     value: 1000n,
 * //   },
 * // }
 *
 * const resultDecoded = contract.decodeResult("MAAsZnAzyD0E=", "balance_of");
 * console.log(resultDecoded)
 * // 3124382766600001n
 * ```
 */
class Contract {
    /**
     * The constructor receives the contract ID and
     * contract entries definition
     * @param c - Object with contract id and contract entries
     *
     * @example
     * ```ts
     * const contract = new Contract({
     *   id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
     *   entries: {
     *     transfer: {
     *       id: 0x62efa292,
     *       inputs: {
     *         type: [
     *           {
     *             name: "from",
     *             type: "string",
     *           },
     *           {
     *             name: "to",
     *             type: "string",
     *           },
     *           {
     *             name: "value",
     *             type: "uint64",
     *           },
     *         ],
     *       },
     *     },
     *     balance_of: {
     *       id: 0x15619248,
     *       inputs: { type: "string" },
     *       outputs: { type: "uint64" },
     *     },
     *   },
     * });
     * ```
     */
    constructor(c) {
        this.id = c.id;
        this.entries = c.entries;
    }
    /**
     * Encondes a contract operation using Koinos serialization
     * and taking the contract entries as reference to build it
     * @param op Operation to encode
     * @returns Operation encoded
     * @example
     * ```ts
     * const opEncoded = contract.encodeOperation({
     *   name: "transfer",
     *   args: {
     *     from: "alice",
     *     to: "bob",
     *     value: 1000,
     *   }
     * });
     *
     * console.log(opEncoded);
     * // {
     * //   type: "koinos::protocol::call_contract_operation",
     * //   value: {
     * //     contract_id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
     * //     entry_point: 0x62efa292,
     * //     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
     * //   }
     * // }
     * ```
     */
    encodeOperation(op) {
        if (!this.entries || !this.entries[op.name])
            throw new Error(`Operation ${op.name} unknown`);
        const entry = this.entries[op.name];
        return {
            type: abi_1.abiCallContractOperation.name,
            value: {
                contract_id: this.id,
                entry_point: entry.id,
                ...(entry.inputs && {
                    args: serializer_1.serialize(op.args, entry.inputs).toString(),
                }),
            },
        };
    }
    /**
     * Decodes a contract operation to be human readable
     * @example
     * ```ts
     * const opDecoded = contract.decodeOperation({
     *   type: "koinos::protocol::call_contract_operation",
     *   value: {
     *     contract_id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
     *     entry_point: 0x62efa292,
     *     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
     *   }
     * });
     * console.log(opDecoded);
     * // {
     * //   name: "transfer",
     * //   args: {
     * //     from: "alice",
     * //     to: "bob",
     * //     value: 1000n,
     * //   },
     * // }
     * ```
     */
    decodeOperation(op) {
        if (op.value.contract_id !== this.id)
            throw new Error(`Invalid contract id. Expected: ${this.id}. Received: ${op.value.contract_id}`);
        for (let opName in this.entries) {
            const entry = this.entries[opName];
            if (op.value.entry_point === entry.id) {
                const vb = new VariableBlob_1.default(op.value.args);
                return {
                    name: opName,
                    args: serializer_1.deserialize(vb, entry.inputs),
                };
            }
        }
        throw new Error(`Unknown entry id ${op.value.entry_point}`);
    }
    /**
     * Decodes a result. This function is used in conjunction with
     * [[Provider.readContract | readContract of Provider class]] to read a
     * contract and decode the result. "outputs" field must be defined in
     * the abi for the operation name.
     * @param result Encoded result in base64
     * @param opName Operation name
     * @returns Decoded result
     * @example
     * ```ts
     * const resultDecoded = contract.decodeResult("MAAsZnAzyD0E=", "balance_of");
     * console.log(resultDecoded)
     * // 3124382766600001n
     * ```
     */
    decodeResult(result, opName) {
        const entry = this.entries[opName];
        if (!entry.outputs)
            throw new Error(`There are no outputs defined for ${opName}`);
        return serializer_1.deserialize(result, entry.outputs);
    }
}
exports.Contract = Contract;
exports.default = Contract;


/***/ }),

/***/ 12:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Multihash = void 0;
const VariableBlob_1 = __importDefault(__webpack_require__(737));
/**
 * Multihash is a protocol for differentiating outputs from various
 * well-established cryptographic hash functions, addressing size +
 * encoding considerations
 */
class Multihash {
    /**
     *
     * @param digest - digest
     * @param id - hash id. By default it uses 0x12 which corresponds with sha2-256
     *
     * @example
     * ```ts
     * const buffer = new Uint8Array(32);
     * const multihash = new Multihash(buffer);
     * ```
     */
    constructor(digest, id = 0x12) {
        this.id = id;
        this.digest = digest;
    }
    /**
     * @returns Encodes the multihash in base58
     */
    toString() {
        const vb = new VariableBlob_1.default();
        vb.serializeVarint(this.id);
        vb.serializeBuffer(this.digest);
        return vb.toString("z");
    }
}
exports.Multihash = Multihash;
exports.default = Multihash;


/***/ }),

/***/ 635:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Provider = void 0;
const multibase_1 = __importDefault(__webpack_require__(957));
const axios_1 = __importDefault(__webpack_require__(669));
/**
 * Class to connect with the RPC node
 */
class Provider {
    /**
     *
     * @param url url of rpc node
     * @example
     * ```ts
     * const provider = new Provider("http://45.56.104.152:8080");
     * ```
     */
    constructor(url) {
        this.url = url;
    }
    /**
     * Function to make jsonrpc requests to the RPC node
     * @param method - jsonrpc method
     * @param params - jsonrpc params
     * @returns Result of jsonrpc response
     */
    async call(method, params) {
        const data = {
            id: Math.round(Math.random() * 1000),
            jsonrpc: "2.0",
            method,
            params,
        };
        // TODO: search conditional to enable fetch for Browser
        /* const response = await fetch(this.url, {
          method: "POST",
          body: JSON.stringify(data),
        });
        const json = await response.json();
        if (json.error && json.error.message) throw new Error(json.error.message);
        return json.result; */
        const response = await axios_1.default.post(this.url, data, { validateStatus: () => true });
        if (response.data.error)
            throw new Error(response.data.error.message);
        return response.data.result;
    }
    /**
     * Function to call "chain.get_account_nonce" to return the number of
     * transactions for a particular account. This call is used
     * when creating new transactions.
     * @param address - account address
     * @returns Nonce
     */
    async getNonce(address) {
        const bufferAddress = new TextEncoder().encode(address);
        const encBase64 = new TextDecoder().decode(multibase_1.default.encode("M", bufferAddress));
        const result = await this.call("chain.get_account_nonce", {
            account: encBase64,
        });
        return Number(result.nonce);
    }
    /**
     * Function to call "chain.submit_transaction" to send a signed
     * transaction to the blockchain
     * @param transaction Signed transaction
     * @returns
     */
    async sendTransaction(transaction) {
        return this.call("chain.submit_transaction", { transaction });
    }
    /**
     * Function to call "chain.read_contract" to read a contract.
     * The operation must be encoded (see [[EncodedOperation]]).
     * See also [[Wallet.readContract]] which, apart from the Provider,
     * uses the contract definition and it is prepared to receive
     * the operation decoded and return the result decoded as well.
     * @param operation Encoded operation
     * @returns Encoded result
     */
    async readContract(operation) {
        return this.call("chain.read_contract", operation.value);
    }
}
exports.Provider = Provider;


/***/ }),

/***/ 991:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Signer = void 0;
const js_sha256_1 = __webpack_require__(23);
const secp = __importStar(__webpack_require__(795));
const abi_1 = __webpack_require__(285);
const Multihash_1 = __importDefault(__webpack_require__(12));
const serializer_1 = __webpack_require__(825);
const utils_1 = __webpack_require__(593);
const VariableBlob_1 = __webpack_require__(737);
/**
 * The Signer Class contains the private key needed to sign transactions.
 * It can be created using the seed, wif, or private key
 *
 * @example
 * using private key as hex string
 * ```ts
 * var signer = new Signer("ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c");
 * ```
 * <br>
 *
 * using private key as Uint8Array
 * ```ts
 * var buffer = new Uint8Array([
 *   236, 134,   1, 162,  79, 129, 222, 205,
 *    87, 244, 182,  17, 181, 172, 110, 184,
 *     1, 203,  55, 128, 187,   2, 192, 249,
 *   205, 254, 157,   9, 218, 173, 223, 156
 * ]);
 * var signer = new Signer(buffer);
 * ```
 *
 * <br>
 *
 * using private key as bigint
 * ```ts
 * var signer = new Signer(106982601049961974618234078204952280507266494766432547312316920283818886029212n);
 * ```
 *
 * <br>
 *
 * using the seed
 * ```ts
 * var signer = Signer.fromSeed("my seed");
 * ```
 *
 * <br>
 *
 * using private key in WIF format
 * ```ts
 * var signer = Signer.fromWif("L59UtJcTdNBnrH2QSBA5beSUhRufRu3g6tScDTite6Msuj7U93tM");
 * ```
 */
class Signer {
    /**
     * The constructor receives de private key as hexstring, bigint or Uint8Array.
     * See also the functions [[Signer.fromWif]] and [[Signer.fromSeed]]
     * to create the signer from the WIF or Seed respectively.
     *
     * @param privateKey - Private key as hexstring, bigint or Uint8Array
     * @param compressed
     * @example
     * ```ts
     * cons signer = new Signer("ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c");
     * console.log(signer.getAddress());
     * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
     * ```
     */
    constructor(privateKey, compressed = true) {
        this.compressed = compressed;
        this.privateKey = privateKey;
        if (typeof privateKey === "string") {
            this.publicKey = secp.getPublicKey(privateKey, this.compressed);
            this.address = utils_1.bitcoinAddress(utils_1.toUint8Array(this.publicKey), this.compressed);
        }
        else {
            this.publicKey = secp.getPublicKey(privateKey, this.compressed);
            this.address = utils_1.bitcoinAddress(this.publicKey, this.compressed);
        }
    }
    /**
     * Function to import a private key from the WIF
     * @param wif Private key in WIF format
     * @example
     * ```ts
     * const signer = Signer.fromWif("L59UtJcTdNBnrH2QSBA5beSUhRufRu3g6tScDTite6Msuj7U93tM")
     * console.log(signer.getAddress());
     * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
     * ```
     * @returns Signer object
     */
    static fromWif(wif) {
        const privateKey = utils_1.bitcoinDecode(wif);
        return new Signer(utils_1.toHexString(privateKey));
    }
    /**
     * Function to import a private key from the seed
     * @param seed Seed words
     * @example
     * ```ts
     * const signer = Signer.fromSeed("my seed");
     * console.log(signer.getAddress());
     * // 1BqtgWBcqm9cSZ97avLGZGJdgso7wx6pCA
     * ```
     * @returns Signer object
     */
    static fromSeed(seed) {
        const privateKey = js_sha256_1.sha256(seed);
        return new Signer(privateKey);
    }
    /**
     *
     * @returns Signer address
     */
    getAddress() {
        return this.address;
    }
    /**
     * Function to sign a transaction. It's important to remark that
     * the transaction parameter is modified inside this function.
     * @param tx Unsigned transaction
     * @returns
     */
    async signTransaction(tx) {
        const blobActiveData = serializer_1.serialize(tx.active_data, abi_1.abiActiveData);
        const hash = js_sha256_1.sha256(blobActiveData.buffer);
        const [hex, recovery] = await secp.sign(hash, this.privateKey, {
            recovered: true,
            canonical: true,
        });
        // compact signature
        const { r, s } = secp.Signature.fromHex(hex);
        const rHex = r.toString(16).padStart(64, "0");
        const sHex = s.toString(16).padStart(64, "0");
        const recId = (recovery + 31).toString(16).padStart(2, "0");
        tx.signature_data = new VariableBlob_1.VariableBlob(utils_1.toUint8Array(recId + rHex + sHex)).toString();
        tx.id = new Multihash_1.default(utils_1.toUint8Array(hash)).toString();
        return tx;
    }
}
exports.Signer = Signer;
exports.default = Signer;


/***/ }),

/***/ 737:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VariableBlob = void 0;
const multibase = __importStar(__webpack_require__(957));
/**
 * Class to serialize and deserialize data in Koinos
 */
class VariableBlob {
    constructor(input) {
        if (typeof input === "string") {
            this.buffer = multibase.decode(input);
        }
        else {
            this.buffer = input ? input : new Uint8Array();
        }
        this.offset = 0;
    }
    resetCursor() {
        this.offset = 0;
        return this;
    }
    checkRemaining(size, canResize = false) {
        if (this.offset + size > this.buffer.length) {
            if (!canResize)
                throw new Error("Unexpected EOF");
            const newSize = this.offset + size;
            const buffer = new Uint8Array(newSize);
            buffer.set(this.buffer);
            this.buffer = buffer;
        }
    }
    write(data, length = 0) {
        let bytes = typeof data === "string" ? multibase.decode(data) : data;
        if (length && bytes.length !== length)
            throw new Error(`Invalid length. Expected: ${length}. Received: ${bytes.length}`);
        this.checkRemaining(bytes.length, true);
        this.buffer.set(bytes, this.offset);
        this.offset += bytes.length;
    }
    read(size, outputString = false, nameOrCode = "M") {
        this.checkRemaining(size);
        const subBuffer = new Uint8Array(size);
        subBuffer.set(this.buffer.subarray(this.offset, this.offset + size));
        this.offset += size;
        if (outputString) {
            return new VariableBlob(subBuffer).toString(nameOrCode);
        }
        return subBuffer;
    }
    writeInt8(n) {
        this.checkRemaining(1, true);
        new DataView(this.buffer.buffer).setInt8(this.offset, n);
        this.offset += 1;
    }
    readInt8() {
        this.checkRemaining(1);
        const n = new DataView(this.buffer.buffer).getInt8(this.offset);
        this.offset += 1;
        return n;
    }
    writeInt16(n) {
        this.checkRemaining(2, true);
        new DataView(this.buffer.buffer).setInt16(this.offset, n);
        this.offset += 2;
    }
    readInt16() {
        this.checkRemaining(2);
        const n = new DataView(this.buffer.buffer).getInt16(this.offset);
        this.offset += 2;
        return n;
    }
    writeInt32(n) {
        this.checkRemaining(4, true);
        new DataView(this.buffer.buffer).setInt32(this.offset, n);
        this.offset += 4;
    }
    readInt32() {
        this.checkRemaining(4);
        const n = new DataView(this.buffer.buffer).getInt32(this.offset);
        this.offset += 4;
        return n;
    }
    writeUint8(n) {
        this.checkRemaining(1, true);
        // new DataView(this.buffer.buffer).setUint8(this.offset, n);
        this.buffer[this.offset] = n;
        this.offset += 1;
    }
    readUint8() {
        this.checkRemaining(1);
        // const n = new DataView(this.buffer.buffer).getUint8(this.offset);
        const n = this.buffer[this.offset];
        this.offset += 1;
        return n;
    }
    writeUint16(n) {
        this.checkRemaining(2, true);
        new DataView(this.buffer.buffer).setUint16(this.offset, n);
        this.offset += 2;
    }
    readUint16() {
        this.checkRemaining(2);
        const n = new DataView(this.buffer.buffer).getUint16(this.offset);
        this.offset += 2;
        return n;
    }
    writeUint32(n) {
        this.checkRemaining(4, true);
        new DataView(this.buffer.buffer).setUint32(this.offset, n);
        this.offset += 4;
    }
    readUint32() {
        this.checkRemaining(4);
        const n = new DataView(this.buffer.buffer).getUint32(this.offset);
        this.offset += 4;
        return n;
    }
    // Varint
    serializeVarint(num) {
        if (num === 0) {
            this.writeUint8(0);
            return;
        }
        let n = num;
        let shift7 = num;
        while (n > 0) {
            shift7 = n >> 7;
            const group7 = n - (shift7 << 7);
            const byte = shift7 > 0 ? 128 + group7 : group7;
            this.writeUint8(byte);
            n = shift7;
        }
    }
    deserializeVarint() {
        let i = 0;
        let n = 0;
        let endVarInt = false;
        while (!endVarInt) {
            const byte = this.readUint8();
            endVarInt = byte < 128;
            const mod = endVarInt ? byte : byte - 128;
            n += mod << (7 * i);
            i += 1;
        }
        return n;
    }
    // Buffer
    serializeBuffer(data) {
        let bytes = typeof data === "string" ? multibase.decode(data) : data;
        this.serializeVarint(bytes.length);
        this.write(bytes);
    }
    deserializeBuffer(outputString = false, nameOrCode = "M") {
        const size = this.deserializeVarint();
        return this.read(size, outputString, nameOrCode);
    }
    // String
    serializeString(str) {
        const bytes = new TextEncoder().encode(str);
        this.serializeVarint(bytes.length);
        this.write(bytes);
    }
    deserializeString() {
        const size = this.deserializeVarint();
        const buffer = this.read(size);
        return new TextDecoder().decode(buffer);
    }
    // Bigint
    serializeBigint(num, bits) {
        const bignum = BigInt(num);
        let numString;
        if (bignum >= BigInt(0)) {
            numString = bignum.toString(16);
            numString = "0".repeat(bits / 4 - numString.length) + numString;
        }
        else {
            numString = (BigInt("0x1" + "0".repeat(bits / 4)) + bignum).toString(16);
        }
        for (let i = 0; i < bits / 4; i += 8) {
            const uint32 = Number("0x" + numString.substring(i, i + 8));
            this.writeUint32(uint32);
        }
    }
    deserializeBigint(bits, unsigned = true, outputBigint = true) {
        let numString = "0x";
        for (let i = 0; i < bits / 32; i += 1) {
            const uint32Str = this.readUint32().toString(16);
            numString += "0".repeat(8 - uint32Str.length) + uint32Str;
        }
        if (!unsigned && Number(numString.substring(0, 3)) >= 8) {
            // signed number and starts with bit 1 (negative number)
            return BigInt(numString) - BigInt("0x1" + "0".repeat(bits / 4));
        }
        const result = BigInt(numString);
        if (outputBigint)
            return result;
        if (result <= BigInt(Number.MAX_SAFE_INTEGER))
            return Number(result);
        return result.toString();
    }
    toString(nameOrCode = "M") {
        return new TextDecoder().decode(multibase.encode(nameOrCode, this.buffer));
    }
}
exports.VariableBlob = VariableBlob;
exports.default = VariableBlob;


/***/ }),

/***/ 696:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Wallet = void 0;
/**
 * The Wallet Class combines all the features of [[Signer]],
 * [[Contract]], and [[Provider]] classes.
 *
 * @example **How to send transactions**
 *
 * ```ts
 * (async () => {
 *   // define signer, provider, and contract
 *   const signer = Signer.fromSeed("my seed");
 *   const provider = new Provider("http://45.56.104.152:8080");
 *   const contract = new Contract({
 *     id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 *     entries: {
 *       transfer: {
 *         id: 0x62efa292,
 *         inputs: {
 *           type: [
 *             {
 *               name: "from",
 *               type: "string",
 *             },
 *             {
 *               name: "to",
 *               type: "string",
 *             },
 *             {
 *               name: "value",
 *               type: "uint64",
 *             },
 *           ],
 *         },
 *       },
 *       balance_of: {
 *         id: 0x15619248,
 *         inputs: { type: "string" },
 *         outputs: { type: "uint64" },
 *       },
 *     },
 *   });
 *
 *   // create a wallet with signer, provider and contract
 *   const wallet = new Wallet({ signer, provider, contract });
 *
 *   // encode a contract operation to make a transfer
 *   const opTransfer = wallet.encodeOperation({
 *     name: "transfer",
 *     args: {
 *       from: wallet.getAddress(),
 *       to: "bob",
 *       value: BigInt(1000),
 *     },
 *   });
 *
 *   // create a transaction
 *   const tx = await wallet.newTransaction({
 *     operations: [opTransfer],
 *   });
 *
 *   // sign and send transaction
 *   await wallet.signTransaction(tx);
 *   await wallet.sendTransaction(tx);
 * })();
 * ```
 *
 * @example **How to read contracts**
 * ```ts
 * (async () => {
 *   // define provider and contract
 *   const provider = new Provider("http://45.56.104.152:8080");
 *   const contract = new Contract({
 *     id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 *     entries: {
 *       transfer: {
 *         id: 0x62efa292,
 *         inputs: {
 *           type: [
 *             {
 *               name: "from",
 *               type: "string",
 *             },
 *             {
 *               name: "to",
 *               type: "string",
 *             },
 *             {
 *               name: "value",
 *               type: "uint64",
 *             },
 *           ],
 *         },
 *       },
 *       balance_of: {
 *         id: 0x15619248,
 *         inputs: { type: "string" },
 *         outputs: { type: "uint64" },
 *       },
 *     },
 *   });
 *
 *   // create a wallet with provider and contract (signer is optional)
 *   const wallet = new Wallet({ provider, contract });
 *
 *   // read the contract providing the name of the contract funtion
 *   // and its arguments
 *   const balance = await wallet.readContract({
 *     name: "balance_of",
 *     args: wallet.getAddress(),
 *   });
 *
 *   console.log(Number(balance) / 1e8);
 * })();
 * ```
 */
class Wallet {
    constructor(opts = {
        signer: undefined,
        contract: undefined,
        provider: undefined,
    }) {
        this.signer = opts.signer;
        this.contract = opts.contract;
        this.provider = opts.provider;
    }
    /**
     * Creates an unsigned transaction
     */
    async newTransaction(opts) {
        let nonce;
        if (opts.getNonce === false)
            nonce = 0;
        else {
            if (!this.provider)
                throw new Error("Cannot get the nonce because provider is undefined. To ignore this call use getNonce:false in the parameters");
            nonce = await this.getNonce(this.getAddress());
        }
        const resource_limit = opts.resource_limit === undefined ? 1000000 : opts.resource_limit;
        const operations = opts.operations ? opts.operations : [];
        return {
            active_data: {
                resource_limit,
                nonce,
                operations,
            },
        };
    }
    // Signer
    /**
     * See [[Signer.getAddress]]
     */
    getAddress() {
        if (!this.signer)
            throw new Error("Signer is undefined");
        return this.signer.getAddress();
    }
    /**
     * See [[Signer.signTransaction]]
     */
    async signTransaction(tx) {
        if (!this.signer)
            throw new Error("Signer is undefined");
        return this.signer.signTransaction(tx);
    }
    // Contract
    /**
     * See [[Contract.encodeOperation]]
     */
    encodeOperation(op) {
        if (!this.contract)
            throw new Error("Contract is undefined");
        return this.contract.encodeOperation(op);
    }
    /**
     * See [[Contract.decodeOperation]]
     */
    decodeOperation(op) {
        if (!this.contract)
            throw new Error("Contract is undefined");
        return this.contract.decodeOperation(op);
    }
    /**
     * See [[Contract.decodeResult]]
     */
    decodeResult(result, opName) {
        if (!this.contract)
            throw new Error("Contract is undefined");
        return this.contract.decodeResult(result, opName);
    }
    // Provider
    /**
     * See [[Provider.call]]
     */
    async call(method, params) {
        if (!this.provider)
            throw new Error("Provider is undefined");
        return this.provider.call(method, params);
    }
    /**
     * See [[Provider.getNonce]]
     */
    async getNonce(address) {
        if (!this.provider)
            throw new Error("Provider is undefined");
        return this.provider.getNonce(address);
    }
    /**
     * See [[Provider.sendTransaction]]
     */
    async sendTransaction(transaction) {
        if (!this.provider)
            throw new Error("Provider is undefined");
        return this.provider.sendTransaction(transaction);
    }
    /* async readContract(operation: EncodedOperation["value"]): Promise<{
      result: string;
      logs: string;
    }> {
      if (!this.provider) throw new Error("Provider is undefined");
      return this.provider.readContract(operation);
    } */
    // Provider + Contract
    /**
     * Call the RPC node to read a contract. The operation to read
     * must be in the decoded format (see [[DecodedOperation]]). This
     * function will encode the operation using the contract definition,
     * call the RPC node, and decode the result.
     *
     * @example
     * ```
     * const balance = await wallet.readContract({
     *   name: "balance_of",
     *   args: "126LgExvJrLDQBsxA1Ddur2VjXJkyAbG91",
     * });
     * ```
     */
    async readContract(operation) {
        if (!this.provider)
            throw new Error("Provider is undefined");
        const op = this.encodeOperation(operation);
        const { result } = await this.provider.readContract(op);
        return this.decodeResult(result, operation.name);
    }
}
exports.Wallet = Wallet;
exports.default = Wallet;


/***/ }),

/***/ 285:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.abiActiveData = exports.abiCallContractOperation = void 0;
/**
 * ABI of Call Contract Operation. This abi is used in the
 * definition of the Active Data ABI. See [[abiActiveData]]
 */
exports.abiCallContractOperation = {
    name: "koinos::protocol::call_contract_operation",
    type: [
        {
            name: "contract_id",
            type: "fixedblob",
            size: 20,
        },
        {
            name: "entry_point",
            type: "uint32",
        },
        {
            name: "args",
            type: "variableblob",
        },
        {
            name: "extensions",
            type: "unused_extension",
        },
    ],
};
/**
 * ABI of Active Data of a Transaction. This abi is used in the
 * [[Signer]] class to sign transactions.
 */
exports.abiActiveData = {
    name: "opaque_active_data",
    type: "opaque",
    subAbi: {
        name: "active_data",
        type: [
            {
                name: "resource_limit",
                type: "uint128",
            },
            {
                name: "nonce",
                type: "uint64",
            },
            {
                name: "operations",
                type: "vector",
                subAbi: {
                    name: "operation",
                    type: "variant",
                    variants: [
                        { type: "not implemented" /* reserved operation */ },
                        { type: "not implemented" /* nop operation */ },
                        { type: "not implemented" /* upload contract operation */ },
                        exports.abiCallContractOperation,
                        { type: "not implemented" /* set system call operation*/ },
                    ],
                },
            },
        ],
    },
};


/***/ }),

/***/ 738:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/*! koilib - MIT License (c) Julian Gonzalez (joticajulian@gmail.com) */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils = __importStar(__webpack_require__(593));
const Contract_1 = __webpack_require__(822);
const Multihash_1 = __webpack_require__(12);
const serializer = __importStar(__webpack_require__(825));
const VariableBlob_1 = __webpack_require__(737);
const Signer_1 = __webpack_require__(991);
const Provider_1 = __webpack_require__(635);
const Wallet_1 = __webpack_require__(696);
const abi = __importStar(__webpack_require__(285));
window.utils = utils;
window.Contract = Contract_1.Contract;
window.Multihash = Multihash_1.Multihash;
window.serializer = serializer;
window.Signer = Signer_1.Signer;
window.VariableBlob = VariableBlob_1.VariableBlob;
window.Wallet = Wallet_1.Wallet;
window.Provider = Provider_1.Provider;
window.abi = abi;


/***/ }),

/***/ 825:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deserialize = exports.serialize = void 0;
const VariableBlob_1 = __webpack_require__(737);
/**
 * Function to serialize data
 *
 * @example
 * ```ts
 * const abi = { type: "uint64" };
 * const vblob = serialize(5869, abi);
 * ```
 *
 * @example
 * ```ts
 * const abi = {
 *   type: [
 *     { name: "from",  type: "string" },
 *     { name: "to",    type: "string" },
 *     { name: "value", type: "uint64" },
 *   ],
 * };
 * const vblob = serialize({
 *   from: "alice",
 *   to: "bob",
 *   value: "123456",
 * }, abi);
 */
function serialize(data, abi) {
    const vb = new VariableBlob_1.VariableBlob();
    // vb.dataBuffer = {};
    // const aux = new VariableBlob();
    if (Array.isArray(abi.type)) {
        const _data = data;
        abi.type.forEach((key) => {
            const { buffer /*, dataBuffer */ } = serialize(_data[key.name], key);
            // vb.dataBuffer[key.name] = dataBuffer;
            vb.write(buffer);
        });
        vb.resetCursor();
        return vb;
    }
    switch (abi.type) {
        case "opaque": {
            if (!abi.subAbi)
                throw new Error(`subAbi undefined in ${JSON.stringify(abi)}`);
            const native = serialize(data, abi.subAbi);
            vb.serializeBuffer(native.buffer);
            // vb.dataBuffer.native = native.dataBuffer;
            break;
        }
        case "vector": {
            if (!abi.subAbi)
                throw new Error(`subAbi undefined in ${JSON.stringify(abi)}`);
            if (!Array.isArray(data))
                throw new Error(`Invalid data, array expected. Received: ${data}`);
            vb.serializeVarint(data.length);
            // aux.serializeVarint(data.length); vb.dataBuffer.size = aux.buffer.toString();
            // vb.dataBuffer.items = [];
            if (!abi.subAbi)
                throw new Error(`subAbi undefined in ${JSON.stringify(abi)}`);
            data.forEach((item) => {
                const itemSerialized = serialize(item, abi.subAbi);
                vb.write(itemSerialized.buffer);
                // vb.dataBuffer.items.push(itemSerialized.dataBuffer);
            });
            break;
        }
        case "variant": {
            const _data = data;
            if (!abi.variants)
                throw new Error("Abi variants are not defined");
            const variantId = abi.variants.findIndex((v) => v.name === _data.type);
            if (variantId < 0)
                throw new Error(`Variant ${_data.type} not found`);
            if (!abi.variants[variantId])
                throw new Error(`abi undefined in ${JSON.stringify(abi)} for id ${variantId}`);
            vb.serializeVarint(variantId);
            // aux.serializeVarint(variantId); vb.dataBuffer.variantId = aux.buffer.toString();
            const variantSerialized = serialize(_data.value, abi.variants[variantId]);
            vb.write(variantSerialized.buffer);
            // vb.dataBuffer.variant = variantSerialized.dataBuffer;
            break;
        }
        case "variableblob": {
            vb.serializeBuffer(data);
            // aux.serializeBuffer(data); vb.dataBuffer.variableblob = aux.buffer.toString();
            break;
        }
        case "fixedblob": {
            vb.write(data, abi.size);
            // aux.write(data, abi.size); vb.dataBuffer.fixedblob = aux.buffer.toString();
            break;
        }
        case "string": {
            vb.serializeString(data);
            // aux.serializeString(data); vb.dataBuffer.string = aux.buffer.toString();
            break;
        }
        case "varint": {
            vb.serializeVarint(data);
            // aux.serializeVarint(data); vb.dataBuffer.varint = aux.buffer.toString();
            break;
        }
        case "uint8": {
            vb.writeUint8(data);
            // aux.writeUint8(data); vb.dataBuffer.uint8 = aux.buffer.toString();
            break;
        }
        case "uint16": {
            vb.writeUint16(data);
            // aux.writeUint16(data); vb.dataBuffer.uint16 = aux.buffer.toString();
            break;
        }
        case "uint32": {
            vb.writeUint32(data);
            // aux.writeUint32(data); vb.dataBuffer.uint32 = aux.buffer.toString();
            break;
        }
        case "uint64": {
            vb.serializeBigint(data, 64);
            // aux.serializeBigint(data, 64); vb.dataBuffer.uint64 = aux.buffer.toString();
            break;
        }
        case "uint128": {
            vb.serializeBigint(data, 128);
            // aux.serializeBigint(data, 128); vb.dataBuffer.uint128 = aux.buffer.toString();
            break;
        }
        case "uint160": {
            vb.serializeBigint(data, 160);
            // aux.serializeBigint(data, 160); vb.dataBuffer.uint160 = aux.buffer.toString();
            break;
        }
        case "uint256": {
            vb.serializeBigint(data, 256);
            // aux.serializeBigint(data, 256); vb.dataBuffer.uint256 = aux.buffer.toString();
            break;
        }
        case "int8": {
            vb.writeInt8(data);
            // aux.writeInt8(data); vb.dataBuffer.int8 = aux.buffer.toString();
            break;
        }
        case "int16": {
            vb.writeInt16(data);
            // aux.writeInt16(data); vb.dataBuffer.int16 = aux.buffer.toString();
            break;
        }
        case "int32": {
            vb.writeInt32(data);
            // aux.writeInt32(data); vb.dataBuffer.int32 = aux.buffer.toString();
            break;
        }
        case "int64": {
            vb.serializeBigint(data, 64);
            // aux.serializeBigint(data, 64); vb.dataBuffer.int64 = aux.buffer.toString();
            break;
        }
        case "int128": {
            vb.serializeBigint(data, 128);
            // aux.serializeBigint(data, 128); vb.dataBuffer.int128 = aux.buffer.toString();
            break;
        }
        case "int160": {
            vb.serializeBigint(data, 160);
            // aux.serializeBigint(data, 160); vb.dataBuffer.int160 = aux.buffer.toString();
            break;
        }
        case "int256": {
            vb.serializeBigint(data, 256);
            // aux.serializeBigint(data, 256); vb.dataBuffer.int256 = aux.buffer.toString();
            break;
        }
        case "unused_extension":
            break;
        default: {
            throw new Error(`Unknown type ${abi.type}`);
        }
    }
    return vb;
}
exports.serialize = serialize;
/**
 * Function to deserialize data
 *
 * @example
 * ```ts
 * const vblob = new VariableBlob(
 *   new Uint8Array([0, 0, 0, 0, 0, 0, 22, 237])
 * );
 * const abi = { type: "uint64" };
 * const number = deserialize(vblob, abi);
 * ```
 */
function deserialize(buffer, abi) {
    const vb = typeof buffer === "string" ? new VariableBlob_1.VariableBlob(buffer) : buffer;
    if (Array.isArray(abi.type)) {
        const data = {};
        abi.type.forEach((key) => {
            data[key.name] = deserialize(vb, key);
        });
        return data;
    }
    switch (abi.type) {
        case "opaque": {
            if (!abi.subAbi)
                throw new Error("subAbi not defined");
            const blob = vb.deserializeBuffer();
            const subVb = new VariableBlob_1.VariableBlob(blob);
            return deserialize(subVb, abi.subAbi);
        }
        case "vector": {
            const size = vb.deserializeVarint();
            const data = [];
            for (let i = 0; i < size; i += 1) {
                const item = deserialize(vb, abi.subAbi);
                data.push(item);
            }
        }
        case "variant": {
            const variantId = vb.deserializeVarint();
            const abiVariant = abi.variants[variantId];
            const value = deserialize(vb, abiVariant);
            const type = abiVariant.name;
            return { type, value };
        }
        case "variableblob":
            return vb.deserializeBuffer(true);
        case "fixedblob":
            return vb.read(abi.size, true);
        case "string":
            return vb.deserializeString();
        case "varint":
            return vb.deserializeVarint();
        case "uint8":
            return vb.readUint8();
        case "uint16":
            return vb.readUint16();
        case "uint32":
            return vb.readUint32();
        case "uint64":
            return vb.deserializeBigint(64, true);
        case "uint128":
            return vb.deserializeBigint(128, true);
        case "uint160":
            return vb.deserializeBigint(160, true);
        case "uint256":
            return vb.deserializeBigint(256, true);
        case "int8":
            return vb.readInt8();
        case "int16":
            return vb.readInt16();
        case "int32":
            return vb.readInt32();
        case "int64":
            return vb.deserializeBigint(64, false);
        case "int128":
            return vb.deserializeBigint(128, false);
        case "int160":
            return vb.deserializeBigint(160, false);
        case "int256":
            return vb.deserializeBigint(256, false);
        case "unused_extension":
            return {};
        default:
            throw new Error(`Unknown type ${abi.type}`);
    }
}
exports.deserialize = deserialize;


/***/ }),

/***/ 593:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bitcoinAddress = exports.bitcoinDecode = exports.copyUint8Array = exports.bitcoinEncode = exports.decodeBase58 = exports.encodeBase58 = exports.toHexString = exports.toUint8Array = void 0;
const multibase = __importStar(__webpack_require__(957));
const js_sha256_1 = __webpack_require__(23);
const noble_ripemd160_1 = __importDefault(__webpack_require__(389));
/**
 * Converts an hex string to Uint8Array
 */
function toUint8Array(hex) {
    const pairs = hex.match(/[\dA-F]{2}/gi);
    if (!pairs)
        throw new Error("Invalid hex");
    return new Uint8Array(pairs.map((s) => parseInt(s, 16)) // convert to integers
    );
}
exports.toUint8Array = toUint8Array;
/**
 * Converts Uint8Array to hex string
 */
function toHexString(buffer) {
    return Array.from(buffer)
        .map((n) => `0${Number(n).toString(16)}`.slice(-2))
        .join("");
}
exports.toHexString = toHexString;
/**
 * Encodes an Uint8Array in base58
 */
function encodeBase58(buffer) {
    return new TextDecoder().decode(multibase.encode("z", buffer)).slice(1);
}
exports.encodeBase58 = encodeBase58;
/**
 * Decodes a buffer formatted in base58
 */
function decodeBase58(bs58) {
    return multibase.decode(`z${bs58}`);
}
exports.decodeBase58 = decodeBase58;
/**
 * Encodes a public or private key in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
function bitcoinEncode(buffer, type, compressed = false) {
    let bufferCheck;
    let prefixBuffer;
    let offsetChecksum;
    if (type === "public") {
        bufferCheck = new Uint8Array(25);
        prefixBuffer = new Uint8Array(21);
        bufferCheck[0] = 0;
        prefixBuffer[0] = 0;
        offsetChecksum = 21;
    }
    else {
        if (compressed) {
            bufferCheck = new Uint8Array(38);
            prefixBuffer = new Uint8Array(34);
            offsetChecksum = 34;
            bufferCheck[33] = 1;
            prefixBuffer[33] = 1;
        }
        else {
            bufferCheck = new Uint8Array(37);
            prefixBuffer = new Uint8Array(33);
            offsetChecksum = 33;
        }
        bufferCheck[0] = 128;
        prefixBuffer[0] = 128;
    }
    prefixBuffer.set(buffer, 1);
    const firstHash = js_sha256_1.sha256(prefixBuffer);
    const doubleHash = js_sha256_1.sha256(toUint8Array(firstHash));
    const checksum = toUint8Array(doubleHash.substring(0, 8));
    bufferCheck.set(buffer, 1);
    bufferCheck.set(checksum, offsetChecksum);
    return encodeBase58(bufferCheck);
}
exports.bitcoinEncode = bitcoinEncode;
function copyUint8Array(source, target, targetStart, sourceStart, sourceEnd) {
    for (let cursorSource = sourceStart; cursorSource < sourceEnd; cursorSource += 1) {
        const cursorTarget = targetStart + cursorSource - sourceStart;
        target[cursorTarget] = source[cursorSource];
    }
}
exports.copyUint8Array = copyUint8Array;
/**
 * Decodes a public or private key formatted in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
function bitcoinDecode(value) {
    const buffer = decodeBase58(value);
    const privateKey = new Uint8Array(32);
    const checksum = new Uint8Array(4);
    // const prefix = buffer[0];
    copyUint8Array(buffer, privateKey, 0, 1, 33);
    if (value[0] !== "5") {
        // compressed
        copyUint8Array(buffer, checksum, 0, 34, 38);
    }
    else {
        copyUint8Array(buffer, checksum, 0, 33, 37);
    }
    // TODO: verify prefix and checksum
    return privateKey;
}
exports.bitcoinDecode = bitcoinDecode;
/**
 * Computes a bitcoin address, which is the format used in Koinos
 *
 * address = bitcoinEncode( ripemd160 ( sha256 ( publicKey ) ) )
 */
function bitcoinAddress(publicKey, compressed = false) {
    const hash = js_sha256_1.sha256(publicKey);
    const hash160 = noble_ripemd160_1.default(toUint8Array(hash));
    return bitcoinEncode(hash160, "public", compressed);
}
exports.bitcoinAddress = bitcoinAddress;


/***/ }),

/***/ 370:
/***/ (() => {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd options */
/******/ 	(() => {
/******/ 		__webpack_require__.amdO = {};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(738);
/******/ 	
/******/ })()
;