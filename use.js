var modules = require('./vars/modules')
var mixins = require('./vars/mixins')
var hooks = require('./vars/hooks')
var middlewares = require('./vars/middlewares')
var configs = require('./vars/configs')
var runAction = require('./runAction');

var assign = require('./utils/assign')
var apply = require('./utils/apply')
var addMiddleware = require('./addMiddleware');
var hook = require('./hook');

module.exports = function (plugins) {
    var self = this;
    if (plugins && plugins.constructor === Array) {
        for (var i = 0; i < plugins.length; i++) {
            use(plugins[i]);
        }
    } else use(plugins);

    function use(plugin){
        apply(plugin, [{
            configs: configs,
            modules: modules,
            hooks: hooks,
            hook: hook,
            runAction: runAction,
            addMiddleware: addMiddleware,
            mixin: function(obj) {
                assign(mixins, obj);
                return self;
            },
        }], self);
    }

    return self;
}


