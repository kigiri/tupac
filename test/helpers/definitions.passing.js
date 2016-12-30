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
