#!/usr/bin/env node

'use strict';

var colors     = require('colors'),
    os         = require('os'),
    WSServer   = require('ws').Server,
    watch      = require('node-watch'),
    httpServer = require('http-server'),
    portfinder = require('portfinder'),
    path       = require('path'),
    opener     = require('opener'),
    pkgCache   = require('../lib/lazy-package-cache'),
    getIndex   = require('../lib/get-index'),
    argv       = require('optimist')
      .boolean('cors')
      .argv;

var ifaces = os.networkInterfaces();

if (argv.h || argv.help) {
  console.log([
    'usage: http-server [path] [options]',
    '',
    'options:',
    '  -E --entry   javascript application entrypoint [./app.js]',
    '  -v --vanilla disable es2015 modules supports',
    '  -w --watch   watch changes and enable hot module replacement [true]',
    '  -t --title   index title',
    '  -p           Port to use [8080]',
    '  -a           Address to use [0.0.0.0]',
    '  -d           Show directory listings [true]',
    '  -i           Display autoIndex [true]',
    '  -g --gzip    Serve gzip files when possible [false]',
    '  -e --ext     Default file extension if none supplied [none]',
    '  -s --silent  Suppress log messages from output',
    '  --cors[=headers]   Enable CORS via the "Access-Control-Allow-Origin" header',
    '                     Optionally provide CORS headers list separated by commas',
    '  -o [path]    Open browser window after starting the server',
    '  -c           Cache time (max-age) in seconds [3600], e.g. -c10 for 10 seconds.',
    '               To disable caching, use -c-1.',
    '  -U --utc     Use UTC time format in log messages.',
    '',
    '  -P --proxy   Fallback proxy if the request cannot be resolved. e.g.: http://someurl.com',
    '',
    '  -S --ssl     Enable https.',
    '  -C --cert    Path to ssl cert file (default: cert.pem).',
    '  -K --key     Path to ssl key file (default: key.pem).',
    '',
    '  -r --robots  Respond to /robots.txt [User-agent: *\\nDisallow: /]',
    '  -h --help    Print this list and exit.'
  ].join('\n'));
  process.exit();
}

var port = argv.p || parseInt(process.env.PORT, 10),
    host = argv.a || '0.0.0.0',
    ssl = !!argv.S || !!argv.ssl,
    proxy = argv.P || argv.proxy,
    utc = argv.U || argv.utc,
    logger;

if (!argv.s && !argv.silent) {
  logger = {
    info: console.log,
    request: function (req, res, error) {
      var date = utc ? new Date().toUTCString() : new Date();
      if (error) {
        logger.info(
          '%s %s Error (%s): "%s"',
          req.method.red, req.url.red,
          error.status.toString().red, error.message.red
        );
      }
      else {
        logger.info('%s %s', req.method.yellow, req.url.cyan);
      }
    }
  };
}
else if (colors) {
  logger = {
    info: function () {},
    request: function () {}
  };
}

if (!port) {
  portfinder.basePort = 8080;
  portfinder.getPort(function (err, port) {
    if (err) { throw err; }
    listen(port);
  });
}
else {
  listen(port);
}

function listen(port) {
  var canonicalHost = host === '0.0.0.0' ? '127.0.0.1' : host,
      protocol      = ssl ? 'https://' : 'http://';

  var options = {
    root: argv._[0],
    cache: argv.c,
    showDir: argv.d,
    es2015: !(argv.v || argv.vanilla),
    autoIndex: argv.i,
    gzip: argv.g || argv.gzip,
    entry: argv.E || argv.entry,
    hot: !argv.w || argv.watch,
    title: argv.t || argv.title,
    robots: argv.r || argv.robots,
    ext: argv.e || argv.ext,
    before: [],
    logFn: logger.request,
    proxy: proxy,
    hosts: [],
    url: protocol + canonicalHost + ':' + port,
  }

  const root = options.root || '.'

  if (argv.cors) {
    options.cors = true;
    if (typeof argv.cors === 'string') {
      options.corsHeaders = argv.cors;
    }
  }

  if (ssl) {
    options.https = {
      cert: argv.C || argv.cert || 'cert.pem',
      key: argv.K || argv.key || 'key.pem',
    }
  }

  let indexContent = 'reload plz'
  const mimeHTML = { 'Content-Type': 'text/html' }
  const mimeJS = { 'Content-Type': 'application/javascript' }
  options.before.push(function (req, res) {
    const url = req.url
    if (url === '/') {
      res.writeHead(200, mimeHTML)
      return res.end(indexContent)
    } else if (/node_modules/.test(url)) {
      const start = url.lastIndexOf('node_modules')
      const end = url.lastIndexOf('.js')
      const key = path.join(root, url.slice(start, end))
      logger.info(req.method.yellow, key.slice('13').cyan)
      return pkgCache(key).then(file => {
        res.writeHead(200, mimeJS)
        res.end(file)
      }).catch(err => res.emit('next'))
      // fallback to normal behaviour
    }
    res.emit('next')
  })

  var server = httpServer.createServer(options);
  server.listen(port, host, function () {
    logger.info(['Starting up http-server, serving '.yellow,
      server.root.cyan,
      ssl ? (' through'.yellow + ' https'.cyan) : '',
      '\nAvailable on:'.yellow
    ].join(''));

    if (argv.a && host !== '0.0.0.0') {
      logger.info(('  ' + options.url).green);
      options.hosts.push(options.url)
    }
    else {
      Object.keys(ifaces)
        .reduce((a, dev) => a.concat(ifaces[dev]), [])
        .filter(details => details.family === 'IPv4')
        .map(details => details.address)
        .forEach(address => {
          options.hosts.push(protocol + address + ':' + port)
          logger.info(('  ' + protocol + address + ':' + port.toString()).green);
        });
    }

    if (typeof proxy === 'string') {
      logger.info('Unhandled requests will be served from: ' + proxy);
    }

    logger.info('Hit CTRL-C to stop the server');
    if (argv.o) {
      opener(
        protocol + '//' + canonicalHost + ':' + port,
        { command: argv.o !== true ? argv.o : null }
      );
    }

    indexContent = getIndex(options)
  });

  if (!options.hot) return
  global.server = server.server
  const wss = new WSServer({ server: server.server })
  const broadcast = data => wss.clients.forEach(c => c.send(data))
  console.log('watching for changes on', root)
  watch(root, filename => {
    if (/\.js$/.test(filename) && !/node_modules/.test(filename)) {
      console.log('broadcasting changes on', filename)
      broadcast(filename.slice(0, -3))
    }
  })
}

if (process.platform === 'win32') {
  require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('SIGINT', function () {
    process.emit('SIGINT');
  });
}

process.on('SIGINT', function () {
  logger.info('http-server stopped.'.red);
  process.exit();
});

process.on('SIGTERM', function () {
  logger.info('http-server stopped.'.red);
  process.exit();
});