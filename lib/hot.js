const getDependents = (module, acc = []) => {
  Object.keys(modules).forEach(k => {
    if (modules[k].dependencies.indexOf(module.key) !== -1) {
      getDependents(modules[k], acc)
      if (acc.indexOf(k) === -1) {
        acc.push(k)
      }
    }
  })
  return acc
}

const reload = key => {
  const module = modules[key]
  if (!module) return console.log('unable to find module', key)
  return fetchScript(module.fullPath)
    .then(script => loadScript(module, script))
    .then(result => Promise.all(getDependents(module).map(k => modules[k].load()))
      .then(pass(() => console.log(`[${module.index}] RELOADED ${module.key}`))))
}

!function connect() {
  const ws = new WebSocket(url)
  ws.onopen = ev => console.log('tupac hot module connected')
  ws.onmessage = ev => reload(`./${ev.data}`)
  ws.onclose = () => setTimeout(connect, 1500)
}()