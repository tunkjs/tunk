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
        
        return dispatchAction(name[0], name[1], Array.prototype.slice.call(arguments, 1))
    };
};

