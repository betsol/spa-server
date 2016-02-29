# Node SPA Server

[![Build Status](https://travis-ci.org/betsol/spa-server.svg?branch=develop)](https://travis-ci.org/betsol/spa-server)
<a href="#with-gulp" title="Ready to be used with Gulp">
    <img alt="Gulp ready!" src="https://img.shields.io/badge/gulp-ready-brightgreen.svg">
</a>

Extensible Node Web Server based on top of [Connect][lib-connect] and
[serve-static][lib-serve-static] to help you run your SPA's
(Single Page Applications).

Just point it to your web root directory and it will serve all your static
goodness right away! However, when missing URL is requested it performs
smart [fallback lookup](#fallback-lookup) (fully configurable).

Also you can use your own [custom middleware](#custom-middleware) with it
(or a third-party).

Can be [used with Gulp](#with-gulp).


## Usage

```javascript

var serverFactory = require('spa-server');

var server = serverFactory.create({
  path: './build',
  port: 80,
  fallback: fallbackConfig
});

server.start();

```

Please see [configuration section](#configuration) for different fallback
configurations.


### With Gulp

This module can be invoked inside of a Gulp task for convenience.

```javascript

var serverFactory = require('spa-server');

gulp.task('webserver', function () {
  var server = serverFactory.create({
    path: './build',
    port: 80,
    fallback: fallbackConfig
  });

  server.start();
});
```

Just add code above to your `gulpfile.js` and run `gulp webserver` after that.

Please see [configuration section](#configuration) for different fallback
configurations.


## Installation

It's exactly like you've already guessed:

`npm install --save spa-server` or `npm install --save-dev spa-server`.


## Configuration

| Option             | Type                               | Default                                     | Description
|--------------------|------------------------------------|---------------------------------------------|-------------
| path               | `string`                           | `'.'`                                       | Path to your web root
| hostname           | `string`                           | `undefined`                                 | Hostname to listen for, *any* when not set
| port               | `integer`                          | `8888`                                      | Listening port
| fallback           | `string` or `object` or `function` | `undefined`                                 | Fallback lookup configuration, [see below](#fallback-lookup)
| serveStaticConfig  | `object`                           | [See the code][serve-static-default-config] | Configuration object for serve-static middleware, see it's [options][lib-serve-static-options]
| middleware         | `array`                            | `[]`                                        | List of your custom middleware 


### Fallback Lookup

You can configure fallback lookup using `fallback` configuration property.
By default, lookup functionality is disabled.


#### Single URL

If you will set `fallback` option to a **string** value, e.g.: `/index.html`,
it will serve the specified URL for all missing (404) requests.
You can point server to your root application file that way.

```javascript

var serverFactory = require('spa-server');

var server = serverFactory.create({
  path: './build',
  port: 80,
  fallback: '/application.html'
});

server.start();

```


#### Smart lookup

However, it's OK to use single URL fallback, but it could be unfair to some
static resources, cause it will serve `text/html` even if `missing.js`
file was requested.

To counter this, the **smart** fallback lookup was introduced. With it,
you can specify fallback URL for each individual mime type. The server
will do it's best to determine request's mime type by examining it's headers
and file extension (if present in URL).

```javascript

var serverFactory = require('spa-server');

var server = serverFactory.create({
  path: './build',
  port: 80,
  fallback: {
    'text/html' : '/application.html',
    'image/*'   : '/images/default.png',
    '*'         : '/404.html'
  }
});

server.start();

```

This configuration will serve `application.html` file for every missing
HTML request and will serve `default.png` for every missing image.
The `404.html` will be served for all other missing requests, e.g. `missing.js`.

Possible mime type specifiers are:

- `'{type}/{subtype}'` — matches specific type and subtype
- `'{type}/*'` — matches all subtypes of specified type
- `'*'` — matches everything

Fallback filter will process the specified rules trying to match most explicit
ones first and least explicit later. The order doesn't matters, but is recommended
for readability.

We are using [node mime][lib-mime] module internally to map filename extensions
to mime types. You can also use it to specify explicit mime types,
for better stability.

```javascript

var serverFactory = require('spa-server');
var mime = require('mime');

var server = serverFactory.create({
  path: './build',
  port: 80,
  fallback: {
    mime.lookup('html') : '/application.html',
    mime.lookup('js') : '/js/default.js'
  }
});

server.start();

```


#### Handler function

And for ultimate control of the fallback filter you can pass a **function**
of your own! It will receive the standard
[request](https://nodejs.org/api/http.html#http_http_incomingmessage) and
[response](https://nodejs.org/api/http.html#http_class_http_serverresponse)
objects and will need to return fallback URL.
You can also return `null` to fallback to default 404 page.

```javascript

var serverFactory = require('spa-server');

var matcher = new RegExp('\\.html?$');

var server = serverFactory.create({
  path: './build',
  port: 80,
  fallback: function (request, response) {
    // For all missing HTML files.
    if (matcher.test(request.url)) {
      // Falling back to main application file.
      return '/application.html';
    }
    // Falling back to default server 404 page.
    return null;
  }
});

server.start();

```


### Custom middleware

You can pass list of your own middleware via `middleware` configuration option,
all passed middleware will be added to underlying Connect's instance. With this
option you can take full control of the webserver.

Each element of the `middleware` option should be either a function or an object.


#### Middleware as a function

All `function` elements from the `middleware` list will be added before the
serve-static and built-in fallback handlers to the stack of Connect's middleware.

```javascript

var serverFactory = require('spa-server');
var favicon = require('serve-favicon');

var server = serverFactory.create({
  path: './build',
  port: 80,
  middleware: [
    // Do-nothing middleware.
    function (request, response, next) {
      next();
    },
    // Adding custom header.
    function (request, response, next) {
      response.addHeader('X-My-Custom-Header', 'Content');
      next();
    },
    // Using third-party middleware.
    favicon(__dirname + '/public/favicon.ico')
  ]
});

server.start();

```


#### Middleware as an object

Sometimes it's not enough to add middleware just before the built-in handlers.
The are situations where you want to add custom middleware before the fallback
handler, but after the serve-static middleware. We are providing a very powerful
mechanism to achieve this.

You can add an object to the `middleware` list to not only provide the custom function,
but to specify where this function should be placed in the Connect's middleware stack.

The following keys are supported in the object:
 
- `middleware` — your custom middleware function
- `before` / `after` — name of the built-in middleware that your function will be added before or after (use only one of them at the same time)

The following position specifier's values are possible:

- `$start` — meta-value to define start of the stack
- `serve-static` — middleware to serve static content (will not call next middleware if content is found)
- `fallback` — middleware with fallback functionality
- `$end` — meta-value to define end of the stack

```javascript

var serverFactory = require('spa-server');
var favicon = require('serve-favicon');

var server = serverFactory.create({
  path: './build',
  port: 80,
  middleware: [
  
    // Will be added to the top of the stack.
    {
      middleware: firstMiddleware,
      before: '$start'
    },

    // Without position specifier,
    // will be added to the top of the stack.
    {
      middleware: myMiddleware
    },
    
    // The same as two above, but even shorter.
    myMiddleware,
    
    // Will be added after serve-static.
    {
      middleware: afterServeStaticMiddleware,
      after: 'serve-static'
    },
    
    // Will be added before fallback handler.
    {
      middleware: beforeFallbackHandler,
      before: 'fallback'
    },
    
    // Will be added to the end of the stack.
    {
      middleware: finalMiddleware,
      after: '$end'
    },

  ]
});

server.start();

```

**Notice:** if you place your middleware after the `$end` it still will not
guarantee that it will be executed. Position specifier only affect the placement
of your middleware in the Connect's stack.


## Changelog

Please see the [complete changelog][changelog] for list of changes.


## Contributors

This library was made possible by [it's contributors][contributors].


## Feedback

If you have found a bug or have another issue with the library —
please [create an issue][new-issue].

If you have a question regarding the library or it's integration with your project —
consider asking a question at [StackOverflow][so-ask] and sending me a
link via [E-Mail][email]. I will be glad to help.

Have any ideas or propositions? Feel free to contact me by [E-Mail][email].

Cheers!


## License

The MIT License (MIT)

Copyright (c) 2015—2016 Slava Fomin II, BETTER SOLUTIONS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


  [changelog]: changelog.md
  [contributors]: https://github.com/betsol/spa-server/graphs/contributors
  [so-ask]: http://stackoverflow.com/questions/ask?tags=node.js,connect
  [email]: mailto:s.fomin@betsol.ru
  [new-issue]: https://github.com/betsol/spa-server/issues/new
  [lib-connect]: https://github.com/senchalabs/connect
  [lib-serve-static]: https://github.com/expressjs/serve-static
  [lib-serve-static-options]: https://github.com/expressjs/serve-static#options
  [lib-mime]: https://github.com/broofa/node-mime
  [serve-static-default-config]: /lib/server.js#L10-L13
