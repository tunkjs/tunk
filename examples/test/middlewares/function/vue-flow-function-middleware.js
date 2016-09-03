(function(){

    var function_middleware = function(dispatch, next, end, context){
        return function(func){
            if(typeof func !== 'function') {
                return next(arguments);
            }

            var result = apply(func,[this.getState()], this);
            if(typeof result !=='undefined')
                next([result]);

        };
    };

	function apply(func, args, context){
        switch (args.length){
            case 0:
                return context?func.call(context):func();
            case 1:
                return context?func.call(context, args[0]):func(args[0]);
            case 2:
                return context?func.call(context, args[0], args[1]):func(args[0], args[1]);
            case 3:
                return context?func.call(context, args[0], args[1], args[2]):func(args[0], args[1], args[2]);
            case 4:
                return context?func.call(context, args[0], args[1], args[2], args[3]):func(args[0], args[1], args[2], args[3]);
            case 5:
                return context?func.call(context, args[0], args[1], args[2], args[3], args[4]):func(args[0], args[1], args[2], args[3], args[4]);
            default:
                return func.apply(context||this,args);
        }
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = function_middleware
    }
    else if (typeof define === 'function' && define.amd) {
        define(function () { return function_middleware })
    }

})();
