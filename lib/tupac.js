'use strict'

const colors = require('colors')
const os = require('os')
const watch = require('node-watch')
const portfinder = require('portfinder')
const httpServer = require('http-server')
const path = require('path')
const opener = require('opener')
const pkgCache = require('./lazy-package-cache')
const getIndex = require('./get-index')
const argv = require('optimist')
  .boolean('cors')
  .argv

const ifaces = os.networkInterfaces()

if (argv.h || argv.help) {
  console.log([
    'usage: tupac [path] [options]',
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
  ].join('\n'))
  process.exit()
}

let port = argv.p || parseInt(process.env.PORT, 10)
const host = argv.a || '0.0.0.0'
const ssl = !!argv.S || !!argv.ssl
const proxy = argv.P || argv.proxy
const utc = argv.U || argv.utc
const logger = {
  info: console.log,
  request: ({ method, url }, res, error) => {
    if (!error) return
    const { status, message } = error
    logger.info(`${method.yellow} ${url.cyan} ${(status +' '+ message).red}`)
  }
}

if (argv.s || argv.silent) {
  logger.info = logger.request = () => {}
}

const startTupac = (port, extraOptions) => {
  const canonicalHost = host === '0.0.0.0' ? '127.0.0.1' : host
  const protocol = ssl ? 'https://' : 'http://'
  const options = {
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
    before: argv.before || [],
    logFn: logger.request,
    proxy: proxy,
    hosts: [],
    url: protocol + canonicalHost + ':' + port,
  }

  extraOptions && Object.assign(options, extraOptions)

  const root = options.root || '.'

  if (argv.cors) {
    options.cors = true;
    if (typeof argv.cors === 'string') {
      options.corsHeaders = argv.cors
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
  options.before.push((req, res) => {
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

  const server = httpServer.createServer(Object.assign(options, { port, host }))
  server.listen(port, host, () => {
    logger.info([
      'Starting up tupac, serving '.yellow,
      server.root.cyan,
      (ssl || '') && (' through'.yellow + ' https'.cyan),
      '\nAvailable on:'.yellow,
    ].join(''))

    if (argv.a && host !== '0.0.0.0') {
      logger.info(('  ' + options.url).green);
      options.hosts.push(options.url)
    } else {
      Object.keys(ifaces)
        .reduce((a, dev) => a.concat(ifaces[dev]), [])
        .filter(details => details.family === 'IPv4')
        .map(details => details.address)
        .forEach(address => {
          options.hosts.push(protocol + address + ':' + port)
          logger.info(('  ' + protocol + address + ':' + port.toString()).green)
        })
    }

    if (typeof proxy === 'string') {
      logger.info('Unhandled requests will be served from: ' + proxy)
    }

    logger.info('Hit CTRL-C to stop the server')
    if (argv.o) {
      opener(protocol + '//' + canonicalHost + ':' + port, {
        command: argv.o !== true ? argv.o : null,
      })
    }

    getIndex(options).then(index => indexContent = index)
  })

  if (!options.hot) return server.server
  let broadcast
  if (extraOptions.weso) {
    broadcast = (...args) => global.weso
      && (broadcast = weso.publish.tupac)(...args)
  } else {
    global.server = server.server
    const WSServer = require('ws').Server
    const wss = new WSServer({ server: server.server })
    broadcast = data => wss.clients.forEach(c => c.send(data))
  }

  const watchOptions = {
    filter : filename => !/node_modules/.test(filename)
      && !/\/\.git/.test(filename)
      && (!/\.[a-zA-Z0-9]+$/.test(filename)
        || /\.js$/.test(filename))
  }
  const ww = watch(root, watchOptions, filename => {
    logger.info('broadcasting changes on', filename.green)
    broadcast(filename.slice(0, -3))
  })
  setTimeout(() => {
    logger.info(`watching ${ww.watchers.length} files for changes on ${root.green}`)
  }, 1500)
  return server.server
}

module.exports = (opts = {}) => new Promise((s, f) => {
  port || (port = opts.port)
  if (port) return s(startTupac(port, opts))
  portfinder.basePort = 8080
  portfinder.getPort((err, port) => err
    ? f(err)
    : s(startTupac(port, opts)))
})

if (process.platform === 'win32') {
  require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  }).on('SIGINT', () => process.emit('SIGINT'))
}

const logExit = () => {
  logger.info('http-server stopped.'.red)
  process.exit()
}

process.on('SIGINT', logExit)
process.on('SIGTERM', logExit)
