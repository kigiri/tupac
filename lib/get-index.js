const fs = require('fs')
const es2015Support = fs.readFileSync(`${__dirname}/injected-es2015.js`)
const injected = fs.readFileSync(`${__dirname}/injected.js`)
const hotCode = fs.readFileSync(`${__dirname}/hot.js`)
const icon = 'AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAx42QAFP/FABXQkMAQC0uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAQBEREREREREAFEREREREQQAURERERERBABREREREREEAFEREREREQQAURERERERBABQERAAEREEAFCBEIiREQQAUQgRERERBABRAJEREREEAFAJEREREQQAUJERERERBABRERERERDEAEREREREREQQAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

module.exports = ({title, hot, entry, hosts, es2015}) => `<!DOCTYPE html>
<html>
<head>
  <title>${title || 'tupac dev server'}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" type="image/x-icon" href="data:image/x-icon;base64,${icon}">
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
</html>`