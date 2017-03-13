const { readFile } = require('mz/fs')
const { getHTML } = require('./get-html')

module.exports = getHTML(({ hot, entry, hosts, weso, es2015, port }) =>
  Promise.all([
    es2015 && readFile(`${__dirname}/injected-es2015.js`),
    readFile(`${__dirname}/injected.js`),
    readFile(`${__dirname}/hot.js`),
  ]).then(([ es2015Support, injected, hotCode ]) => `
"use strict";
const useWeso = ${weso}
window.__tupac__port__ = ${port};
(() => {
  const hosts = ${JSON.stringify(hosts.map(url => url.replace(/^http/, 'ws')))}
  ${es2015 ? es2015Support : ''}
  ${injected}
  ${hot ? hotCode : ''}
  require('${entry || './app'}')
})()
`))