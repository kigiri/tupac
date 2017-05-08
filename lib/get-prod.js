const { readFile, stat, realpath } = require('mz/fs')
const { resolve, join, dirname } = require('path')
const { getHTML } = require('./get-html')
const { minify } = require('uglify-js')
const { transform } = require('babel-core')

const modules = {}

// the actual loading logic
const inc = (n=0) => () => n++

const removeQuotes = str => {
  switch (str[0]) {
    case '"': case "'": case '`': return str.trim().slice(1, -1)
  }
  return str.trim()
}

const resolvePath = (path, rootPath=process.cwd()) => {
  path = removeQuotes(path)
  console.log(path, rootPath)
  return path[0] === '.'
    ? resolve(`${rootPath}/${path}`)
    : `${process.cwd()}/node_modules/${path}`
}

const appendExt = p => /\.js$/.test(p) ? p : `${p}.js`
const appendIdx = p => /index\.js$/.test(p) ? p : `${p.slice(0,-3)}/index.js`
const appendModules = k =>
  (k[0] === '.' || k[0] === '/') ? k : `/node_modules/${k}`

const exec = fn => fn()
const ifExists = path => stat(resolve(path)).then(() => path)

const getRootPath = path => {
  return dirname(path)
  //if (path.indexOf('node_modules') === -1) 
  const pathParts = path.split('/')
  const modIndex = pathParts.lastIndexOf('node_modules')
  return pathParts.slice(0, modIndex + 1).join('/')
}

let cntr = inc()
const keyCache = {}
const keyToIndex = path => {
  if (keyCache[path] !== undefined) return keyCache[path]
  return (keyCache[path] = {
    path,
    root: getRootPath(path),
    index: cntr(),
  })
}

const getterCache = {}
const w = (_, i) => (console.log(i, _), _)
const getMod = key => (getterCache[key]
  || (getterCache[key] = ifExists(appendExt(key))
    .catch((err) => {
      const { main } = require(resolve(join(key, 'package.json')))
      if (main) return ifExists(join(key, main))
      throw Error('no main found')
    })
    .catch(() => ifExists(join(key, 'index.js')))))
  .then(keyToIndex, (err => console.error('error!!!', appendExt(key))))

const body = []
const matchRequire = /require\(['"]([^)]+)['"]\)/g
const cleanupPath = str => str.slice(10, str.lastIndexOf('/'))
const loadScript = (mod, script) => {
  if (mod.load) return mod.load
  const requires = []
  const names = []
  const __esModule = /\bexports\s+[^=\.[]/.test(script)
  const requireIndex = inc()

  mod.exports = { __esModule }
  mod.dependencies = []
  mod.root || (mod.root = getRootPath(mod.path))

  const formatKey = (path, i) => getMod(resolvePath(path, mod.root))
    .then(m => {
      requires.push(req(m.path))
      mod.dependencies.push(m.index)
      const name = `$${m.index}_`
      names.push(name)
      return name
    })

  return mod.load = Promise.all(script.split(matchRequire)
    .map((a, i) => i % 2 ? formatKey(a, i) : a))
    .then(src => body.push(`$s_(${mod.index},[${mod.dependencies.join()}],function(${names.join()}){"use strict";var module={exports:{}};var exports=module.exports;
${src.join('')}
return module.exports})`))
    .then(() => Promise.all(requires))
    .then(() => body)
}

const moduleIndex = inc()
const req = key => getMod(key)
  .then(mod => (mod.script || (mod.script = readFile(mod.path, 'utf-8')))
    .then(script => loadScript(mod, script)), console.error)

module.exports = getHTML(({ entry }) => req(entry || './app').then(() => `
"use strict";
var $_=(_=>d=>Promise.all(d.map(_)))(n=>$_[n])
function $s_(i,d,f,c){Object.defineProperty($_,''+i,{get:()=>c||(c=$_(d).then(dd=>f.apply(this,dd)))})}
${body.join('\n')}
$_[0];
`)
.then(code => transform(code, {
  ast: false,
  comments: false,
  compact: true,
  minified: true,
  presets: [ 'latest' ],
}).code)
.then(code => minify([ code ], { fromString: true, compress: { dead_code: true } }).code)
)