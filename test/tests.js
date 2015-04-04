var serverFactory = require('../lib/server.js');
var extend = require('xtend');
var expect = require('expect.js');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var defaultServerConfig = {
  path: __dirname + '/webroot',
  port: 8888,
  hostname: 'localhost',
  verbose: false
};

var defaultImageSize = getFileSize(__dirname + '/webroot/images/lockness.jpg');

describe('Server', function () {

  var server, config;

  context('With url fallback handler', function () {

    before(function (done) {
      var result = startServerWithConfig({
        fallback: '/application.html'
      }, done);
      server = result.server;
      config = result.config;
    });

    after(function (done) {
      server.stop(done);
    });

    it('Serves application HTML when missing URL is requested', function (done) {
      testApplicationHtml('/missing', done);
    });

  });

  context('With object fallback handler', function () {

    before(function (done) {
      var result = startServerWithConfig({
        fallback: {
          'text/html' : '/application.html',
          'image/*'   : '/images/lockness.jpg',
          '*'         : '/404.html'
        }
      }, done);
      server = result.server;
      config = result.config;
    });

    after(function (done) {
      server.stop(done);
    });

    it('Serves application HTML when missing HTML file is requested', function (done) {
      testApplicationHtml('/missing.html', done);
    });

    it('Serves application HTML when missing URL is requested', function (done) {
      testApplicationHtml('/missing', done);
    });

    it('Serves default image when missing image is requested', function (done) {
      testDefaultImage('/missing.jpg', done);
    });

    it('Serves 404 page when missing resource is requested', function (done) {
      test404Page('/missing.json', done);
    });

  });

  context('With function fallback handler', function () {

    var matcher = new RegExp('\\.html?$');

    before(function (done) {
      var result = startServerWithConfig({
        fallback: function (request, response) {

          // For all missing HTML files.
          if (matcher.test(request.url)) {
            // Falling back to main application file.
            return '/application.html';
          }
          // Falling back to default server 404 page.
          return null;
        }
      }, done);
      server = result.server;
      config = result.config;
    });

    after(function (done) {
      server.stop(done);
    });

    it('Serves application HTML when missing HTML file is requested', function (done) {
      testApplicationHtml('/missing.html', done);
    });

  });

  context('With custom middleware', function () {
    
    var middleware = [
      ['beforeStartOne',    'before', '$start'],
      ['beforeStartTwo',    'before', '$start'],
      ['afterStartOne',     'after',  '$start'],
      ['afterStartTwo',     'after',  '$start'],

      ['beforeStaticOne',   'before', 'serve-static'],
      ['beforeStaticTwo',   'before', 'serve-static'],
      ['afterStaticOne',    'after',  'serve-static'],
      ['afterStaticTwo',    'after',  'serve-static'],

      ['beforeFallbackOne', 'before', 'fallback'],
      ['beforeFallbackTwo', 'before', 'fallback'],
      ['afterFallbackOne',  'after',  'fallback'],
      ['afterFallbackTwo',  'after',  'fallback'],

      ['beforeEndOne',      'before', '$end'],
      ['beforeEndTwo',      'before', '$end'],
      ['afterEndOne',       'after',  '$end'],
      ['afterEndTwo',       'after',  '$end']
    ];

    var calls = [];

    before(function (done) {
      var result = startServerWithConfig(buildConfig(), done);
      server = result.server;
      config = result.config;
    });

    after(function (done) {
      server.stop(done);
    });

    it('supports it', function (done) {

      sendRequest('/missing', function (response, body) {
        for (var i = 0; i < middleware.length; i++) {
          var item = middleware[i];
          expect(calls[i]).to.be(item[0]);
        }
        done();
      });

    });

    function buildConfig () {
      var config = {};
      config.middleware = [];
      for (var i = 0; i < middleware.length; i++) {
        var item = middleware[i];
        var name = item[0];
        var specifier = item[1];
        var value = item[2];
        var configItem = {};
        configItem.middleware = middlewareFactory(name);
        configItem[specifier] = value;
        config.middleware.push(configItem);
      }
      return config;
    }

    function middlewareFactory (name) {
      return function (request, response, next) {
        calls.push(name);
        next();
      };
    }

  });

  function sendRequest (url, callback) {
    url = 'http://' + defaultServerConfig.hostname + ':' + defaultServerConfig.port + url;
    request.get(url, function (error, response, body) {
      callback(response, body);
    });
  }

  function sendRequestHtml (url, callback) {
    sendRequest(url, function (response, body) {
      var $ = cheerio.load(body);
      callback(response, body, $);
    });
  }

  function testHtml (response) {
    expect(response.statusCode).to.be(200);
    testContentType(response, 'text/html');
  }

  function testApplicationHtml (url, callback) {
    sendRequestHtml(url, function (response, body, $) {
      testHtml(response);
      expect($('title').text()).to.be('This is the application.html file!');
      callback();
    });
  }

  function test404Page (url, callback) {
    sendRequestHtml(url, function (response, body, $) {
      testHtml(response);
      expect($('title').text()).to.be('Resource is not found!');
      callback();
    });
  }

  function testDefaultImage (url, callback) {
    sendRequest(url, function (response, body) {
      testJpg(response);
      expect(response.headers['content-length']).to.eql(defaultImageSize);
      callback();
    });
  }

  function testJpg (response) {
    expect(response.statusCode).to.be(200);
    testContentType(response, 'image/jpeg');
  }

  function testJs (response) {
    expect(response.statusCode).to.be(200);
    testContentType(response, 'application/javascript');
  }

  function testJson (response) {
    expect(response.statusCode).to.be(200);
    testContentType(response, 'application/json');
  }

  function testMissingUrl (url, callback) {
    sendRequest(url, function (response, body) {
      expect(response.statusCode).to.be(404);
      callback();
    });
  }

  function testContentType (response, expectedType) {
    expect(response.headers).to.have.property('content-type');
    var type = response.headers['content-type'];
    expect(type).to.match(new RegExp('^' + expectedType + '(;|$)'));
  }

});

function startServerWithConfig (config, callback) {
  var actualConfig = extend({}, defaultServerConfig, config);
  var server = serverFactory.create(actualConfig);
  server.start(callback);
  return {
    server: server,
    config: actualConfig
  };
}

function getFileSize (filename) {
  var stats = fs.statSync(filename);
  return stats['size'];
}
