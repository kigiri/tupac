const reloadModule = k => modules[k].load()
const reloadDep = deps => Promise.all(deps.map(reloadModule))
  .then(() => Promise.all(deps.map(reloadModule)))

const solve = key => Object.keys(modules).filter(k => key.indexOf(k) !== -1)[0]
const reload = (key, force) => {
  const detail = modules[key] || modules[solve(key)]

  return (!detail
   ? require(key)
   : fetchScript(detail.fullPath)
    .then(script => loadScript(detail, script))
    .then(() => reloadDep(getDependents(detail))) // lol
    .then(() => reloadDep(getDependents(detail))))
    .then(() => errorDisplay.remove())
    .catch(displayError)
    .then(() => dispatchEvent(new CustomEvent('hotreload', { detail })))
}

let __urlTries = 0
!function connect() {
  const ws = new WebSocket(hosts[__urlTries++ % hosts.length])
  ws.onopen = ev => console.log('tupac hot module connected')
  ws.onmessage = ev => reload(`./${ev.data}`)
  ws.onclose = () => setTimeout(connect, 1500)
}()