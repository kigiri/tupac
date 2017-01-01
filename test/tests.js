const { failing, passing, handlers } = require('./helpers')

// format arguments parsed from the definition forwarded to the tested function
let i = 0
handlers({
  loadScript: ({ value, msg }) => {
    const key = `_${msg.replace(/\s/g, '_')}_${++i}_`
    __tupac_modules__[key] = { exports: {} }
    return [
      { key, index: 0, dependencies: [] },
      value,
    ]
  }
})

passing(({ is, deepEqual }, {result}) => (result && result instanceof Object)
  ? deepEqual(result)
  : is(result))

failing((test, { result }) => {
  test(((t, err) => {
    t.true(err instanceof Error)
    t.regex(err.message, result)
  }))
})
