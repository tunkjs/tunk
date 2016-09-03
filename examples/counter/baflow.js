var store = {},
    models = {},
    connections = [],
    mixins = {},
    middlewares = [],
    hook_beforeStore = [],
    hook_beforeFlowIn = [],
    stateUpdateHandlers = [];

var baflow = {
    config: {
        cloneMode: 'deep', //deep,shallow
    },
};


baflow.action = function action(target, property, descriptor) {
    target[property]._isAction_ = true;
}


baflow.extend = function (opt) {
    console.log(arguments);
    if (typeof opt === 'function') {
        return extend(opt.name, opt);
    } else return function (target, property, descriptor) {
        return extend(target.name, target);
    };
}

function extend(name, target) {

    var protos = target.prototype;

    if (!name || !protos) throw 'two arguments are required';

    Object.assign(protos, mixins, {
        getState: function getState(otherModelName) {
            if (!otherModelName) return clone(store[name]);
            else return clone(store[otherModelName]);
        }
    });

    Object.defineProperties(protos, {
        'state': {
            get: function () {
                return this.getState();
            },
            set: function () {
                throw 'you can not set state via the property of state, please use dispatch instead';
            }
        }
    });

    var properties = Object.getOwnPropertyNames(target.prototype);

    for (var i = 0, l = properties.length, x = properties[i]; i < l; i++, x = properties[i]) {

        if (protos[x] && protos[x]._isAction_)
            protos[x] = (function (modelName, actionName, originAction) {

                protos.dispatch = dispatch;

                return function () {
                    var result = apply(originAction, arguments, models[modelName]);
                    if (typeof result !== 'undefined') return dispatch.call(models[modelName], result);
                };

                function dispatch() {
                    return run_middlewares(this, arguments, {
                        modelName: modelName,
                        actionName: actionName,
                        models: models,
                        store: store,
                    }, dispatch);
                }
            })(name, x, protos[x]);
    }

    store[name] = {};

    models[name] = new target();

    return models[name];

};


baflow.dispatch = function (modelName, options) {
    if (modelName && modelName.constructor === String)
        storeState(options, modelName, 'Vue.flow');
    else throw 'the first argument should be a model name the second shuould be a plain object';
};

baflow.bind = function (bindName, func) {
    if (typeof func === 'function')
        switch (bindName) {
            case 'beforeStore':
                hook_beforeStore.push(func);
                break;
            case 'beforeFlowIn':
                hook_beforeFlowIn.push(func);
        }
    else throw 'a callback as the second argument is needed';
};

baflow.addMiddleware = function (middleware) {
    if (typeof middleware === 'object' && middleware.constructor === Array)
        middlewares = middlewares.concat(middleware);
    else if (typeof middleware === 'function') middlewares.push(middleware);
};

baflow.mixin = function (obj) {
    Object.assign(mixins, obj);
};


baflow.__ = {
    connectState:function(targetObject, stateOptions){
        var initailState = {};
        if (stateOptions) {
            for (var x in stateOptions) if (stateOptions.hasOwnProperty(x) ){
                if(typeof stateOptions[x] === 'string' && stateOptions[x].indexOf('.') > -1) {
                    var statePath = stateOptions[x].split('.');
                    connections[statePath[0]] = connections[statePath[0]] || [];
                    connections[statePath[0]].push({
                        comp: targetObject,
                        dataName: x,
                        statePath: statePath,
                    });

                    //设置组件默认数据
                    initailState[x] = pathValue(statePath);
                }else{
                    throw 'please check the state options of ' + x+':'+stateOptions[x];
                }
            }
        }
        return initailState;
    },
    connectActions:function(target, actionOptions){
        if (actionOptions) {
            var action;
            for (var x in actionOptions) if (actionOptions.hasOwnProperty(x)) {
                if(typeof actionOptions[x] === 'string' && actionOptions[x].indexOf('.') > -1) {
                    action = actionOptions[x].split('.');
                    if (!models[action[0]]) throw 'the model ' + action[0] + ' is not exist';
                    if (!models[action[0]][action[1]]) throw 'the action ' + action[1] + ' of model ' + action[0] + ' is not exist';
                    target[x] = (function (modelName, actionName) {
                        return function () {
                            apply(models[modelName][actionName], arguments, models[modelName]);
                        };
                    })(action[0], action[1]);
                }else{
                    throw 'please check the action options of ' + x+':'+actionOptions[x];
                }
            }
        }


    },
    connectDispatch:function(target, name){
        target[name] = function(name, arg1, arg2, arg3){
            if(typeof name !== 'string' || name.indexOf('.') === -1) throw 'please check the action of '+ name;
            name = name.split('.');
            if (!models[name[0]]) throw 'the model ' + name[0] + ' is not exist';
            if (!models[name[0]][name[1]]) throw 'the action ' + name[1] + ' of model ' + name[0] + ' is not exist';
            apply(models[name[0]][name[1]], Array.prototype.slice.call(arguments, 1), models[name[0]]);
        }
    },

    disconnect:function(target, stateOptions, actionOptions){
        if (stateOptions) {
            var statePath, tmp;
            for (var x in stateOptions) if (stateOptions.hasOwnProperty(x)) {
                statePath = stateOptions[x].split('.');
                tmp = [];
                for (var i = 0, l = connections[statePath[0]].length; i < l; i++) {
                    if (connections[statePath[0]][i].comp !== target) tmp.push(connections[statePath[0]][i]);
                }
                connections[statePath[0]] = tmp;
            }
        }
    },

    //function(targetObject, stateName, newValue, action)
    addStateUpdatedListener:function(handler) {
        stateUpdateHandlers.push(handler);
    }


};



baflow.mixin({

    each: function (obj, cb) {
        if (typeof obj === 'object') {
            if (typeof obj.length !== 'undefined') {
                for (var i = 0, l = obj.length; i < l; i++)
                    if (cb(obj[i], i) === false) break;
            } else for (var x in obj)
                if (obj.hasOwnProperty(x) && cb(obj[x], x) === false) break;
        } else console.error('argument is wrong');
    },

    map: function (obj, cb) {
        var tmp, result = [];
        this.each(obj, function (value, key) {
            tmp = cb(value, key);
            if (typeof tmp !== 'undefined') result.push(tmp);
        });
        return result;
    },

    find: function (obj, cb) {
        var result;
        this.each(obj, function (value, key) {
            if (cb(value, key)) {
                result = value;
                return false;
            }
        });
        return result;
    },

    clone: clone,

});

function run_middlewares(model, args, context, dispatch) {
    var index = 0;

    return next(args);

    function next(args) {
        if (typeof args !== 'object' || isNaN(args.length)) throw 'please make sure the param of next is type of array or argument';
        if (index < middlewares.length)
            return apply(middlewares[index++](dispatch, next, end, context), args, model);
        else return end(args[0]);
    }

    function end(result) {
        if (!result) return;
        if (result.constructor !== Object) {
            console.log(arguments);
            throw 'the argument of end should be a plain data object';
        }
        index = middlewares.length;
        result = run_beforeStore_hooks(result, store[context.modelName]);
        return storeState(result, context.modelName, context.actionName)
    }
}

//数据进出 store 通过 clone 隔离
function storeState(obj, modelName, actionName) {
    var pathValue_,
        state = store[modelName],
        pipes = connections[modelName],
        changedFields = Object.keys(obj),
        meta,
        changedState = clone(obj),
        values = {};

    Object.assign(state, changedState);

    if (pipes && pipes.length) for (var i = 0, l = pipes.length; i < l; i++) if (pipes[i]) {

        // 只更新 changedFields 字段
        if (pipes[i].statePath[1] && changedFields.indexOf(pipes[i].statePath[1]) === -1) continue;

        //减少克隆次数，分发出去的数据用同一个副本，减少调用 pathValue
        pathValue_ = values[pipes[i].statePath] || (values[pipes[i].statePath] = pathValue(pipes[i].statePath));

        meta = {
            name: pipes[i].dataName,
            value: pathValue_,
            action: modelName + '.' + actionName
        };

        // 数据流入前hook
        run_beforeFlowIn_hooks(pipes[i].comp, meta);

        for(var i=0;i<stateUpdateHandlers.length;i++)
            stateUpdateHandlers[i](pipes[i].comp, pipes[i].dataName, pathValue_, modelName + '.' + actionName);

    }

    return changedState;

}

function run_beforeStore_hooks(newState, state) {
    var result;
    for (var i = 0, l = hook_beforeStore.length; i < l; i++) {
        result = hook_beforeStore[i](newState, state);
        if (typeof result === 'object') newState = result;
    }
    return newState;
}

function run_beforeFlowIn_hooks(comp, meta) {
    for (var i = 0, l = hook_beforeStore.length; i < l; i++) {
        hook_beforeFlowIn[i].call(comp, meta);
    }
}

//提升效率空间：支持两层 && 不克隆

//支持5层
function pathValue(statePath) {
    var state = store[statePath[0]];
    if (!statePath[1]) return clone(state);
    else {
        state = isNaN(statePath[1]) ? state[statePath[1]] : (state[statePath[1]] || state[parseInt(statePath[1])]);
        if (!statePath[2] || typeof state !== 'object') return clone(state);
        else {
            state = isNaN(statePath[2]) ? state[statePath[2]] : (state[statePath[2]] || state[parseInt(statePath[2])]);
            if (!statePath[3] || typeof state !== 'object') return clone(state);
            else {
                state = isNaN(statePath[3]) ? state[statePath[3]] : (state[statePath[3]] || state[parseInt(statePath[3])]);
                if (!statePath[4] || typeof state !== 'object') return clone(state);
                else {
                    return clone(isNaN(statePath[4]) ? state[statePath[4]] : (state[statePath[4]] || state[parseInt(statePath[4])]));
                }
            }
        }
    }
}

function clone(obj) {
    if (typeof obj === 'object')
        return baflow.config.cloneMode === 'deep' ?
            JSON.parse(JSON.stringify(obj)) :
            ( obj.constructor === Array ? obj.slice() : Object.assign({}, obj) );
    else return obj;
}

function apply(func, args, context) {
    switch (args.length) {
        case 0:
            return context ? func.call(context) : func();
        case 1:
            return context ? func.call(context, args[0]) : func(args[0]);
        case 2:
            return context ? func.call(context, args[0], args[1]) : func(args[0], args[1]);
        case 3:
            return context ? func.call(context, args[0], args[1], args[2]) : func(args[0], args[1], args[2]);
        case 4:
            return context ? func.call(context, args[0], args[1], args[2], args[3]) : func(args[0], args[1], args[2], args[3]);
        case 5:
            return context ? func.call(context, args[0], args[1], args[2], args[3], args[4]) : func(args[0], args[1], args[2], args[3], args[4]);
        default:
            return func.apply(context || this, args);

    }

}




if (typeof module === 'object' && module.exports) {
    module.exports = baflow;
}
else if (typeof define === 'function' && define.amd) {
    define(function () {
        return baflow;
    })
}

