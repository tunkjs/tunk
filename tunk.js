var tunk = require('./core');
var use = require('./use');
var config = require('./config');
var store = require('./store');
var actionMw = require('./actionMw');
var promiseMw = require('./promiseMw');
var apply = require('./utils/apply');



tunk.use = function(){return apply(use, arguments, tunk)};
tunk.config = function(){return apply(config, arguments, tunk)};
tunk.Store = store;

console.log(tunk)

use([function(utils){
    utils.addMiddleware(actionMw);
    utils.addMiddleware(promiseMw);
}]);

module.exports = tunk;


