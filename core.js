
var apply = require('./utils/apply');
var _clone = require('./utils/clone');
var _defineHiddenProps = require('./utils/defineHiddenProps')
var _getProperties = require('./utils/getProperties')
var _assign = require('./utils/assign')

var modules = require('./vars/modules')
var mixins = require('./vars/mixins')
var middlewares = require('./vars/middlewares')
var configs = require('./vars/configs')
var hooks = require('./vars/hooks')


var store;

function tunk(_store) {
    if (!_store.setState || !_store.getState) throw '[tunk]:the store should had method setState & getState';
    store = _store;
    return tunk;
}

tunk.action = function (opts, property) {
    if (typeof property === 'string' && opts[property]) {
        opts[property].options = { isAction: true };
        return opts[property];
    } else return function (target, property, descriptor) {
        target[property].options = _assign({ isAction: true }, opts);
        return target[property];
    }
}

tunk.create = function () {
    var moduleName, opts, module;

    if (typeof arguments[0] === 'function') {
        if (!arguments[0].__getName__) throw '[tunk]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
        module = hooks.compose(arguments[0], _assign({ moduleName: arguments[0].__getName__() }, configs));
        return hooks.initialize(module, module.prototype.options);
    }

    if (arguments[0]) if (typeof arguments[0] === 'string') {
        moduleName = arguments[0];
    } else if (typeof arguments[0] === 'object') {
        opts = arguments[0];
    }

    if (arguments[1]) if (typeof arguments[1] === 'string') {
        moduleName = arguments[1];
    } else if (typeof arguments[1] === 'object') {
        opts = arguments[1];
    }

    return function (target, property, descriptor) {
        moduleName = moduleName || opts && opts.name || target.__getName__ && target.__getName__();
        if (!moduleName) throw '[tunk]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
        opts = _assign({ moduleName: moduleName }, configs, opts);
        module = hooks.compose(arguments[0], opts);
        return hooks.initialize(module, module.prototype.options);
    };
}

tunk.Action = function (target, opts) {
    target.options = _assign({ isAction: true }, opts);
    return target;
};

/**
tunk.Create('Ajax', {
    constructor:function Ajax(){},
    get:tunk.Action(function(){}, {}),
    base(){},
}, options);
 */
tunk.Create = function (moduleName, protos, opts) {
    if (typeof moduleName !== 'string') throw '[tunk]:the name of module is required.';
    if (!protos || typeof protos !== 'object' || !protos.constructor || typeof protos.constructor !== 'function')
        throw '[tunk]:the second param should be an object and had constructor.';
    if (!protos.constructor.prototype) throw '[tunk]:the constructor should be {constructor: function(){}}, but not be { constructor(){} }';
    var module = protos.constructor;
    _assign(module.prototype, protos);
    opts = opts || {};
    module = hooks.compose(module, _assign({ moduleName: moduleName }, configs, opts));
    console.log({module});
    
    return hooks.initialize(module, module.prototype.options);
};

_assign(hooks, {

    compose: function (module, opts) {

        var moduleName = opts.moduleName;

        if (!moduleName) throw '[tunk]:the name of module was required.';

        var protos = module.prototype;

        protos.moduleName = moduleName;

        var properties = _getProperties(module);

        for (var i = 0, l = properties.length; i < l; i++) if (protos[properties[i]]) {
            protos[properties[i]] = _override(moduleName, protos, properties[i], _assign({ actionName: properties[i] }, opts, protos[properties[i]].options || {}));
        }

        _assign(protos, mixins, protos, {
            getState: function getState(path) {
                if (!path) path = [];
                if(typeof path === 'string') path = path.split('.')
                path.unshift(this.options.moduleName);
                return hooks.getState(path, opts);
            },
            dispatch: dispatch
        });

        protos.options = opts;

        _defineHiddenProps(protos, protos);

        function dispatch() {
            return hooks.runMiddlewares(this, arguments, dispatch, dispatch.options || protos.options);
        }

        return module;
    },

    initialize: function (module, opts) {

        var moduleName = opts.moduleName;

        if (modules[moduleName]) throw '[tunk]:the module ' + moduleName + ' already exists';

        if (!store) throw '[tunk]:a store need to be set to tunk';

        modules[moduleName] = new module();

        // 初次读取触发钩子
        hooks.setState(modules[moduleName].state || {}, opts);

        delete modules[moduleName].state;

        return modules[moduleName];
    },

    
    callAction: function (originAction, args, module, options) {
        var result = apply(originAction, args, module);
        if (typeof result !== 'undefined') {
            return module.dispatch(result);
        }
    },

    runMiddlewares: function (module, args, dispatch, options) {
        var index = 0,
            checkEndlessLoop = 0;
        return next(args);
        function next(args) {
            if (!args[0]) return args[0];
            if (checkEndlessLoop++ > 1024) throw '[tunk]: Endless loop in middlewares.';
            if (typeof args !== 'object' || isNaN(args.length)) throw '[tunk]:the param of next should be type of array or arguments';
            if (index < middlewares.length) {
                return apply(middlewares[index++](dispatch, next, options), args, module);
            } else {
                if (args.length === 1 && args[0] && typeof args[0] === 'object' && typeof args[0].then !== 'function') {
                    hooks.setState(args[0], options);
                    return args[0];
                }else{
                    index = 0;
                    return next(args);
                }
            }
        }
    },

    setState: function (newState, options) {
        return store.setState(options.moduleName, newState);
    },

    getState: function (path, options) {
        
        return store.getState(path);
    }
});

function _override(moduleName, protos, protoName, options) {
    if (protos[protoName].options && protos[protoName].options.isAction) {
        return _createAction(moduleName, protoName, protos[protoName], options);
    } else return protos[protoName];
}

function _createAction(moduleName, actionName, originAction, opts) {
    action.options = opts;
    return action;
    function action() {
        var prevOpts = this.dispatch.options,
            result;
        this.dispatch.options = action.options
        result = hooks.callAction(originAction, arguments, this, action.options);
        this.dispatch.options = prevOpts;
        return result;
    }
}

module.exports = tunk;

