var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var extend = require('xtend');
var mime = require('mime');
var nodePath = require('path');

var defaultOptions = {
  path: '.',
  port: 8888,
  hostname: undefined,
  fallback: undefined,
  serveStaticConfig: {
    redirect: false
  },
  verbose: true
};

module.exports = {
  create: create
};

function create (options) {

  // Used to store mapping rules in object fallback mode.
  var mappingRules;

  options = extend({}, defaultOptions, options);

  var serveStaticHandler = serveStatic(
    options.path,
    options.serveStaticConfig
  );

  var app = connect()
    .use(serveStaticHandler)
  ;

  if (options.fallback) {
    switch (typeof options.fallback) {
      case 'string':
        app.use(urlFallbackHandler);
        break;
      case 'object':
        app.use(objectFallbackHandler);
        break;
      case 'function':
        app.use(functionFallbackHandler);
        break;
    }
  }

  var server = http.createServer(app);

  server.on('error', function (exception) {
    if ('EADDRINUSE' == exception.code) {
      log('Requested port is busy, retrying...');
      setTimeout(function () {
        restart();
      }, 3000);
    }
  });

  function restart (callback) {
    stop(function () {
      start(callback);
    });
  }

  function stop (callback) {
    server.close(callback);
  }

  function start (callback) {
    server.listen(options.port, options.hostname, undefined, function () {
      log('SPA server is now accepting requests on port: ' + options.port);
      if ('function' === typeof callback) {
        callback();
      }
    });
  }

  function urlFallbackHandler(request, response, next) {
    request.url = options.fallback;
    serveStaticHandler.apply(this, arguments);
  }

  function objectFallbackHandler(request, response, next) {

    var requestMimeType = getMimeTypeFromRequest(request);

    var url = mapMimeTypeToUrl(requestMimeType);

    if (url) {
      request.url = url;
      serveStaticHandler.apply(this, arguments);
    } else {
      next();
    }

    /**
     * Detects mime type from request.
     */
    function getMimeTypeFromRequest (request) {
      var requestMimeType = mime.lookup(request.url, 'not-found');
      if ('not-found' == requestMimeType) {
        // @todo: check accept header
        requestMimeType = 'text/html';
      }
      return requestMimeType;
    }

    /**
     * Looks for mime type in the registry.
     */
    function mapMimeTypeToUrl (requestMimeType) {

      // Making sure mapping rules are initialized.
      if ('object' !== typeof mappingRules) {
        initializeMappingRules();
      }

      // When failed to detect mime type from request.
      if (null === requestMimeType) {
        return mappingRules.any;
      }

      // First, looking for explicit mappings.
      for (var mimeType in mappingRules.explicit) {
        if (!mappingRules.explicit.hasOwnProperty(mimeType)) {
          continue;
        }
        if (mimeType == requestMimeType) {
          return mappingRules.explicit[mimeType];
        }
      }

      // Next, looking for top types.
      var requestTopType = requestMimeType.split('/').shift();
      for (var topType in mappingRules.topType) {
        if (!mappingRules.topType.hasOwnProperty(topType)) {
          continue;
        }
        if (topType == requestTopType) {
          return mappingRules.topType[topType];
        }
      }

      // Falling back to «any» if possible.
      return mappingRules.any;

    }

    /**
     * Parses fallback configuration object and builds optimized mapping rules
     * for further use.
     */
    function initializeMappingRules () {

      mappingRules = {
        explicit: [],
        topType: [],
        any: null
      };

      for (var mimeType in options.fallback) {
        if (!options.fallback.hasOwnProperty(mimeType)) {
          continue;
        }
        var url = options.fallback[mimeType];
        if ('*' === mimeType) {
          mappingRules.any = url;
        } else {
          var parts = mimeType.split('/');
          if (2 !== parts.length) {
            throw new Error('Invalid mime type specifier provided: "' + mimeType + '"');
          }
          if ('*' === parts[1]) {
            var topType = parts[0];
            mappingRules.topType[topType] = url;
          } else {
            mappingRules.explicit[mimeType] = url;
          }
        }
      }
    }

  }

  function functionFallbackHandler(request, response, next) {
    var url = options.fallback(request, response);
    if (url) {
      request.url = url;
      serveStaticHandler.apply(this, arguments);
    } else {
      next();
    }
  }

  function log (message) {
    if (options.verbose) {
      console.log(message);
    }
  }

  return {
    start: start,
    stop: stop,
    restart: restart
  };

}
