var hooks = require('./vars/hooks')

/* 
tunk.hook(hookName, function(origin){
    return function(arg1, arg2, arg3 ...){
        ... your code
        return origin.call(null, arg1, arg2, arg3 ...); 
    }
});
*/
function hook(hookName, func) {
    var originHook = hooks[hookName];
    if (!originHook) throw '[tunk]:hook ' + hookName + ' is not exist';
    if (typeof func !== 'function') throw '[tunk]:the second argument of hook should be a function';
    func = func(originHook);
    if (typeof func !== 'function') throw '[tunk]:the function should return a hook function';
    hooks[hookName] = func;
}

module.exports = hook;