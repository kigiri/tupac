# tupac
`tupac` Mad easy ghetto bundler (2pac ur JS)

A stupid simple in browser developement bundler with close to 0 overhead and no configuration needed.


## Installing:
```shell
npm install tupac -g
```
This will install `tupac` globally so that it may be run from the command line

## usage
```shell
### create your project folder
mkdir my-thug-project-js && cd "$_"

### init package.json
yarn init -y

### install some stuff
yarn add lodash

### create the entry point
echo "document.body.textContent = require('lodash/words')('Reality is wrong. Dreams are for real.').join(' - ')" >> app.js

### start the server
tupac
```
You can now edit your JS like a thug and enjoy effortless hotreload and code splitting.

![](https://github.com/kigiri/tupac/raw/master/poster.jpg)


## Available Options:
`-E` or `--entry` javascript app entry file (defaults to app.js)

`-w` or `--watch` enable websocket server and watch changes for hot module reload (defaults to true, 2pac is always hot)

`-t` or `--title` index file title

Implement also all the options from http-server

*see the documentation for [http-server](https://github.com/indexzero/http-server)*

## Browser API:
### Hot Reload Event
After a hot reload, the event `hotreload` is triggered from `window`
```javascript
window.addEventListener('hotreload', ({ detail: module }) => console.log(module))
```

### Globals
All modules are called from `window` and `this` is bound to `window`.

`__tupac_modules__` is an object containing all the module data.

`__tupac_get_default__` is a function that return the exported data (handeling es6 modules)

if not present a mocked `process` is created (some modules failed without it)

## Notice:
  - Pure JS only (if you need support for more TypeScript, JSX or esle : go webpack)
  - In browser async compilation of the requires *(if a module exports a `Promise` it will wait for it's resolve value)*
  - little support for es6 modules 
  - !! NOT FOR PRODUCTION !!

## FAQ:
#### Q. wat about css dog ?!
A. I like to use [glamor](https://github.com/threepointone/glamor) but any css-in-js alternative should do the job

#### Q. No jsx ?! Are you out of your mind ???!
A. ¯\\\_(ツ)\_/¯

*try hyperscript and hyperscript-helpers for react. I made my own version of those tools that I should release one day, soon.*
