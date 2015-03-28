# Node SPA Server

<a href="#with-gulp" title="Ready to be used with Gulp">
    <img alt="Gulp ready!" src="https://img.shields.io/badge/gulp-ready-brightgreen.svg">
</a>

Extremely simple Node Web Server based on top of [Connect][lib-connect] and
[serve-static][lib-serve-static] to help you run your SPA's
(Single Page Applications).

Just point it to your web root directory and it will serve all your static
goodness right away! However, when missing URL is requested it performs
smart fallback lookup (fully configurable).


## Usage

Please see [example #1](#example-1).


### With Gulp

This module can be invoked inside of a Gulp task for convenience.
Please see [example #1B](#example-1b).


## Installation

It's exactly like you've already guessed:

`npm install --save-dev spa-server`


## Configuration

| Option             | Type                               | Default                                     | Description
|--------------------|------------------------------------|---------------------------------------------|-------------
| path               | `string`                           | `'.'`                                       | Path to your web root
| hostname           | `string`                           | `undefined`                                 | Hostname to listen for, *any* when not set
| port               | `integer`                          | `8888`                                      | Listening port
| fallback           | `string` or `object` or `function` | `undefined`                                 | Fallback lookup configuration, [see below](#fallback-lookup)
| serveStaticConfig  | `object`                           | [See the code][serve-static-default-config] | Configuration object for serve-static middleware, see it's [options][lib-serve-static-options]


### Fallback Lookup

You can configure fallback lookup using `fallback` configuration property.
By default, lookup functionality is disabled.

If you will set `fallback` option to a **string** value, e.g.: `/index.html`,
it will serve the specified URL for all missing (404) requests.
You can point server to your root application file that way.
Please see [example #1](#example-1).

However, it's a valid solution, but it's not very fair to some static resources,
cause it will serve `text/html` even if `missing.js` file was requested.

To counter this, the **smart** fallback lookup was introduced. With it,
you can specify fallback URL for each individual mime type. The server
will do it's best to determine request's mime type by examining it's headers
and file extension (if present in URL). Please see [example #2](#example-2).

Possible mime type specifiers are:

- `'{type}/{subtype}'` — matches specific type and subtype
- `'{type}/*'` — matches all subtypes of specified type
- `'*'` — matches everything

Fallback filter will process the specified rules trying to match most explicit
ones first and least explicit later. The order doesn't matters, but is recommended
for readability.

We are using [node mime][lib-mime] module internally to map filename extensions
to mime types. You can also use it to specify explicit mime types,
for better stability. Please see [example #2B](#example-2b).

And for ultimate control of the fallback filter you can pass a **function**
of your own! It will receive the standard
[request](https://nodejs.org/api/http.html#http_http_incomingmessage) and
[response](https://nodejs.org/api/http.html#http_class_http_serverresponse)
objects and will need to return fallback URL.
You can also return `null` to fallback to default 404 page.
Please see [example #3](#example-3).


## Examples


### Example 1

```javascript

var serverFactory = require('spa-server');

var server = serverFactory.create({
  path: './build',
  port: 80,
  fallback: '/application.html'
});

server.start();

```


### Example 1B

You can use this module inside of Gulp task for your convenience.

```javascript

var serverFactory = require('spa-server');

gulp.task('webserver', function () {
  var server = serverFactory.create({
    path: './build',
    port: 80,
    fallback: '/application.html'
  });

  server.start();
});
```

Just add code above to your `gulpfile.js` and run `gulp webserver` after that.


### Example 2

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


### Example 2B

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


### Example 3

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


## Feedback

If you have found a bug or have another issue with the library - please [create an issue][new-issue] in this GitHub repository.

If you have a question - file it with [StackOverflow][so-ask] and send me a
link to [s.fomin@betsol.ru][email]. I will be glad to help.

Have any ideas or propositions? Feel free to contact me by [E-Mail][email].

Cheers!


## License

The MIT License (MIT)

Copyright (c) 2015 Slava Fomin II

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


  [so-ask]: http://stackoverflow.com/questions/ask?tags=node.js,connect
  [email]: mailto:s.fomin@betsol.ru
  [new-issue]: https://github.com/betsol/spa-server/issues/new
  [lib-connect]: https://github.com/senchalabs/connect
  [lib-serve-static]: https://github.com/expressjs/serve-static
  [lib-serve-static-options]: https://github.com/expressjs/serve-static#options
  [lib-mime]: https://github.com/broofa/node-mime
  [serve-static-default-config]: /lib/server.js#L10-L13
