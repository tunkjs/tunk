var modules = require('./vars/modules')
var apply = require('./utils/apply');

module.exports = function dispatchAction(moduleName, actionName, argsArray) {
    if (!modules[moduleName]) throw '[tunk]:unknown module name ' + moduleName + '.';
    if (!modules[moduleName][actionName]) throw '[tunk]:unknown action name ' + actionName + ' of ' + moduleName + '';
    if (!modules[moduleName][actionName].options || !modules[moduleName][actionName].options.isAction) throw '[tunk]:the method ' + actionName + ' of ' + moduleName + ' is not an action';
    return apply(modules[moduleName][actionName], argsArray || [], modules[moduleName]);
}
