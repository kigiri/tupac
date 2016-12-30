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
const inlineRequire = /require\(([^)]+)\)/g
const normalizeMatch = /\/(([^/]+)\/\.)?\.\//g
const trimNodeModules = key => key.replace(/\/node_modules\//, '')
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
const appendModules = k => (k[0] === '.' || k[0] === '/') ? k : `/node_modules/${k}`
const normalizePath = key => trimNodeModules(key
  .replace(normalizeMatch, '/')
  .replace(normalizeMatch, '/'))

const tryPaths = [
  key => appendModules(appendExt(key)),
  key => appendIdx(appendModules(appendExt(key))),
]

const contextedEval = (function (script) { return eval(script) })
  .bind(window)

const cleanupPath = str => str.slice(10, str.lastIndexOf('/'))
const loadScript = (mod, script) => {
  const varKey = mod.key.replace(/[^a-zA-Z0-9]/g, '')
  const requires = []
  const names = []
  const requireIndex = inc()

  if (script.indexOf('//__PATH__') === 0) {
    mod.rootPath = `/${cleanupPath(script.split('\n')[0])}`
  }

  script = script.replace(inlineRequire, (_, path) => {
    const name = `__${varKey}_${requireIndex()}__`
    const moduleKey = normalizePath(resolvePath(mod.rootPath, path))

    names.push(name)
    mod.dependencies.push(moduleKey)
    requires.push(() => require(moduleKey))
    return name
  })

  const load = contextedEval(`([${names.join()}])=> {
  const exports = {}
  const module = { exports: {} }
  const process = { env: {} }
  // Eval of ${mod.key}
  ${script}
  return module.exports
}`)

  mod.load = () => Promise.all(requires.map(exec)).then(load)
  mod.script = load.toString()

  return mod.load()
}

window.__modules = modules
const moduleIndex = inc()
const require = key => {
  key = normalizePath(key)

  if (modules[key]) return modules[key].exports

  const pathIndex = inc()
  const mod = modules[key] = {
    key,
    index: moduleIndex(),
    dependencies: []
  }

  const retryOnError = err => {
    if ((err && err.status !== 404) || pathIndex >= tryPaths.length) { throw err }
    mod.fullPath = tryPaths[pathIndex()](key)
    mod.rootPath = mod.fullPath.slice(0, mod.fullPath.lastIndexOf('/'))
    return fetchScript(mod.fullPath).catch(retryOnError)
  }

  return mod.exports = retryOnError()
    .then(script => loadScript(mod, script))
    .then(pass(() => console.log(`[${mod.index}] LOADED ${mod.key}`))) 
}
