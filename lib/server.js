var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var extend = require('xtend');

var defaultOptions = {
  path: '.',
  fallbackUrl: '/index.html',
  port: 8888,
  serveStaticConfig: {
    index: false,
    redirect: false
  }
};

module.exports = function (options) {

  options = extend({}, defaultOptions, options);

  var serverStaticHandler = serveStatic(
    options.path,
    options.serveStaticConfig
  );

  var app = connect()
    .use(serverStaticHandler)
    .use(fallbackHandler)
  ;

  http
    .createServer(app)
    .listen(options.port)
  ;

  console.log('SPA server is now accepting requests on port: ' + options.port);

  function fallbackHandler(request, response, next) {
    request.url = options.fallbackUrl;
    serverStaticHandler.apply(this, arguments);
  }

};
