var tunk = require('./core');
var use = require('./use');
var config = require('./config');
var Store = require('./store');
var promiseMw = require('./promiseMw');
var apply = require('./utils/apply');


tunk(new Store());
tunk.use = function(){return apply(use, arguments, tunk)};
tunk.config = function(){return apply(config, arguments, tunk)};

use([function(utils){
    utils.addMiddleware(promiseMw);
}]);

module.exports = tunk;


