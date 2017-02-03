const reloadModule = k => modules[k].load()
const reloadDep = deps => Promise.all(deps.map(reloadModule))
  .then(() => Promise.all(deps.map(reloadModule)))

const reload = key => {
  const detail = modules[key]
  return !detail
   ? console.log('unable to find module', key)
   : fetchScript(detail.fullPath)
    .then(script => loadScript(detail, script))
    .then(() => reloadDep(getDependents(detail)))
    .then(() => dispatchEvent(new CustomEvent('hotreload', { detail })))
}

let __urlTries = 0
!function connect() {
  const ws = new WebSocket(hosts[__urlTries++ % hosts.length])
  ws.onopen = ev => console.log('tupac hot module connected')
  ws.onmessage = ev => reload(`./${ev.data}`)
  ws.onclose = () => setTimeout(connect, 1500)
}()