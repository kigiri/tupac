//@loadScript basic
module.exports = require('a')
'a'
//@loadScript declaration with var
var a = require('a')
module.exports = a
'a'
//@loadScript declaration with let
let a = require('a')
module.exports = a
'a'
//@loadScript handle closure first
(() => {})()
let a = require('a')
module.exports = a
'a'
//@loadScript declaration with const
const a = require('a')
module.exports = a
'a'
//@loadScript multilines declaration
var a = require('a'),
    b = require('b')
module.exports = a + b
'ab'
//@loadScript dot
module.exports = require('a').length
1
//@loadScript dot with whitespace
module.exports = require('a')
  .length
1
//@loadScript compose
module.exports = require('a') + require('b')
'ab'
//@loadScript destructuring
const { length } = (require('a') + require('b'))
module.exports = length
2

//@loadScript es2015 module import default
import def from 'es2015'
export def
{ def: 'default' }
//@loadScript es2015 module import destructuring
import { a } from 'es2015'
export a
{ a: 'a' }
//@loadScript es2015 module export default
import { a } from 'es2015'
export default a
{ default: 'a' }
//@loadScript es2015 module
import * as all from 'es2015'
export all
{ all: { __esModule: true, default: 'default', a: 'a', b: 'b' } }
//@loadScript es2015 module export var
export var a = 'lol'
{ a: 'lol' }
//@loadScript es2015 module export let
export let a = 'lol'
{ a: 'lol' }
//@loadScript es2015 module export const
export const a = 'lol'
{ a: 'lol' }