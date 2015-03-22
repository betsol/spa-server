# Node SPA Server

<a href="#with-gulp" title="Ready to be used with Gulp">
    <img alt="Gulp ready!" src="https://img.shields.io/badge/gulp-ready-brightgreen.svg">
</a>

Extremely simple Node Web Server based on top of [Connect][lib-connect] and
[serve-static][lib-serve-static] to help you run your SPA's
(Single Page Applications).

Just point it to your web root directory and it will serve all your static
goodness right away! However, when missing URL is requested it returns resource
from fallback URL (e.g. `/index.html`). Make sure to handle 404's in your SPA though.


## Usage

```javascript
var spaServer = require('spa-server');

spaServer({
  path: './build',
  port: 1337,
  fallbackUrl: '/application.html'
});
```

### With Gulp

This module can be invoked inside of a Gulp task for convenience:

```javascript
gulp.task('webserver', function () {
  spaServer({
    path: './build',
    port: 8888,
    fallbackUrl: '/index.html'
  });
});
```

Just add code above to your `gulpfile.js` and run `gulp webserver` after that.


## Installation

It's exactly like you've already guessed:

`npm install --save-dev spa-server`


## Configuration

| Option             | Type     | Default                                     | Description                                        
|--------------------|----------|---------------------------------------------|-------------
| path               | string   | `'.'`                                       | Path to your web root                              
| fallbackUrl        | string   | `'/index.html'`                             | Forwarding URL for missing requests                
| port               | integer  | `8888`                                      | Listening port                                     
| serveStaticConfig  | object   | [See the code][serve-static-default-config] | Configuration object for serve-static middleware, see it's [options][lib-serve-static-options]


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
  [serve-static-default-config]: /lib/server.js#L10-L13
