// GLOBAL POLUTION
const modules = window.__tupac_modules__ = Object.create(null)
window.__tupac_get_default__ = _ => _.__esModule ? _.default : _
window.process || (window.process = { env: {} })

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
const normalizeMatch = /\/(([^/]+)\/\.)?\.\//g
const trimNodeModules = key => key.replace(/\/node_modules\//, '')
const get = path => path
  ? path
    .split('.')
    .reverse()
    .reduce((acc, key) => obj => acc(obj && obj[key]), _ => _)
  : _ => _

const removeQuotes = str => {
  switch (str[0]) {
    case '"': case "'": case '`': return str.trim().slice(1, -1)
  }
  return str.trim()
}

const resolvePath = (rootPath, path) => {
  path = removeQuotes(path)
  return path[0] === '.' ? `${rootPath}/${path}` : path
}

const exec = fn => fn()
const fetchScript = path => {
  const headers = new Headers()

  if (!/node_modules/.test(path)) {
    headers.append('pragma', 'no-cache')
    headers.append('cache-control', 'no-cache')
  }

  return fetch(path, { headers, method: 'GET' }).then(toText)
}

const appendExt = p => /\.js$/.test(p) ? p : `${p}.js`
const appendIdx = p => /index\.js$/.test(p) ? p : `${p.slice(0,-3)}/index.js`
const appendModules = k => (k[0] === '.' || k[0] === '/')
  ? k
  : `/node_modules/${k}`

const normalizePath = key => trimNodeModules(key
  .replace(normalizeMatch, '/')
  .replace(normalizeMatch, '/'))

const tryPaths = [
  key => appendModules(appendExt(key)),
  key => appendIdx(appendModules(appendExt(key))),
]

const contextedEval = (function (script) { return eval(script) })
  .bind(window)

const applyRules = (acc, rule) => acc.replace(rule.match, rule.exec)
const replaceRules = (typeof es2015 !== 'undefined' ? es2015 : []).concat([
  {
    match: /require\(([^)]+)\)/g,
    exec: (name, setPath, path) => (setPath(path), name),
  }
])

let tail = Promise.resolve()
const loadAfterDependciesAreReady = mod => {
  tail = mod.dependencies.reduce((q, key) => q.then(() => requires(key)), tail)
}

const getDependents = (mod, acc = []) => {
  Object.keys(modules).forEach(k => {
    if (modules[k].dependencies.indexOf(mod.key) !== -1) {
      if (acc.indexOf(k) === -1) {
        acc.push(k)
        getDependents(modules[k], acc)
      }
    }
  })
  return acc
}

const cleanupPath = str => str.slice(10, str.lastIndexOf('/'))
const loadScript = (mod, script) => {
  const varKey = mod.key.replace(/[^a-zA-Z0-9]/g, '')
  const requires = []
  const names = []
  const requireIndex = inc()
  const isES2015 = /\bexports\s+[^=\.[]/.test(script)

  if (script.indexOf('//__PATH__') === 0) {
    mod.rootPath = `/${cleanupPath(script.split('\n')[0])}`
  }

  const dependents = getDependents(mod)
  console.log({ dependents })

  const formatKey = (name, path) => {
    const key = normalizePath(resolvePath(mod.rootPath, path))
    mod.dependencies.push(key)
    names.push(name)
    requires.push(() => {
      if (modules[key]) {
        if (dependents.indexOf(key) !== -1) {
          console.log('cycling dep :', mod.key, 'with', key)
          return modules[key].exports
        }
        return modules[key].ready
      }
      return require(key)
    })

    return key
  }

  script = replaceRules.reduce((acc, rule) =>
    acc.replace(rule.match, (_, ...args) => {
      const name = `__${varKey}_${requireIndex()}__`
      return rule.exec(name, path => formatKey(name, path), ...args)
    }), script)

  mod.exports = { __esModule: isES2015 }
  const load = new Function(names, `
  var module = __tupac_modules__['${mod.key}'];
  var exports = module.exports;
  ${script}
  return module.exports`)

  mod.load = () => Promise.all(requires.map(exec))
    .then(args => {
      console.log(`load ${mod.key}`, mod.dependencies)

      return load.apply(window, args)
      return mod.exports
    })
  console.log(`ready ${mod.key}`, mod.dependencies)
  return mod.load()
  return mod.exports
}

const moduleIndex = inc()
const require = key => {
  key = normalizePath(key)

  if (modules[key]) return modules[key].ready
  console.log(`req: ${key}`)

  const pathIndex = inc()
  const mod = modules[key] = {
    key,
    index: moduleIndex(),
    dependencies: [],
  }

  const retryOnError = err => {
    const idx = pathIndex()
    if (err && err.status !== 404) { throw err }
    if (idx >= tryPaths.length) throw Error(`module "${mod.key}" not found`)
    mod.fullPath = tryPaths[idx](key)
    mod.rootPath = mod.fullPath.slice(0, mod.fullPath.lastIndexOf('/'))
    return fetchScript(mod.fullPath).catch(retryOnError)
  }

  return modules[key].ready = retryOnError()
    .then(script => loadScript(mod, script))
    //.then(pass(() => console.log(`[${mod.index}] LOADED ${mod.key}`))) 
}
