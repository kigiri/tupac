const fs = require('fs')
const ava = require('ava')
const fns = require('./fns')
const colors = require('colors')
const applyTests = (t, tests, testValue) =>
  tests.forEach(({key, args}) => t[key](testValue, ...args))

const pass = _ => _
const test = (msg, execTest) => {
  const tests = []
  let assertFn
  ava(msg, t => {
    const ret = Promise.resolve(execTest(tests.length || t))
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
      script: tmp.join('\n')
    }
  })

const passTest = d => test(d.msg, fns[d.key](d))
const engine = (type, eachFn) => getDefs(type)
  .forEach(d => eachFn(passTest(d), d.result))

engine.failing = fn => engine('failing', fn)
engine.passing = fn => engine('passing', fn)

module.exports = engine

