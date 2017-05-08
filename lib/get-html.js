const fs = require('mz/fs')
const path = require('path')
const icon = 'AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAx42QAFP/FABXQkMAQC0uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAQBEREREREREAFEREREREQQAURERERERBABREREREREEAFEREREREQQAURERERERBABQERAAEREEAFCBEIiREQQAUQgRERERBABRAJEREREEAFAJEREREQQAUJERERERBABRERERERDEAEREREREREQQAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
//const purify = require('purify-css')
const cssnano = require('cssnano')

const getBaseDir = entry => entry
  ? path.dirname(path.isAbsolute(entry)
    ? entry
    : path.resolve(process.cwd(), entry))
  : process.cwd()

const inline = (entry, key, defaults = '') =>
  fs.readFile(path.join(getBaseDir(entry), key), 'utf-8')
    .catch(() => defaults)

const getHTML = getScript => opts => Promise.all([
  getScript(opts),
  inline(opts.entry, 'style.css'),
]).then(([ script, style ]) => Promise.all([
  script,
  cssnano.process(style, { discardComments: { removeAll: true }}),
/*    purify(`<body></body><script>${script}</script>`, style, {
    //rejected: true,
    info: true,
    whitelist: [
      '*progress*',
      '*alert*',
      '*btn*',
    ],
  }) */
  //  
]))
  .then(([ script, style ]) => `<!DOCTYPE html><html><head>
  <title>${opts.title || 'tupac dev server'}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <link rel="shortcut icon" type="image/x-icon" href="data:image/x-icon;base64,${icon}">
  <style>${style}</style>
  </head><body></body>
  <script type="text/javascript">${script}</script>
  </html>`)

module.exports = {
  getHTML,
  getBaseDir,
  inline,
}