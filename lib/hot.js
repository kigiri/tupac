const reload = key => {
  const module = modules[key]
  return !module
   ? console.log('unable to find module', key)
   : fetchScript(module.fullPath)
    .then(script => loadScript(module, script))
    .then(result =>
      Promise.all(getDependents(module).map(k => modules[k].load())))
    .then(pass(() =>
      dispatchEvent(new CustomEvent('hotreload', { 'detail': module }))))
}

!function connect() {
  const ws = new WebSocket(url)
  ws.onopen = ev => console.log('tupac hot module connected')
  ws.onmessage = ev => reload(`./${ev.data}`)
  ws.onclose = () => setTimeout(connect, 1500)
}()