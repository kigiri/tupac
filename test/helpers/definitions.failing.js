//@loadScript failing parse extra begining
module.exports = _require('a')
/is not defined/
//@loadScript failing extra end
module.exports = require_('a')
/is not defined/
//@loadScript failing parse double require
module.exports = requirerequire('a')
/is not defined/

//@loadScript unsupported parenstack
module.exports = require(('a'))
/\bUnexpected\b/
//@loadScript unsupported function call
module.exports = require((() => 'a')())
/\bUnexpected\b/
