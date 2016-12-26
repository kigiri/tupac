const fs = require('fs')
const injected = fs.readFileSync(__dirname + '/injected.js')
const icon = 'AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAx42QAFP/FABXQkMAQC0uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAQBEREREREREAFEREREREQQAURERERERBABREREREREEAFEREREREQQAURERERERBABQERAAEREEAFCBEIiREQQAUQgRERERBABRAJEREREEAFAJEREREQQAUJERERERBABRERERERDEAEREREREREQQAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

module.exports = ({title, hot, entry}) => `<!DOCTYPE html>
<html>
<head>
  <title>${title || 'tupac dev server'}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" type="image/x-icon" href="data:image/x-icon;base64,${icon}">
<script type="text/javascript">
${injected}
</script>
</head>
<body>
  <script type="text/javascript">
    __require__('${entry || './app'}')
    ${hot ? "__require__('"+__dirname +"/hot')" : ''}
  </script>
</body>
</html>`