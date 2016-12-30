const fs = require('fs')
const fetch = require('node-fetch')
const injected = fs.readFileSync(`${__dirname}/../../lib/injected.js`)

const fns = eval(`(() => {
  const window = {}
  ${injected}
  modules.a = { exports: Promise.resolve('a') }
  modules.b = { exports: Promise.resolve('b') }
  return {
    require,
    inlineRequire,
    normalizeMatch,
    trimNodeModules,
    get,
    resolvePath,
    fetchScript,
    normalizePath,
    cleanupPath,
    loadScript,
  }
})()`)

module.exports = Object.assign({}, fns, {
  loadScript: ({ script, key, msg }) => () => fns.loadScript({
    key,
    index: 0,
    dependencies: [],
  }, script)
})