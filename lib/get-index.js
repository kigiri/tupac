const fs = require('mz/fs')
const path = require('path')
const icon = 'AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAx42QAFP/FABXQkMAQC0uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAQBEREREREREAFEREREREQQAURERERERBABREREREREEAFEREREREQQAURERERERBABQERAAEREEAFCBEIiREQQAUQgRERERBABRAJEREREEAFAJEREREQQAUJERERERBABRERERERDEAEREREREREQQAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

const getBaseDir = entry => entry
  ? path.dirname(path.isAbsolute(entry)
    ? entry
    : path.resolve(process.env.PWD, entry))
  : process.env.PWD

const inline = (entry, key, defaults = '') =>
  fs.readFile(path.join(getBaseDir(entry), key))
    .catch(() => defaults)

module.exports = ({title, hot, entry, hosts, es2015}) => Promise.all([
  es2015 && fs.readFile(`${__dirname}/injected-es2015.js`),
  fs.readFile(`${__dirname}/injected.js`),
  fs.readFile(`${__dirname}/hot.js`),
  inline(entry, 'style.css'),
]).then(([ es2015Support, injected, hotCode, style ]) => `<!DOCTYPE html>
<html>
<head>
  <title>${title || 'tupac dev server'}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" type="image/x-icon" href="data:image/x-icon;base64,${icon}">
  <style>${style}</style>
  <script type="text/javascript">
    "use strict";
    (() => {
      const hosts = ${JSON.stringify(hosts.map(url =>
        url.replace(/^http/, 'ws')))}
      ${es2015 ? es2015Support : ''}
      ${injected}
      ${hot ? hotCode : ''}
      require('${entry || './app'}')
    })()
  </script>
</head>
<body></body>
</html>`)