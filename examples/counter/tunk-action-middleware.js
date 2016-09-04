(function(){

    var action_middleware = function(dispatch, next, end, context){
        return function(name, options){
            if(typeof name !== 'string') {
                return next(arguments);
            }
            if (name.indexOf('.') === -1) name = [context.modelName, name];
            else name = name.split('.');
            if (!context.models[name[0]]) throw 'the model ' + name[0] + ' is not exist';
            if (!context.models[name[0]][name[1]]) throw 'the action ' + name[1] + ' of model ' + name[0] + ' is not exist';
            return apply(context.models[name[0]][name[1]], Array.prototype.slice.call(arguments,1), context.models[name[0]]);
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
        module.exports = action_middleware
    }
    else if (typeof define === 'function' && define.amd) {
        define(function () { return action_middleware })
    }

})();
