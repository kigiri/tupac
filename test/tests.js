const { failing, passing, handlers } = require('./helpers')

// format arguments parsed from the definition forwarded to the tested function
handlers({
  loadScript: ({ value, key, msg }) => [
    { key, index: 0, dependencies: [] },
    value,
  ]
})

passing(({ is, deepEqual }, result) => (result && result instanceof Object)
  ? deepEqual(result)
  : is(result))

failing((test, result) => test(((t, err) => {
  t.true(err instanceof Error)
  t.throws(Promise.reject(err), result)
})))
