const { failing, passing } = require('./helpers')

passing(({ is }, result) => is(result))

failing((test, result) => test(((t, err) => {
  t.true(err instanceof Error)
  t.throws(Promise.reject(err), result)
})))
