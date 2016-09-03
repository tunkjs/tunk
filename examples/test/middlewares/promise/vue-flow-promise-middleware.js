(function(){

    var promise_middleware = function(dispatch, next, end, context){
        return function(promise){
            if(typeof promise !== 'object' || !promise.then) {
                return next(arguments);
            }
            promise.then(function(result){
                setTimeout(function(){next([result]);});
            });
        };
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = promise_middleware
    }
    else if (typeof define === 'function' && define.amd) {
        define(function () { return promise_middleware })
    }
})();
