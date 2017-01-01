'use strict'

const fs = require('fs')
const ava = require('ava')
const fetch = require('node-fetch')
const es2015 = fs.readFileSync(`${__dirname}/../../lib/injected-es2015.js`)
const injected = fs.readFileSync(`${__dirname}/../../lib/injected.js`)
const applyTests = (t, tests, testValue) =>
  tests.forEach(({key, args}) => t[key](testValue, ...args))

const handlers = {}
global.window = global
const fns = eval(`(()=>{
  ${es2015}
  ${injected}
  const _q = (key,exports)=>
    modules[key]={key,exports,q:Promise.resolve(exports)}
  _q('loadScript', {})
  _q('a', 'a')
  _q('b', 'b')
  _q('es2015', {
    __esModule: true,
    default: 'default',
    a: 'a',
    b: 'b',
  })
  return {
    get,
    require,
    loadScript,
    resolvePath,
    fetchScript,
    cleanupPath,
    normalizePath,
    normalizeMatch,
    trimNodeModules,
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
    const result = eval(`(${tmp.pop()})`)
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
  .forEach(d => eachFn(passTest(d), d))

module.exports = {
  handlers: h => Object.assign(handlers, h),
  failing: fn => engine('failing', fn),
  passing: fn => engine('passing', fn),
}

