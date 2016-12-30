const fs = require('fs')
const ava = require('ava')
const fetch = require('node-fetch')
const injected = fs.readFileSync(`${__dirname}/../../lib/injected.js`)
const applyTests = (t, tests, testValue) =>
  tests.forEach(({key, args}) => t[key](testValue, ...args))

const handlers = {}
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

const pass = _ => _
const test = (msg, execTest) => {
  const tests = []
  let assertFn
  ava(msg, t => {
    const ret = Promise.resolve().then(execTest)
    if (tests.length) {
      t.plan(tests.length)

      return ret.then(val => applyTests(t, tests, val), pass)
    }
    if (assertFn) {
      return ret.then(pass, pass).then(result => assertFn(t, result))
    }
    t.fail('missing tests')
  })

  const pxy = new Proxy(_assertFn => assertFn = _assertFn, {
    get: (_, key) => (...args) => (tests.push({ key, args }), pxy)
  })

  return pxy
}

const getDefs = type => fs
  .readFileSync(`${__dirname}/definitions.${type}.js`)
  .toString()
  .split('\/\/@')
  .filter(Boolean)
  .map(testStr => {
    const tmp = testStr.split('\n').filter(Boolean)
    const msg = tmp.shift()
    const key = msg.split(' ')[0]
    const result = eval(tmp.pop())
    return {
      key,
      msg,
      result,
      value: tmp.join('\n')
    }
  })

const getArgs = d => (handlers[d.key] || (_ => [_]))(d)
const passTest = d => test(d.msg, () => fns[d.key](...getArgs(d)))
const engine = (type, eachFn) => getDefs(type)
  .forEach(d => eachFn(passTest(d), d.result))

module.exports = {
  handlers: h => Object.assign(handlers, h),
  failing: fn => engine('failing', fn),
  passing: fn => engine('passing', fn),
}

