var modules = require('./vars/modules');
var apply = require('./utils/apply');
var dispatchAction = require('./dispatchAction');
module.exports = function (dispatch, next, options) {
    return function (name) {
        if (typeof name !== 'string') {
            return next(arguments);
        }
        if (name.indexOf('.') === -1) name = [options.moduleName, name];
        else name = name.split('.');

        // 孤立模块禁止调起其他模块的action
        if(options.isolate && options.moduleName !== name[0]) 
            throw '[tunk]:An isolated module cannot call action of other module';

        // 普通模块禁止调起非孤立模块的action
        if(!modules[name[0]].options.isolate) 
            throw '[tunk]:you can only call action of an isolated module';

        return dispatchAction(name[0], name[1], Array.prototype.slice.call(arguments, 1))
    };
};

