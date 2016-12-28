const fs = require('mz/fs')
const { join } = require('path')
const cache = {}

const ifExists = path => fs.stat(path).then(() => path)

module.exports = key => (cache[key]
  || (cache[key] = ifExists(`${key}.js`)
    .catch(() => fs.readFile(join(key, 'package.json'))
      .then(JSON.parse)
      .then(pkg => {
        if (pkg.main) return join(key, pkg.main)
        throw Error('no main found')
      }))
    .catch(() => ifExists(join(key, 'index.js')))))
  .then(fs.readFile)






