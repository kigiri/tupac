"use strict"
const __require__ = (() => {

window.module = Object.create(null)
const modules = Object.create(null)
const toText = res => {
  if (res.ok) return res.text()
  const err = Error(res.statusText)
  err.Headers = res.Headers
  err.status = res.status
  err.url = res.url
  throw err
}

const inc = (n=0) => () => n++
const pass = fn => _ => (fn(_), _)
const requireMatch = /(?:const|var|let) ([a-zA-Z0-9]+) ?= ?require\(([^(]+)\)\.?([^\s;]+)?/g
const inlineRequire = /require\(([^(]+)\)/g
const normalizeMatch = /\/(([^/]+)\/\.)?\.\//g
const trimNodeModules = key => key.replace(/\/node_modules\//, '')
const getExport = result => (module.exports = undefined, result)
const get = path => path
  ? path
    .split('.')
    .reverse()
    .reduce((acc, key) => obj => acc(obj && obj[key]), _ => _)
  : _ => _

const resolvePath = (rootPath, path) => {
  path = eval(path)
  return path[0] === '.' ? `${rootPath}/${path}` : path
}
const exec = fn => fn()
const fetchScript = path => fetch(path).then(toText)
const appendExt = p => /\.js$/.test(p) ? p : `${p}.js`
const appendIdx = p => /index\.js$/.test(p) ? p : `${p.slice(0,-3)}/index.js`
const appendModules = k => (k[0] === '.' || k[0] === '/') ? k : `/node_modules/${k}`
const normalizePath = key => trimNodeModules(key
  .replace(normalizeMatch, '/')
  .replace(normalizeMatch, '/'))

const tryPaths = [
  key => appendExt(appendModules(key)),
  key => appendIdx(appendExt(appendModules(key))),
]

const loadScript = (_module, script) => {
  const varKey = _module.key.replace(/[^a-zA-Z0-9]/g, '')
  const requires = []
  const names = []

  script = script.replace(requireMatch, (a, name, path, rekey) => {
    const moduleKey = normalizePath(resolvePath(_module.rootPath, path))
    const getter = get(rekey)

    names.push(name)
    _module.dependencies.push(moduleKey)
    requires.push(() => _require(moduleKey).then(getExport).then(getter))
    return ''
  })

  const importIndex = inc()
  script = script.replace(inlineRequire, (_, path) => {
    const name = `__${varKey}_${importIndex()}__`
    const moduleKey = normalizePath(resolvePath(_module.rootPath, path))

    names.push(name)
    _module.dependencies.push(moduleKey)
    requires.push(() => _require(moduleKey).then(getExport))
    return name
  })

  const load = eval(`([${names.join()}])=> {
  //  Eval of ${_module.key}
  ${script}
  return module.exports
}`)

  _module.load = () => Promise.all(requires.map(exec)).then(load)

  return _module.load()
}

const _moduleIndex = inc()
const _require = key => {
  key = normalizePath(key)

  if (modules[key]) return modules[key].exports

  const pathIndex = inc()
  const _module = modules[key] = {
    key,
    index: _moduleIndex(),
    dependencies: []
  }
  const retryOnError = err => {
    if ((err && err.status !== 404) || pathIndex >= tryPaths.length) { throw err }
    _module.fullPath = tryPaths[pathIndex()](key)
    _module.rootPath = _module.fullPath.slice(0, _module.fullPath.lastIndexOf('/'))
    return fetchScript(_module.fullPath).catch(retryOnError)
  }

  return _module.exports = retryOnError()
    .then(script => loadScript(_module, script))
    .then(pass(() => console.log(`[${_module.index}] LOADED ${_module.key}`))) 
}

const getDependents = (_module, acc = []) => {
  Object.keys(modules).forEach(k => {
    if (modules[k].dependencies.indexOf(_module.key) !== -1) {
      getDependents(modules[k], acc)
      if (acc.indexOf(k) === -1) {
        acc.push(k)
      }
    }
  })
  return acc
}

_require.modules = modules
_require.reload = key => {
  const _module = modules[key]
  return fetchScript(_module.fullPath)
    .then(script => loadScript(_module, script))
    .then(result => Promise.all(getDependents(_module).map(k => modules[k].load()))
      .then(pass(() => console.log(`[${_module.index}] RELOADED ${_module.key}`))))
}

return _require
})()