const es2015 = []
const addRule = (match, exec) => es2015.push({ match, exec })

addRule(/\b(import\s+(.+?)\s+from\s+([^\s]+?));?\s/g,
  (name, setPath, _, l, r) => {
    setPath(r)
    if (/\s*\*\s/.test(l)) {
      l = l.replace(/^\s*\*\s+as\s/, '')
    } else if ((l.indexOf('{') === -1)) {
      return `const ${l} = __tupac_get_default__(${name})\n`
    }
    return `const ${l} = ${name}\n`
  })

addRule(/\b(export)\s+(function\s+([^(]+))/g,
  (a,b,c, fn, key) => `module.exports.${key} = ${key};${fn}`)

addRule(/\b(export)\s+(var|let|const)\s+(\S+)/g,
  (a,b,c, decl, key) => `${decl} ${key} = module.exports.${key}`)

addRule(/\b(export\s+default)\b/g,
  () => `module.exports.default =`)

addRule(/\b(export\s+(\S+)\s+as\s+(\S+))\b/g,
  (a,b,c, val, key) => `module.exports.${key} = ${val}`)

addRule(/\b(export\s+(\S+))\b/g,
  (a,b,c, key) => `module.exports.${key} = ${key}`)
