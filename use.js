var modules = require('./vars/modules')
var mixins = require('./vars/mixins')
var hooks = require('./vars/hooks')
var middlewares = require('./vars/middlewares')
var configs = require('./vars/configs')
var dispatchAction = require('./dispatchAction');

var assign = require('./utils/assign')
var apply = require('./utils/apply')
var addMiddleware = require('./addMiddleware');
var hook = require('./hook');

module.exports = function (plugins) {
    var self = this;
    if (plugins && plugins.constructor === Array) {
        for (var i = 0; i < plugins.length; i++) {
            apply(plugins[i], [{
                configs: configs,
                modules: modules,
                hooks: hooks,
                hook: hook,
                dispatchAction: dispatchAction,
                addMiddleware: addMiddleware,
                mixin: function(obj) {
                    assign(mixins, obj);
                    return self;
                },
            }], self);
        }
    } else throw '[tunk]:the param of Array is required';
    return self;
}


